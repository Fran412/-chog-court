# Chog Court

A social courtroom where your Chog is your legal identity. Chogs rule on internet and Web3 disputes, and every ruling goes on a permanent record keyed to the **token ID**, not the wallet. Sell the Chog and its record goes with it.

## Run it

No build step. Demo mode works if you open `index.html` straight from the folder. **Wallets do not**: browsers stop wallet extensions from reaching `file://` pages, so the page sees no wallet. To connect a wallet, either deploy the folder to any static host (Vercel, Netlify, GitHub Pages) or serve it locally with `npx serve` and open the `http://localhost` address it prints. If several wallet extensions are installed, Connect wallet shows a picker.

## What works today

- Docket of 14 seeded cases: 9 "record" cases (outcome documented in the file) and 5 "jury" cases (outcome is the simulated jury's majority). Three are featured each day, the rest sit in the archive.
- Roles from traits: Stern = Judge, Chaotic = Prosecutor, Gentle = Defender, Sly = Witness. Each role sees a bench-only exhibit on every case. A Chog also gets a "home turf" instinct on cases in its specialty.
- Accuracy and rank per token: Clerk, Juror, Magistrate, Justice, Chief Justice, and Court Clown for Chogs that keep getting it wrong.
- Leaderboard (ranked after 5 cases), daily streaks, optional one-line reasoning on each ruling.
- Demo mode with six sample Chogs, plus "Simulate a sale" to show the record staying with the token.
- Wallet connect (raw JSON-RPC, no libraries) that loads a holder's Chogs from the contract, reads `tokenURI` metadata and shows the real art.

## Before you submit: things you must fill in

1. **`config.js` → `NFT_CONTRACT`**: the official Chog NFT contract address. It is left blank on purpose; get it from the official Chog channels, not from memory or a search. Until it is set, wallet mode connects but cannot list Chogs.
2. **`config.js` → `CHAIN`**: check the Monad chain ID and RPC against the Monad docs.
3. **`config.js` → `mapTraits`**: map the real Chog trait names to temperament, specialty and rarity. Until you do, traits come from a hash of the token's attributes, so roles are stable but not meaningful.
4. **Shared records (optional but recommended)**: by default records live in the browser (`localStorage`), keyed by token ID. To make a record follow the token across devices and owners, set up the Supabase backend:
   1. Create a Supabase project and run `supabase/schema.sql`, then `supabase/seed_cases.sql` in the SQL editor.
   2. Deploy the function: `supabase functions deploy submit-ruling`, with secrets `RPC_URL` (Monad RPC) and `NFT_CONTRACT`.
   3. Put the project URL and anon key in `config.js` → `BACKEND`.

   With the backend on, a ruling needs a wallet signature. The function checks the signature, checks that the signer owns the token right now, and decides correctness itself. Readers see the same record whoever holds the token.

   **Tested:** the client flow against a stub wallet and a mock server (signed message format matches what the function rebuilds, a new owner sees the old owner's record, a ruled case can't be re-ruled). **Not tested:** the edge function and SQL against a live Supabase project, and real signature verification. Do a live end-to-end run before relying on it.

## Honest limits

- The cases and their outcomes are authored sample content (all parties fictional). For the real thing, seed from real resolved disputes or predictions.
- "Jury" outcomes are fixed numbers, not live votes. A live version would collect rulings from holders and settle each case after a deadline.
- The case outcomes ship inside `cases.js`, so anyone who reads the page source can see the answers. That is fine for a demo. If rankings ever carry prizes, keep outcomes only on the server and reveal each one after the ruling.

## Files

`index.html`, `styles.css`, `app.js` (logic), `cases.js` (docket), `config.js` (chain, trait mapping, backend), `supabase/` (schema, seed, edge function), `DEMO.md` (video script and testing instructions for the submission).
