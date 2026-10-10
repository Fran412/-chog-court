// Supabase edge function: submit-ruling
//
// Accepts a ruling only if (1) the signature is valid for the stated wallet, (2) that wallet owns
// the Chog right now, (3) the case exists and the signed message is fresh. Correctness is decided
// here from the cases table, so the browser cannot claim a ruling was right.
//
// Required secrets (supabase secrets set ...):
//   RPC_URL          JSON-RPC endpoint for the chain the NFT lives on (Monad)
//   NFT_CONTRACT     the Chog NFT contract address (lowercase or checksummed)
// Provided automatically by Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// Deploy: supabase functions deploy submit-ruling
// NOTE: this file has not been run against a live project. Test it with a real signature first.

import { createClient } from "npm:@supabase/supabase-js@2";
import { createPublicClient, http, parseAbi, verifyMessage, isAddress } from "npm:viem@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const MAX_AGE_MS = 5 * 60 * 1000;

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

// Must match rulingMessage() in app.js character for character.
function rulingMessage(contract: string, tokenId: string, caseId: string, vote: string, ts: number) {
  return `Chog Court ruling\nContract: ${contract.toLowerCase()}\nToken: ${tokenId}\nCase: ${caseId}\nVote: ${vote}\nTime: ${ts}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "POST only" });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return reply(400, { error: "Invalid JSON" }); }

  const contract = String(b.contract ?? "");
  const tokenId = String(b.tokenId ?? "");
  const caseId = String(b.caseId ?? "");
  const vote = String(b.vote ?? "");
  const account = String(b.account ?? "");
  const signature = String(b.signature ?? "");
  const ts = Number(b.ts);
  const note = typeof b.note === "string" ? b.note.slice(0, 240) : "";

  if (!isAddress(contract) || !isAddress(account)) return reply(400, { error: "Bad address" });
  if (contract.toLowerCase() !== (Deno.env.get("NFT_CONTRACT") ?? "").toLowerCase()) return reply(400, { error: "Wrong collection" });
  if (!/^\d{1,78}$/.test(tokenId)) return reply(400, { error: "Bad token id" });
  if (vote !== "guilty" && vote !== "not guilty") return reply(400, { error: "Bad vote" });
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_AGE_MS) return reply(400, { error: "Signature expired. Try again." });

  // 1. Signature must be from the stated wallet over the exact message.
  const valid = await verifyMessage({
    address: account as `0x${string}`,
    message: rulingMessage(contract, tokenId, caseId, vote, ts),
    signature: signature as `0x${string}`,
  }).catch(() => false);
  if (!valid) return reply(401, { error: "Signature does not match this wallet" });

  // 2. That wallet must own the token right now.
  const chain = createPublicClient({ transport: http(Deno.env.get("RPC_URL")!) });
  let owner: string;
  try {
    owner = (await chain.readContract({
      address: contract as `0x${string}`,
      abi: parseAbi(["function ownerOf(uint256) view returns (address)"]),
      functionName: "ownerOf",
      args: [BigInt(tokenId)],
    })) as string;
  } catch {
    return reply(400, { error: "Token not found" });
  }
  if (owner.toLowerCase() !== account.toLowerCase()) return reply(403, { error: "This wallet does not own that Chog" });

  // 3. The case must exist. Correctness comes from the server's copy, never from the client.
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: c } = await db.from("cases").select("outcome").eq("id", caseId).maybeSingle();
  if (!c) return reply(400, { error: "Unknown case" });
  const correct = c.outcome === vote;

  const { error } = await db.from("rulings").insert({
    contract: contract.toLowerCase(),
    token_id: tokenId,
    case_id: caseId,
    vote,
    correct,
    note,
    ruled_by: account.toLowerCase(),
  });
  if (error) {
    if (error.code === "23505") return reply(409, { error: "This Chog has already ruled on that case" });
    return reply(500, { error: "Could not save the ruling" });
  }
  return reply(200, { ok: true, correct });
});
