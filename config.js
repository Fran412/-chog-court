// Chog Court configuration.
// Fill in NFT_CONTRACT with the official Chog NFT contract address to switch from demo Chogs to the
// holder's real tokens. Verify the address and chain on the official Chog channels before using it.
window.CHOG_CONFIG = {
  // ERC-721 contract of the Chog NFT collection. Left empty on purpose: do not guess this value.
  NFT_CONTRACT: "0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763",

  // Monad mainnet. Verify these values against the Monad docs before shipping.
  CHAIN: {
    chainId: "0x8f", // 143
    chainName: "Monad",
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: ["https://rpc.monad.xyz"],
    blockExplorerUrls: ["https://monadvision.com"]
  },

  IPFS_GATEWAY: "https://ipfs.io/ipfs/",

  // Shared records. Leave both empty to keep records in this browser only (demo behaviour).
  // url:     your Supabase project URL, e.g. https://abcd1234.supabase.co
  // anonKey: the project's public anon key (safe to ship; writes go through the edge function).
  BACKEND: { url: "https://rutyudtsbojomnkiiflg.supabase.co", anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dHl1ZHRzYm9qb21ua2lpZmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1OTQ3MzUsImV4cCI6MjEwNzE3MDczNX0.dgl7MVtATHx8rXuRXWLnKHCKBUTt7SgxcbIrj-z9yrw" },

  // Maps a token's metadata attributes to courtroom traits. Edit this once the real Chog trait
  // names are known. Until then, traits are derived from a hash of the token's attributes, so
  // every token gets a stable role, but it is not yet based on what the trait means.
  mapTraits(attributes, tokenId) {
    return null; // return { temperament, specialty, rarity } to override the hash fallback
  }
};
