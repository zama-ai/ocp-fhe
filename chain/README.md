## Usage

### Build

```shell
$ npm install
$ npm run compile
```

### Test

```shell
$ npm run test
```

### Environment variables

```env
# Hardhat vars (set via: npx hardhat vars set KEY VALUE)
# Used by hardhat.config.ts via vars.get(...)
MNEMONIC="test test test test test test test test test test test junk"
RPC_URL=https://sepolia.infura.io/v3/your-key
ETHERSCAN_API_KEY=your_etherscan_key

# Optional gas reporter
REPORT_GAS=true
```

### Local network (optional)

Use Anvil/Hardhat node in another terminal if needed:

```shell
npx hardhat node
```

### Deploy (example)

Deploy the reference diamond and factory (adjust network):

```shell
npx hardhat run deploy/deployFactory.ts --network sepolia
```

### Format

```shell
$ npm run lint:sol
```

## Zama FHE integration (contracts)

This package integrates Zama FHEVM to store and compute on encrypted integers (`euint64`). The `PrivateStockFacet` configures the coprocessor and oracle, imports encrypted inputs, and sets per‑address read permissions.

### Initialization

In `PrivateStockFacet.initialize()` we configure the network coprocessor and the decryption oracle (Sepolia in this setup):

```solidity
function initialize() public initializer {
    FHE.setCoprocessor(ZamaConfig.getSepoliaConfig());
    FHE.setDecryptionOracle(ZamaConfig.getSepoliaOracleAddress());
}
```

Call `initialize()` once after adding the facet to the Diamond.

### Issuing encrypted private stock

`issuePrivateStocks(IssuePrivateStockParams[] params, bytes inputProof)` expects encrypted inputs produced off‑chain using the Zama Relayer SDK:

```solidity
// Import external encrypted inputs using the proof from the SDK
position.quantity = FHE.fromExternal(params.quantity, inputProof)
position.share_price = FHE.fromExternal(params.share_price, inputProof)

// Grant read permissions to founder (msg.sender) and investor
FHE.allowThis(position.quantity)
FHE.allow(position.quantity, msg.sender)
FHE.allow(position.quantity, params.stakeholder_address)

FHE.allowThis(position.share_price)
FHE.allow(position.share_price, msg.sender)
FHE.allow(position.share_price, params.stakeholder_address)
```

Notes:
- `params.quantity` and `params.share_price` are `externalEuint64` values produced by the SDK.
- `inputProof` is returned by the SDK and must be passed unchanged to the contract call.

### Reading and decrypting

Getter functions (e.g., `getPrivateStockPosition`) return ciphertexts (`euint64` serialized in ABI as `bytes32`). Authorized users decrypt client‑side using the Relayer SDK + Oracle flow. Unprivileged users receive only ciphertexts.

High level:
- Read: call the getter → receive ciphertexts.
- Decrypt: use the Relayer SDK to request decryption. The oracle returns a proof/share enabling plaintext recovery only if the caller was granted access via `FHE.allow`.

### Network

- Current config targets Sepolia via `ZamaConfig`. For other networks, replace the coprocessor and oracle configuration accordingly.
