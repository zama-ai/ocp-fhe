## Demo Frontend (FHE integration)

This Next.js app demonstrates encrypted allocations using Zama’s Relayer SDK and the `PrivateStockFacet` on the Diamond. 

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment variables

```env
# WalletConnect/Reown project id (required for wallet modal)
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id

# Factory contract address (CapTableFactory)
NEXT_PUBLIC_FACTORY_ADDRESS=0xYourFactoryAddress

# Optional predefined wallets (for demo/testing flows)
NEXT_PUBLIC_WALLET_PRIVATE_KEY_FOUNDER_ACME=0x...
NEXT_PUBLIC_WALLET_PRIVATE_KEY_INVESTOR_ANGEL=0x...
NEXT_PUBLIC_WALLET_PRIVATE_KEY_INVESTOR_BETA=0x...
NEXT_PUBLIC_WALLET_PRIVATE_KEY_INVESTOR_CHARLIE=0x...
NEXT_PUBLIC_WALLET_PRIVATE_KEY_PUBLIC=0x...
NEXT_PUBLIC_WALLET_PRIVATE_KEY_ADMIN=0x...

# Optional Upstash Redis for names/metadata
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```