# CapTable Deployment Scripts

This directory contains deployment scripts for the CapTable factory and individual CapTable instances.

## Overview

The deployment process is split into two phases:

1. **Factory Deployment** (`deployFactory.ts`) - One-time deployment of the factory infrastructure
2. **CapTable Deployment** (Hardhat task) - Deploy individual CapTable instances using the factory

## Prerequisites

1. Configure your Hardhat environment variables:

   ```bash
   npx hardhat vars set MNEMONIC "your mnemonic here"
   npx hardhat vars set RPC_URL "your sepolia rpc url here"
   ```

2. Ensure you have sufficient ETH on Sepolia for deployment

## Phase 1: Factory Deployment

Deploy the factory infrastructure (only needs to be done once):

```bash
npx hardhat run deploy/deployFactory.ts --network sepolia
```

This script will:

- Deploy all 13 facets (DiamondCut, DiamondLoupe, Issuer, Stakeholder, etc.)
- Create a reference diamond with all facets properly configured
- Deploy the CapTableFactory contract
- Save all addresses to `deployments/sepolia.json`
- Initialize an empty CapTable registry in `deployments/capTables.json`

### Expected Output

```
============================================================
DEPLOYING CAPTABLE FACTORY INFRASTRUCTURE
============================================================
Network: sepolia
Chain ID: 11155111
Deployer: 0x...
Deployer balance: 1.5 ETH
============================================================

📦 PHASE 1: Deploying Facets
----------------------------------------
Deploying DiamondCutFacet...
✅ DiamondCutFacet: 0x...
[... all facets ...]

💎 PHASE 2: Creating Reference Diamond
----------------------------------------
Deploying reference CapTable diamond...
✅ Reference Diamond: 0x...
Configuring diamond cuts...
Adding 11 facets to reference diamond...
✅ All facets added to reference diamond

🏭 PHASE 3: Deploying CapTableFactory
----------------------------------------
Deploying CapTableFactory...
✅ CapTableFactory: 0x...
✅ Factory configuration verified

💾 PHASE 4: Saving Deployment Addresses
----------------------------------------
✅ Addresses saved to: deployments/sepolia.json
✅ CapTable registry initialized: deployments/capTables.json

============================================================
🎉 FACTORY DEPLOYMENT COMPLETE!
============================================================
```

## Phase 2: CapTable Instance Deployment

Deploy individual CapTable instances using the factory via Hardhat task:

```bash
npx hardhat deploy-captable --network sepolia --issuer-id <ISSUER_ID> --shares <INITIAL_SHARES>
```

### Parameters

- `--issuer-id`: 16-byte hex string (32 hex characters) representing the unique issuer identifier
- `--shares`: Initial number of authorized shares (positive integer)

### Examples

```bash
# Deploy a CapTable for issuer with 1 billion shares
npx hardhat deploy-captable --network sepolia --issuer-id 0x12345678901234567890123456789012 --shares 1000000000

# Deploy a CapTable for another issuer with 10 million shares
npx hardhat deploy-captable --network sepolia --issuer-id 0xabcdefabcdefabcdefabcdefabcdefab --shares 10000000
```

### Expected Output

```
============================================================
DEPLOYING CAPTABLE INSTANCE
============================================================
Network: sepolia
Chain ID: 11155111
Deployer: 0x...
============================================================

📋 DEPLOYMENT PARAMETERS
----------------------------------------
Raw Issuer ID: 0x12345678901234567890123456789012
Raw Shares: 1000000000
Validated Issuer ID: 0x12345678901234567890123456789012
Validated Shares: 1000000000

📂 LOADING DEPLOYMENT DATA
----------------------------------------
✅ Factory address: 0x...
✅ Reference diamond: 0x...
✅ Loaded registry with 0 existing CapTables

🏭 CONNECTING TO FACTORY
----------------------------------------
✅ Factory connection verified

🚀 DEPLOYING CAPTABLE
----------------------------------------
Creating CapTable via factory...
✅ Transaction sent: 0x...
⏳ Waiting for confirmation...
✅ Transaction confirmed in block: 12345
⛽ Gas used: 2500000
🎉 CapTable deployed successfully!
📍 CapTable Address: 0x...

📝 UPDATING REGISTRY
----------------------------------------
✅ Registry updated
📊 Total CapTables in registry: 1

============================================================
🎉 CAPTABLE DEPLOYMENT COMPLETE!
============================================================
```

## File Structure

```
chain/deploy/
├── deployFactory.ts          # Factory deployment script
├── listCapTables.ts          # Utility to view deployed CapTables
├── README.md                 # This file
└── deployments/
    ├── sepolia.json          # Factory and facet addresses
    └── capTables.json        # Registry of all deployed CapTables

chain/tasks/
└── CapTable.ts               # Hardhat tasks for CapTable deployment
```

## Deployment Files

### `deployments/sepolia.json`

Contains all factory infrastructure addresses:

```json
{
  "network": "sepolia",
  "deployedAt": "2025-01-14T15:04:09.000Z",
  "deployer": "0x...",
  "facets": {
    "DiamondCutFacet": "0x...",
    "DiamondLoupeFacet": "0x...",
    "IssuerFacet": "0x..."
    // ... all facets
  },
  "referenceDiamond": "0x...",
  "factory": "0x..."
}
```

### `deployments/capTables.json`

Registry of all deployed CapTable instances:

```json
{
  "network": "sepolia",
  "capTables": [
    {
      "address": "0x...",
      "issuerId": "0x12345678901234567890123456789012",
      "initialShares": "1000000000",
      "deployedAt": "2025-01-14T15:04:09.000Z",
      "deploymentTx": "0x...",
      "deployer": "0x..."
    }
  ]
}
```

## Error Handling

### Common Errors

1. **Missing factory deployment**:

   ```
   Error: Deployment addresses not found for network: sepolia. Please run deployFactory.ts first.
   ```

   Solution: Run `deployFactory.ts` first.

2. **Invalid issuer ID format**:

   ```
   Error: Invalid issuer ID format. Expected 32 hex characters (16 bytes), got: 0x123
   ```

   Solution: Provide a valid 16-byte hex string (32 hex characters).

3. **Invalid shares**:

   ```
   Error: Invalid shares format. Expected positive integer, got: -1
   ```

   Solution: Provide a positive integer for shares.

4. **Insufficient balance**:
   ```
   Error: insufficient funds for intrinsic transaction cost
   ```
   Solution: Add more ETH to your deployer account.

## Gas Costs (Approximate)

- **Factory Deployment**: ~15-20M gas (expensive, one-time)
- **CapTable Instance**: ~2-3M gas (cheaper, per instance)

## Security Notes

1. The factory deployment makes the deployer the initial owner of the reference diamond
2. Each CapTable instance transfers ownership to the deployer after creation
3. Access control is properly initialized for each instance
4. All deployments are logged and tracked in the registry

## Utility Scripts

### List Deployed CapTables

View all deployed CapTables and factory information using either method:

**Option 1: Hardhat Task (Recommended)**

```bash
npx hardhat list-captables --network sepolia
```

**Option 2: Direct Script**

```bash
npx hardhat run deploy/listCapTables.ts --network sepolia
```

Both methods provide:

- Factory deployment status and addresses
- Summary table of all deployed CapTables
- Detailed view with full addresses and metadata
- Statistics (total shares, unique deployers, deployment dates)
- Etherscan links for Sepolia network

### Expected Output

```
CAPTABLE DEPLOYMENT STATUS
Network: sepolia
Total CapTables: 2
Factory Address: 0x...
Reference Diamond: 0x...
Factory Deployed: 1/14/2025, 3:04:09 PM

DEPLOYED CAPTABLES
│ #   │ Address                                   │ Issuer ID                          │ Shares     │ Deployed           │
├─────┼───────────────────────────────────────────┼────────────────────────────────────┼────────────┼────────────────────┤
│ 1   │ 0x1234...5678                             │ 0x1234567890...789012              │ 1.0B       │ 1/14/2025          │
│ 2   │ 0xabcd...efgh                             │ 0xabcdefabcd...defab               │ 10.0M      │ 1/14/2025          │
└─────┴───────────────────────────────────────────┴────────────────────────────────────┴────────────┴────────────────────┘

DETAILED VIEW

📋 CapTable #1
────────────────────────────────────────
Address:        0x1234567890123456789012345678901234567890
Issuer ID:      0x12345678901234567890123456789012
Initial Shares: 1000000000 (1.0B)
Deployed At:    1/14/2025, 3:04:09 PM
Deployer:       0x...
Deploy Tx:      0x...
Etherscan:      https://sepolia.etherscan.io/address/0x...
Deploy Tx:      https://sepolia.etherscan.io/tx/0x...
```

## Phase 3: Private Stock Interaction

Once you have deployed CapTable instances, you can interact with them using the private stock tasks. These tasks allow you to issue FHE-encrypted private stock and read the encrypted positions.

### Prerequisites for Private Stock Operations

1. **Deployed CapTable**: You need a deployed CapTable instance (from Phase 2)
2. **FHEVM Environment**: Private stock operations require FHEVM for encryption/decryption
3. **Proper Roles**: The signer must have appropriate roles (OPERATOR_ROLE for issuing, authorized parties for reading)

### Available Private Stock Tasks

#### 1. Issue Private Stock

Issue FHE-encrypted private stock to a stakeholder:

```bash
npx hardhat issue-private-stock --network sepolia --captable <CAPTABLE_ADDRESS> --stakeholder <STAKEHOLDER_ADDRESS> --stock-class <STOCK_CLASS_ID> --quantity <QUANTITY> --price <PRICE>
```

**Parameters:**

- `--captable`: Address of the CapTable contract
- `--stakeholder`: Address of the stakeholder receiving the stock
- `--stock-class`: 16-byte hex string (32 hex characters) representing the stock class ID
- `--quantity`: Number of shares to issue (positive integer)
- `--price`: Price per share in smallest unit (positive integer)

**Example:**

```bash
npx hardhat issue-private-stock --network sepolia --captable 0x1234567890123456789012345678901234567890 --stakeholder 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd --stock-class 0x12345678901234567890123456789012 --quantity 1000 --price 500
```

#### 2. Get Private Stock Position

Retrieve and decode a specific private stock position:

```bash
npx hardhat get-private-stock-position --network sepolia --captable <CAPTABLE_ADDRESS> --security-id <SECURITY_ID>
```

**Parameters:**

- `--captable`: Address of the CapTable contract
- `--security-id`: 16-byte hex string (32 hex characters) representing the security ID

**Example:**

```bash
npx hardhat get-private-stock-position --network sepolia --captable 0x1234567890123456789012345678901234567890 --security-id 0xabcdefabcdefabcdefabcdefabcdefab
```

#### 3. List Private Securities

List all private securities for a stakeholder in a specific stock class:

```bash
npx hardhat list-private-securities --network sepolia --captable <CAPTABLE_ADDRESS> --stakeholder <STAKEHOLDER_ADDRESS> --stock-class <STOCK_CLASS_ID>
```

**Parameters:**

- `--captable`: Address of the CapTable contract
- `--stakeholder`: Address of the stakeholder
- `--stock-class`: 16-byte hex string (32 hex characters) representing the stock class ID

**Example:**

```bash
npx hardhat list-private-securities --network sepolia --captable 0x1234567890123456789012345678901234567890 --stakeholder 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd --stock-class 0x12345678901234567890123456789012
```

#### 4. Private Stock Summary

Get comprehensive private stock portfolio overview for a stakeholder:

```bash
npx hardhat private-stock-summary --network sepolia --captable <CAPTABLE_ADDRESS> --stakeholder <STAKEHOLDER_ADDRESS> --stock-class <STOCK_CLASS_ID>
```

**Parameters:**

- `--captable`: Address of the CapTable contract
- `--stakeholder`: Address of the stakeholder
- `--stock-class`: 16-byte hex string (32 hex characters) representing the stock class ID

**Example:**

```bash
npx hardhat private-stock-summary --network sepolia --captable 0x1234567890123456789012345678901234567890 --stakeholder 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd --stock-class 0x12345678901234567890123456789012
```

### Private Stock Workflow Example

Here's a complete workflow for working with private stocks:

```bash
# 1. First, deploy a CapTable (if not already done)
npx hardhat deploy-captable --network sepolia --issuer-id 0x12345678901234567890123456789012 --shares 1000000000

# 2. Issue private stock to a stakeholder
npx hardhat issue-private-stock --network sepolia --captable 0x1234567890123456789012345678901234567890 --stakeholder 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd --stock-class 0x12345678901234567890123456789012 --quantity 1000 --price 500

# 3. List all private securities for the stakeholder
npx hardhat list-private-securities --network sepolia --captable 0x1234567890123456789012345678901234567890 --stakeholder 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd --stock-class 0x12345678901234567890123456789012

# 4. Get detailed position information (use security ID from step 3)
npx hardhat get-private-stock-position --network sepolia --captable 0x1234567890123456789012345678901234567890 --security-id 0xabcdefabcdefabcdefabcdefabcdefab

# 5. Get portfolio summary
npx hardhat private-stock-summary --network sepolia --captable 0x1234567890123456789012345678901234567890 --stakeholder 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd --stock-class 0x12345678901234567890123456789012
```

### Expected Output Examples

#### Issue Private Stock Output

```
ISSUING PRIVATE STOCK
Network: sepolia
Chain ID: 11155111
Signer: 0x...
Signer balance: 1.5 ETH

📋 VALIDATING PARAMETERS
----------------------------------------
✅ CapTable Address: 0x1234567890123456789012345678901234567890
✅ Stakeholder Address: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
✅ Stock Class ID: 0x12345678901234567890123456789012
✅ Quantity: 1000
✅ Price per Share: 500

🔍 VERIFYING CAPTABLE
----------------------------------------
✅ CapTable contract verified

🔗 CONNECTING TO PRIVATE STOCK FACET
----------------------------------------
✅ Connected to PrivateStockFacet

🔐 CREATING ENCRYPTED INPUT
----------------------------------------
✅ Encrypted input created
   Quantity handle: 0x...
   Price handle: 0x...

🆔 GENERATED IDS
----------------------------------------
Issue ID: 0x...
Security ID: 0x...

🚀 ISSUING PRIVATE STOCK
----------------------------------------
✅ Transaction sent: 0x...
⏳ Waiting for confirmation...
✅ Transaction confirmed in block: 12345
⛽ Gas used: 2500000

🎉 PRIVATE STOCK ISSUED SUCCESSFULLY!
Security ID: 0x...
Quantity (encrypted): 1000
Price per Share (encrypted): 500
Transaction Hash: 0x...
```

#### Get Private Stock Position Output

```
GETTING PRIVATE STOCK POSITION

📊 PRIVATE STOCK POSITION DETAILS
Security ID: 0x...
Stakeholder Address: 0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
Stock Class ID: 0x12345678901234567890123456789012
Quantity: 1000 shares
Share Price: 500 per share
Total Position Value: 500000
```

### Important Notes

1. **FHE Environment**: Private stock operations work best in FHEVM mock environments for testing. On Sepolia testnet, FHE operations may have limitations.

2. **Access Control**:
   - Only accounts with OPERATOR_ROLE can issue private stock
   - Stakeholders can view their own positions
   - Operators can view all positions

3. **Encryption**: All quantity and price data is encrypted using FHE (Fully Homomorphic Encryption), ensuring privacy while allowing computation.

4. **Security IDs**: Each private stock issuance generates a unique security ID that can be used to reference the position later.

5. **Stock Class Requirements**: You need to know the stock class ID to issue or query private stock. Stock classes must be created before issuing stock.

### Troubleshooting Private Stock Operations

#### Common Issues

1. **"No contract found at CapTable address"**:
   - Verify the CapTable address is correct
   - Ensure the CapTable was deployed successfully

2. **"Invalid stock class ID format"**:
   - Stock class IDs must be exactly 32 hex characters (16 bytes)
   - Include the "0x" prefix

3. **"FHE operations may not work as expected"**:
   - This warning appears on non-mock networks
   - For testing, use a local FHEVM mock environment

4. **"Decryption failed"**:
   - Ensure you have the proper permissions to decrypt the data
   - Verify you're using the correct signer account

5. **Access control errors**:
   - Ensure your account has the necessary roles (OPERATOR_ROLE for issuing)
   - Check that access control is properly initialized on the CapTable

## Integration

After deployment, you can use the addresses from the JSON files to integrate with your application:

```typescript
import deploymentAddresses from "./deploy/deployments/sepolia.json";
import capTableRegistry from "./deploy/deployments/capTables.json";

const factoryAddress = deploymentAddresses.factory;
const capTableAddresses = capTableRegistry.capTables.map((ct) => ct.address);
```

### Private Stock Integration Example

```typescript
import { ethers } from "hardhat";

// Connect to a deployed CapTable
const capTableAddress = "0x1234567890123456789012345678901234567890";
const privateStockFacet = await ethers.getContractAt("PrivateStockFacet", capTableAddress);

// Issue private stock (requires OPERATOR_ROLE)
const issueParams = {
  id: ethers.hexlify(ethers.randomBytes(16)),
  stock_class_id: "0x12345678901234567890123456789012",
  share_price: encryptedPriceHandle,
  quantity: encryptedQuantityHandle,
  stakeholder_address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  security_id: ethers.hexlify(ethers.randomBytes(16)),
  custom_id: "",
  stock_legend_ids_mapping: "",
  security_law_exemptions_mapping: "",
};

await privateStockFacet.issuePrivateStock(issueParams, inputProof);

// Get private securities for a stakeholder
const securities = await privateStockFacet.getPrivateStakeholderSecurities(stakeholderAddress, stockClassId);

// Get position details
const position = await privateStockFacet.getPrivateStockPosition(securityId);
```
