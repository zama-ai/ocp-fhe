import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { CapTableFactory__factory } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

interface DeploymentAddresses {
  network: string;
  deployedAt: string;
  deployer: string;
  facets: Record<string, string>;
  referenceDiamond: string;
  factory: string;
}

interface CapTableRegistry {
  network: string;
  capTables: Array<{
    address: string;
    issuerId: string;
    initialShares: string;
    deployedAt: string;
    deploymentTx: string;
    deployer: string;
  }>;
}

function validateIssuerId(issuerId: string): string {
  // Remove 0x prefix if present
  const cleanId = issuerId.startsWith("0x") ? issuerId.slice(2) : issuerId;

  // Check if it's exactly 32 hex characters (16 bytes)
  if (!/^[0-9a-fA-F]{32}$/.test(cleanId)) {
    throw new Error(`Invalid issuer ID format. Expected 32 hex characters (16 bytes), got: ${issuerId}`);
  }

  return "0x" + cleanId;
}

function validateShares(shares: string): bigint {
  try {
    const sharesBigInt = BigInt(shares);
    if (sharesBigInt <= 0) {
      throw new Error("Shares must be greater than 0");
    }
    return sharesBigInt;
  } catch (error) {
    throw new Error(`Invalid shares format. Expected positive integer, got: ${shares}`);
  }
}

async function loadDeploymentAddresses(network: string): Promise<DeploymentAddresses> {
  const deploymentsDir = join(__dirname, "..", "deploy", "deployments");
  const addressesFile = join(deploymentsDir, `${network}.json`);

  if (!existsSync(addressesFile)) {
    throw new Error(`Deployment addresses not found for network: ${network}. Please run deployFactory.ts first.`);
  }

  try {
    const addressesData = readFileSync(addressesFile, "utf8");
    return JSON.parse(addressesData) as DeploymentAddresses;
  } catch (error) {
    throw new Error(`Failed to load deployment addresses: ${error}`);
  }
}

async function loadCapTableRegistry(): Promise<CapTableRegistry> {
  const deploymentsDir = join(__dirname, "..", "deploy", "deployments");
  const registryFile = join(deploymentsDir, "capTables.json");

  if (!existsSync(registryFile)) {
    // Create empty registry if it doesn't exist
    const emptyRegistry: CapTableRegistry = {
      network: "",
      capTables: [],
    };
    return emptyRegistry;
  }

  try {
    const registryData = readFileSync(registryFile, "utf8");
    return JSON.parse(registryData) as CapTableRegistry;
  } catch (error) {
    throw new Error(`Failed to load CapTable registry: ${error}`);
  }
}

async function saveCapTableRegistry(registry: CapTableRegistry): Promise<void> {
  const deploymentsDir = join(__dirname, "..", "deploy", "deployments");
  const registryFile = join(deploymentsDir, "capTables.json");

  try {
    writeFileSync(registryFile, JSON.stringify(registry, null, 2));
  } catch (error) {
    throw new Error(`Failed to save CapTable registry: ${error}`);
  }
}

/**
 * Deploy a new CapTable instance using the factory
 *
 * Examples:
 *   npx hardhat deploy-captable --network sepolia --issuer-id 0x12345678901234567890123456789012 --shares 1000000000
 *   npx hardhat deploy-captable --network sepolia --issuer-id 0xabcdefabcdefabcdefabcdefabcdefab --shares 10000000
 */
task("deploy-captable", "Deploy a new CapTable instance using the factory")
  .addParam("issuerId", "16-byte hex string (32 hex characters) representing the unique issuer identifier")
  .addParam("shares", "Initial number of authorized shares (positive integer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();

    console.log("=".repeat(60));
    console.log("DEPLOYING CAPTABLE INSTANCE");
    console.log("=".repeat(60));
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("Deployer:", deployer.address);
    console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("=".repeat(60));

    // Parse and validate arguments
    console.log("\n📋 DEPLOYMENT PARAMETERS");
    console.log("-".repeat(40));
    console.log("Raw Issuer ID:", taskArguments.issuerId);
    console.log("Raw Shares:", taskArguments.shares);

    const validatedIssuerId = validateIssuerId(taskArguments.issuerId);
    const validatedShares = validateShares(taskArguments.shares);

    console.log("Validated Issuer ID:", validatedIssuerId);
    console.log("Validated Shares:", validatedShares.toString());

    // Load deployment addresses
    console.log("\n📂 LOADING DEPLOYMENT DATA");
    console.log("-".repeat(40));

    const deploymentAddresses = await loadDeploymentAddresses(network.name);
    console.log("✅ Factory address:", deploymentAddresses.factory);
    console.log("✅ Reference diamond:", deploymentAddresses.referenceDiamond);

    // Load existing registry
    const registry = await loadCapTableRegistry();
    console.log("✅ Loaded registry with", registry.capTables.length, "existing CapTables");

    // Check for duplicate issuer ID
    const existingCapTable = registry.capTables.find((ct) => ct.issuerId.toLowerCase() === validatedIssuerId.toLowerCase());
    if (existingCapTable) {
      console.warn("⚠️  WARNING: A CapTable with this issuer ID already exists:");
      console.warn("   Address:", existingCapTable.address);
      console.warn("   Deployed:", existingCapTable.deployedAt);
      console.warn("   Continuing with deployment...");
    }

    // Connect to factory
    console.log("\n🏭 CONNECTING TO FACTORY");
    console.log("-".repeat(40));

    const factory = CapTableFactory__factory.connect(deploymentAddresses.factory, deployer);

    // Verify factory is working
    const referenceDiamond = await factory.referenceDiamond();
    if (referenceDiamond !== deploymentAddresses.referenceDiamond) {
      throw new Error("Factory reference diamond mismatch!");
    }
    console.log("✅ Factory connection verified");

    // Deploy CapTable
    console.log("\n🚀 DEPLOYING CAPTABLE");
    console.log("-".repeat(40));

    console.log("Creating CapTable via factory...");
    console.log("  Issuer ID:", validatedIssuerId);
    console.log("  Initial Shares:", validatedShares.toString());

    const tx = await factory.createCapTable(validatedIssuerId, validatedShares);
    console.log("✅ Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());

    // Extract CapTable address from event
    let capTableAddress: string | undefined;

    for (const log of receipt.logs) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed?.name === "CapTableCreated") {
          capTableAddress = parsed.args[0];
          break;
        }
      } catch {
        // Ignore parsing errors for other logs
      }
    }

    if (!capTableAddress) {
      // Fallback: get the latest CapTable from factory
      const capTableCount = await factory.getCapTableCount();
      if (capTableCount > 0) {
        capTableAddress = await factory.capTables(capTableCount - 1n);
      }
    }

    if (!capTableAddress) {
      throw new Error("Failed to get CapTable address from deployment");
    }

    console.log("🎉 CapTable deployed successfully!");
    console.log("📍 CapTable Address:", capTableAddress);

    // Update registry
    console.log("\n📝 UPDATING REGISTRY");
    console.log("-".repeat(40));

    const newCapTableEntry = {
      address: capTableAddress,
      issuerId: validatedIssuerId,
      initialShares: validatedShares.toString(),
      deployedAt: new Date().toISOString(),
      deploymentTx: tx.hash,
      deployer: deployer.address,
    };

    // Update registry network if it's empty (first entry)
    if (registry.network === "") {
      registry.network = network.name;
    }

    registry.capTables.push(newCapTableEntry);
    await saveCapTableRegistry(registry);

    console.log("✅ Registry updated");
    console.log("📊 Total CapTables in registry:", registry.capTables.length);

    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 CAPTABLE DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("Network:", network.name);
    console.log("CapTable Address:", capTableAddress);
    console.log("Issuer ID:", validatedIssuerId);
    console.log("Initial Shares:", validatedShares.toString());
    console.log("Transaction Hash:", tx.hash);
    console.log("Deployer:", deployer.address);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("\nNext Steps:");
    console.log("1. The CapTable is ready to use");
    console.log("2. You can interact with it using the address above");
    console.log("3. All deployment details are saved in the registry");
    console.log("=".repeat(60));
  });

/**
 * List all deployed CapTables and factory information
 *
 * Examples:
 *   npx hardhat list-captables --network sepolia
 */
task("list-captables", "List all deployed CapTables and factory information").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { ethers, fhevm } = hre;

  await fhevm.initializeCLIApi();
  const network = await ethers.provider.getNetwork();

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString();
  }

  function formatShares(shares: string): string {
    const num = BigInt(shares);
    if (num >= 1000000000n) {
      return `${(Number(num) / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000n) {
      return `${(Number(num) / 1000000).toFixed(1)}M`;
    } else if (num >= 1000n) {
      return `${(Number(num) / 1000).toFixed(1)}K`;
    }
    return shares;
  }

  console.log("=".repeat(80));
  console.log("CAPTABLE DEPLOYMENT STATUS");
  console.log("=".repeat(80));

  // Load registry
  const registry = await loadCapTableRegistry();
  if (!registry || registry.capTables.length === 0) {
    console.log("❌ No CapTable registry found or no CapTables deployed.");
    console.log("Run deployFactory.ts first, then use deploy-captable task.");
    return;
  }

  console.log(`Network: ${network.name}`);
  console.log(`Total CapTables: ${registry.capTables.length}`);

  // Load factory info
  try {
    const deploymentAddresses = await loadDeploymentAddresses(network.name);
    console.log(`Factory Address: ${deploymentAddresses.factory}`);
    console.log(`Reference Diamond: ${deploymentAddresses.referenceDiamond}`);
    console.log(`Factory Deployed: ${formatDate(deploymentAddresses.deployedAt)}`);
  } catch (error) {
    console.log("⚠️  Could not load factory deployment info");
  }

  console.log("\n" + "=".repeat(80));
  console.log("DEPLOYED CAPTABLES");
  console.log("=".repeat(80));

  // Table header
  console.log(
    "│" +
      " #".padEnd(4) +
      "│" +
      " Address".padEnd(44) +
      "│" +
      " Issuer ID".padEnd(36) +
      "│" +
      " Shares".padEnd(12) +
      "│" +
      " Deployed".padEnd(20) +
      "│"
  );
  console.log("├" + "─".repeat(4) + "┼" + "─".repeat(44) + "┼" + "─".repeat(36) + "┼" + "─".repeat(12) + "┼" + "─".repeat(20) + "┤");

  // Table rows
  registry.capTables.forEach((capTable, index) => {
    const shortAddress = `${capTable.address.slice(0, 6)}...${capTable.address.slice(-4)}`;
    const shortIssuerId = `${capTable.issuerId.slice(0, 10)}...${capTable.issuerId.slice(-6)}`;
    const formattedShares = formatShares(capTable.initialShares);
    const deployedDate = new Date(capTable.deployedAt).toLocaleDateString();

    console.log(
      "│" +
        ` ${(index + 1).toString()}`.padEnd(4) +
        "│" +
        ` ${shortAddress}`.padEnd(44) +
        "│" +
        ` ${shortIssuerId}`.padEnd(36) +
        "│" +
        ` ${formattedShares}`.padEnd(12) +
        "│" +
        ` ${deployedDate}`.padEnd(20) +
        "│"
    );
  });

  console.log("└" + "─".repeat(4) + "┴" + "─".repeat(44) + "┴" + "─".repeat(36) + "┴" + "─".repeat(12) + "┴" + "─".repeat(20) + "┘");

  // Detailed view
  console.log("\n" + "=".repeat(80));
  console.log("DETAILED VIEW");
  console.log("=".repeat(80));

  registry.capTables.forEach((capTable, index) => {
    console.log(`\n📋 CapTable #${index + 1}`);
    console.log("─".repeat(40));
    console.log(`Address:        ${capTable.address}`);
    console.log(`Issuer ID:      ${capTable.issuerId}`);
    console.log(`Initial Shares: ${capTable.initialShares} (${formatShares(capTable.initialShares)})`);
    console.log(`Deployed At:    ${formatDate(capTable.deployedAt)}`);
    console.log(`Deployer:       ${capTable.deployer}`);
    console.log(`Deploy Tx:      ${capTable.deploymentTx}`);

    if (network.name === "sepolia") {
      console.log(`Etherscan:      https://sepolia.etherscan.io/address/${capTable.address}`);
      console.log(`Deploy Tx:      https://sepolia.etherscan.io/tx/${capTable.deploymentTx}`);
    }
  });

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total CapTables: ${registry.capTables.length}`);

  const totalShares = registry.capTables.reduce((sum, ct) => sum + BigInt(ct.initialShares), 0n);
  console.log(`Total Shares:    ${totalShares.toString()} (${formatShares(totalShares.toString())})`);

  const uniqueDeployers = new Set(registry.capTables.map((ct) => ct.deployer)).size;
  console.log(`Unique Deployers: ${uniqueDeployers}`);

  const oldestDeployment = registry.capTables.reduce((oldest, ct) => (new Date(ct.deployedAt) < new Date(oldest.deployedAt) ? ct : oldest));
  const newestDeployment = registry.capTables.reduce((newest, ct) => (new Date(ct.deployedAt) > new Date(newest.deployedAt) ? ct : newest));

  console.log(`First Deployed:  ${formatDate(oldestDeployment.deployedAt)}`);
  console.log(`Last Deployed:   ${formatDate(newestDeployment.deployedAt)}`);
  console.log("=".repeat(80));
});

// ============================================================================
// PRIVATE STOCK INTERACTION TASKS
// ============================================================================

function validateCapTableAddress(address: string): string {
  // Basic validation - check if it looks like an Ethereum address
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid CapTable address format: ${address}`);
  }
  return address;
}

function validateStakeholderAddress(address: string): string {
  // Basic validation - check if it looks like an Ethereum address
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid stakeholder address format: ${address}`);
  }
  return address;
}

function validateStockClassId(stockClassId: string): string {
  // Remove 0x prefix if present
  const cleanId = stockClassId.startsWith("0x") ? stockClassId.slice(2) : stockClassId;

  // Check if it's exactly 32 hex characters (16 bytes)
  if (!/^[0-9a-fA-F]{32}$/.test(cleanId)) {
    throw new Error(`Invalid stock class ID format. Expected 32 hex characters (16 bytes), got: ${stockClassId}`);
  }

  return "0x" + cleanId;
}

function validateSecurityId(securityId: string): string {
  // Remove 0x prefix if present
  const cleanId = securityId.startsWith("0x") ? securityId.slice(2) : securityId;

  // Check if it's exactly 32 hex characters (16 bytes)
  if (!/^[0-9a-fA-F]{32}$/.test(cleanId)) {
    throw new Error(`Invalid security ID format. Expected 32 hex characters (16 bytes), got: ${securityId}`);
  }

  return "0x" + cleanId;
}

function validateQuantity(quantity: string): number {
  const num = parseInt(quantity, 10);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid quantity. Expected positive integer, got: ${quantity}`);
  }
  return num;
}

function validatePrice(price: string): number {
  const num = parseInt(price, 10);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid price. Expected positive integer, got: ${price}`);
  }
  return num;
}

async function verifyCapTableExists(capTableAddress: string, ethers: any): Promise<void> {
  const code = await ethers.provider.getCode(capTableAddress);
  if (code === "0x") {
    throw new Error(`No contract found at CapTable address: ${capTableAddress}`);
  }
}

/**
 * Issue FHE-encrypted private stock to a stakeholder
 *
 * Examples:
 *   npx hardhat issue-private-stock --network sepolia --captable 0x123... --stakeholder 0xabc... --stock-class 0xdef... --quantity 1000 --price 500
 *   npx hardhat issue-private-stock --network sepolia --captable 0x123... --stakeholder 0xabc... --stock-class 0xdef... --quantity 500 --price 1000
 */
task("issue-private-stock", "Issue FHE-encrypted private stock to a stakeholder")
  .addParam("captable", "Address of the CapTable contract")
  .addParam("stakeholder", "Address of the stakeholder receiving the stock")
  .addParam("stockClass", "16-byte hex string (32 hex characters) representing the stock class ID")
  .addParam("quantity", "Number of shares to issue (positive integer)")
  .addParam("price", "Price per share in smallest unit (positive integer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();
    const [signer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();

    console.log("=".repeat(60));
    console.log("ISSUING PRIVATE STOCK");
    console.log("=".repeat(60));
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("Signer:", signer.address);
    console.log("Signer balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "ETH");
    console.log("=".repeat(60));

    // Validate parameters
    console.log("\n📋 VALIDATING PARAMETERS");
    console.log("-".repeat(40));
    console.log("Raw CapTable Address:", taskArguments.captable);
    console.log("Raw Stakeholder Address:", taskArguments.stakeholder);
    console.log("Raw Stock Class ID:", taskArguments.stockClass);
    console.log("Raw Quantity:", taskArguments.quantity);
    console.log("Raw Price:", taskArguments.price);

    const capTableAddress = validateCapTableAddress(taskArguments.captable);
    const stakeholderAddress = validateStakeholderAddress(taskArguments.stakeholder);
    const stockClassId = validateStockClassId(taskArguments.stockClass);
    const quantity = validateQuantity(taskArguments.quantity);
    const price = validatePrice(taskArguments.price);

    console.log("✅ CapTable Address:", capTableAddress);
    console.log("✅ Stakeholder Address:", stakeholderAddress);
    console.log("✅ Stock Class ID:", stockClassId);
    console.log("✅ Quantity:", quantity);
    console.log("✅ Price per Share:", price);

    // Verify CapTable exists
    console.log("\n🔍 VERIFYING CAPTABLE");
    console.log("-".repeat(40));
    await verifyCapTableExists(capTableAddress, ethers);
    console.log("✅ CapTable contract verified");

    // Check if running on FHEVM mock
    if (!fhevm.isMock) {
      console.warn("⚠️  WARNING: This task requires FHEVM mock environment for testing");
      console.warn("   On Sepolia testnet, FHE operations may not work as expected");
    }

    // Connect to PrivateStockFacet
    console.log("\n🔗 CONNECTING TO PRIVATE STOCK FACET");
    console.log("-".repeat(40));
    const privateStockFacet = await ethers.getContractAt("PrivateStockFacet", capTableAddress);
    console.log("✅ Connected to PrivateStockFacet");

    // Create encrypted input
    console.log("\n🔐 CREATING ENCRYPTED INPUT");
    console.log("-".repeat(40));
    const encryptedInput = await fhevm.createEncryptedInput(capTableAddress, signer.address).add64(quantity).add64(price).add64(1000000).encrypt();
    console.log("✅ Encrypted input created");
    console.log("   Quantity handle:", encryptedInput.handles[0]);
    console.log("   Price handle:", encryptedInput.handles[1]);

    // Generate unique IDs
    const issueId = ethers.hexlify(ethers.randomBytes(16));
    const securityId = ethers.hexlify(ethers.randomBytes(16));

    console.log("\n🆔 GENERATED IDS");
    console.log("-".repeat(40));
    console.log("Issue ID:", issueId);
    console.log("Security ID:", securityId);

    // Prepare issue parameters
    const issuePrivateStockParams = {
      id: issueId,
      stock_class_id: stockClassId,
      share_price: encryptedInput.handles[1],
      quantity: encryptedInput.handles[0],
      stakeholder_address: stakeholderAddress,
      security_id: securityId,
      custom_id: "",
      stock_legend_ids_mapping: "",
      security_law_exemptions_mapping: "",
      admin_viewer: signer.address,
      round_id: ethers.hexlify(ethers.randomBytes(16)),
      pre_money_valuation: encryptedInput.handles[2],

    };

    // Issue private stock
    console.log("\n🚀 ISSUING PRIVATE STOCK");
    console.log("-".repeat(40));
    console.log("Calling issuePrivateStocks...");

    const tx = await privateStockFacet.connect(signer).issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);
    console.log("✅ Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }

    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());

    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 PRIVATE STOCK ISSUED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("Network:", network.name);
    console.log("CapTable Address:", capTableAddress);
    console.log("Stakeholder Address:", stakeholderAddress);
    console.log("Stock Class ID:", stockClassId);
    console.log("Security ID:", securityId);
    console.log("Quantity (encrypted):", quantity);
    console.log("Price per Share (encrypted):", price);
    console.log("Transaction Hash:", tx.hash);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("\nNext Steps:");
    console.log("1. Use get-private-stock-position to view the position");
    console.log("2. Use list-private-securities to see all stakeholder securities");
    console.log("3. The encrypted data can be decrypted by authorized parties");
    console.log("=".repeat(60));
  });

/**
 * Get and decode private stock position details
 *
 * Examples:
 *   npx hardhat get-private-stock-position --network sepolia --captable 0x123... --security-id 0x456...
 */
task("get-private-stock-position", "Get and decode private stock position details")
  .addParam("captable", "Address of the CapTable contract")
  .addParam("securityId", "16-byte hex string (32 hex characters) representing the security ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();
    const [signer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();

    console.log("=".repeat(60));
    console.log("GETTING PRIVATE STOCK POSITION");
    console.log("=".repeat(60));
    console.log("Network:", network.name);
    console.log("Signer:", signer.address);
    console.log("=".repeat(60));

    // Validate parameters
    console.log("\n📋 VALIDATING PARAMETERS");
    console.log("-".repeat(40));
    console.log("Raw CapTable Address:", taskArguments.captable);
    console.log("Raw Security ID:", taskArguments.securityId);

    const capTableAddress = validateCapTableAddress(taskArguments.captable);
    const securityId = validateSecurityId(taskArguments.securityId);

    console.log("✅ CapTable Address:", capTableAddress);
    console.log("✅ Security ID:", securityId);

    // Verify CapTable exists
    console.log("\n🔍 VERIFYING CAPTABLE");
    console.log("-".repeat(40));
    await verifyCapTableExists(capTableAddress, ethers);
    console.log("✅ CapTable contract verified");

    // Check if running on FHEVM mock
    if (!fhevm.isMock) {
      console.warn("⚠️  WARNING: This task requires FHEVM mock environment for decryption");
      console.warn("   On Sepolia testnet, decryption may not work as expected");
    }

    // Connect to PrivateStockFacet
    console.log("\n🔗 CONNECTING TO PRIVATE STOCK FACET");
    console.log("-".repeat(40));
    const privateStockFacet = await ethers.getContractAt("PrivateStockFacet", capTableAddress);
    console.log("✅ Connected to PrivateStockFacet");

    // Get private stock position
    console.log("\n📊 RETRIEVING POSITION DATA");
    console.log("-".repeat(40));
    console.log("Calling getPrivateStockPosition...");

    const position = await privateStockFacet.getPrivateStockPosition(securityId);
    console.log("✅ Position data retrieved");

    // Display encrypted position data
    console.log("\n🔐 ENCRYPTED POSITION DATA");
    console.log("-".repeat(40));
    console.log("Stakeholder Address:", position.stakeholder_address);
    console.log("Stock Class ID:", position.stock_class_id);
    console.log("Encrypted Quantity:", position.quantity);
    console.log("Encrypted Share Price:", position.share_price);

    // Decrypt the data
    console.log("\n🔓 DECRYPTING DATA");
    console.log("-".repeat(40));

    try {
      const decodedQuantity = await fhevm.userDecryptEuint(FhevmType.euint64, position.quantity, capTableAddress, signer);

      const decodedSharePrice = await fhevm.userDecryptEuint(FhevmType.euint64, position.share_price, capTableAddress, signer);

      const positionValue = Number(decodedQuantity) * Number(decodedSharePrice);

      console.log("✅ Decryption successful");
      console.log("Decrypted Quantity:", decodedQuantity.toString());
      console.log("Decrypted Share Price:", decodedSharePrice.toString());
      console.log("Position Value:", positionValue.toString());

      // Final Summary
      console.log("\n" + "=".repeat(60));
      console.log("📊 PRIVATE STOCK POSITION DETAILS");
      console.log("=".repeat(60));
      console.log("Security ID:", securityId);
      console.log("Stakeholder Address:", position.stakeholder_address);
      console.log("Stock Class ID:", position.stock_class_id);
      console.log("Quantity:", decodedQuantity.toString(), "shares");
      console.log("Share Price:", decodedSharePrice.toString(), "per share");
      console.log("Total Position Value:", positionValue.toString());
      console.log("=".repeat(60));
    } catch (error) {
      console.error("❌ Failed to decrypt data:", error);
      console.log("\n" + "=".repeat(60));
      console.log("📊 PRIVATE STOCK POSITION (ENCRYPTED ONLY)");
      console.log("=".repeat(60));
      console.log("Security ID:", securityId);
      console.log("Stakeholder Address:", position.stakeholder_address);
      console.log("Stock Class ID:", position.stock_class_id);
      console.log("Encrypted Quantity:", position.quantity);
      console.log("Encrypted Share Price:", position.share_price);
      console.log("Note: Decryption failed - data remains encrypted");
      console.log("=".repeat(60));
    }
  });

/**
 * List all private securities for a stakeholder
 *
 * Examples:
 *   npx hardhat list-private-securities --network sepolia --captable 0x123... --stakeholder 0xabc... --stock-class 0xdef...
 */
task("list-private-securities", "List all private securities for a stakeholder")
  .addParam("captable", "Address of the CapTable contract")
  .addParam("stakeholder", "Address of the stakeholder")
  .addParam("stockClass", "16-byte hex string (32 hex characters) representing the stock class ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();
    const [signer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();

    console.log("=".repeat(60));
    console.log("LISTING PRIVATE SECURITIES");
    console.log("=".repeat(60));
    console.log("Network:", network.name);
    console.log("Signer:", signer.address);
    console.log("=".repeat(60));

    // Validate parameters
    console.log("\n📋 VALIDATING PARAMETERS");
    console.log("-".repeat(40));
    console.log("Raw CapTable Address:", taskArguments.captable);
    console.log("Raw Stakeholder Address:", taskArguments.stakeholder);
    console.log("Raw Stock Class ID:", taskArguments.stockClass);

    const capTableAddress = validateCapTableAddress(taskArguments.captable);
    const stakeholderAddress = validateStakeholderAddress(taskArguments.stakeholder);
    const stockClassId = validateStockClassId(taskArguments.stockClass);

    console.log("✅ CapTable Address:", capTableAddress);
    console.log("✅ Stakeholder Address:", stakeholderAddress);
    console.log("✅ Stock Class ID:", stockClassId);

    // Verify CapTable exists
    console.log("\n🔍 VERIFYING CAPTABLE");
    console.log("-".repeat(40));
    await verifyCapTableExists(capTableAddress, ethers);
    console.log("✅ CapTable contract verified");

    // Check if running on FHEVM mock
    if (!fhevm.isMock) {
      console.warn("⚠️  WARNING: This task requires FHEVM mock environment for decryption");
      console.warn("   On Sepolia testnet, decryption may not work as expected");
    }

    // Connect to PrivateStockFacet
    console.log("\n🔗 CONNECTING TO PRIVATE STOCK FACET");
    console.log("-".repeat(40));
    const privateStockFacet = await ethers.getContractAt("PrivateStockFacet", capTableAddress);
    console.log("✅ Connected to PrivateStockFacet");

    // Get private securities
    console.log("\n📊 RETRIEVING SECURITIES");
    console.log("-".repeat(40));
    console.log("Calling getPrivateStakeholderSecurities...");

    const securities = await privateStockFacet.getPrivateStakeholderSecurities(stakeholderAddress, stockClassId);
    console.log("✅ Securities retrieved");
    console.log("Number of securities found:", securities.length);

    if (securities.length === 0) {
      console.log("\n" + "=".repeat(60));
      console.log("📊 NO PRIVATE SECURITIES FOUND");
      console.log("=".repeat(60));
      console.log("Stakeholder Address:", stakeholderAddress);
      console.log("Stock Class ID:", stockClassId);
      console.log("No private securities found for this stakeholder in this stock class.");
      console.log("=".repeat(60));
      return;
    }

    // Display securities with decryption
    console.log("\n📋 SECURITIES DETAILS");
    console.log("=".repeat(60));

    let totalQuantity = 0;
    let totalValue = 0;
    let successfulDecryptions = 0;

    for (let i = 0; i < securities.length; i++) {
      const securityId = securities[i];
      console.log(`\n🔐 Security #${i + 1}`);
      console.log("-".repeat(40));
      console.log("Security ID:", securityId);

      try {
        const position = await privateStockFacet.getPrivateStockPosition(securityId);
        console.log("Stakeholder Address:", position.stakeholder_address);
        console.log("Stock Class ID:", position.stock_class_id);

        try {
          const decodedQuantity = await fhevm.userDecryptEuint(FhevmType.euint64, position.quantity, capTableAddress, signer);

          const decodedSharePrice = await fhevm.userDecryptEuint(FhevmType.euint64, position.share_price, capTableAddress, signer);

          const positionValue = Number(decodedQuantity) * Number(decodedSharePrice);

          console.log("Quantity:", decodedQuantity.toString(), "shares");
          console.log("Share Price:", decodedSharePrice.toString(), "per share");
          console.log("Position Value:", positionValue.toString());

          totalQuantity += Number(decodedQuantity);
          totalValue += positionValue;
          successfulDecryptions++;
        } catch (decryptError) {
          console.log("Encrypted Quantity:", position.quantity);
          console.log("Encrypted Share Price:", position.share_price);
          console.log("❌ Decryption failed for this position");
        }
      } catch (positionError) {
        console.log("❌ Failed to retrieve position data:", positionError);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 PRIVATE SECURITIES SUMMARY");
    console.log("=".repeat(60));
    console.log("Stakeholder Address:", stakeholderAddress);
    console.log("Stock Class ID:", stockClassId);
    console.log("Total Securities:", securities.length);
    console.log("Successfully Decrypted:", successfulDecryptions);

    if (successfulDecryptions > 0) {
      console.log("Total Quantity:", totalQuantity, "shares");
      console.log("Total Portfolio Value:", totalValue);
      console.log("Average Price per Share:", totalQuantity > 0 ? (totalValue / totalQuantity).toFixed(2) : "N/A");
    }

    console.log("\nSecurity IDs:");
    securities.forEach((securityId, index) => {
      console.log(`  ${index + 1}. ${securityId}`);
    });
    console.log("=".repeat(60));
  });

/**
 * Get comprehensive private stock overview for a stakeholder
 *
 * Examples:
 *   npx hardhat private-stock-summary --network sepolia --captable 0x123... --stakeholder 0xabc...
 */
task("private-stock-summary", "Get comprehensive private stock overview for a stakeholder")
  .addParam("captable", "Address of the CapTable contract")
  .addParam("stakeholder", "Address of the stakeholder")
  .addOptionalParam("stockClass", "16-byte hex string (32 hex characters) representing the stock class ID to filter by")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();
    const [signer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();

    console.log("=".repeat(60));
    console.log("PRIVATE STOCK PORTFOLIO SUMMARY");
    console.log("=".repeat(60));
    console.log("Network:", network.name);
    console.log("Signer:", signer.address);
    console.log("=".repeat(60));

    // Validate parameters
    console.log("\n📋 VALIDATING PARAMETERS");
    console.log("-".repeat(40));
    console.log("Raw CapTable Address:", taskArguments.captable);
    console.log("Raw Stakeholder Address:", taskArguments.stakeholder);
    if (taskArguments.stockClass) {
      console.log("Raw Stock Class ID:", taskArguments.stockClass);
    }

    const capTableAddress = validateCapTableAddress(taskArguments.captable);
    const stakeholderAddress = validateStakeholderAddress(taskArguments.stakeholder);
    const stockClassId = taskArguments.stockClass ? validateStockClassId(taskArguments.stockClass) : null;

    console.log("✅ CapTable Address:", capTableAddress);
    console.log("✅ Stakeholder Address:", stakeholderAddress);
    if (stockClassId) {
      console.log("✅ Stock Class ID:", stockClassId);
    } else {
      console.log("✅ Stock Class Filter: None (all stock classes)");
    }

    // Verify CapTable exists
    console.log("\n🔍 VERIFYING CAPTABLE");
    console.log("-".repeat(40));
    await verifyCapTableExists(capTableAddress, ethers);
    console.log("✅ CapTable contract verified");

    // Check if running on FHEVM mock
    if (!fhevm.isMock) {
      console.warn("⚠️  WARNING: This task requires FHEVM mock environment for decryption");
      console.warn("   On Sepolia testnet, decryption may not work as expected");
    }

    // Connect to PrivateStockFacet
    console.log("\n🔗 CONNECTING TO PRIVATE STOCK FACET");
    console.log("-".repeat(40));
    const privateStockFacet = await ethers.getContractAt("PrivateStockFacet", capTableAddress);
    console.log("✅ Connected to PrivateStockFacet");

    console.log("\n📊 PORTFOLIO ANALYSIS");
    console.log("=".repeat(60));

    if (stockClassId) {
      // Single stock class analysis
      console.log(`Analyzing stock class: ${stockClassId}`);

      const securities = await privateStockFacet.getPrivateStakeholderSecurities(stakeholderAddress, stockClassId);
      console.log(`Found ${securities.length} securities in this stock class`);

      if (securities.length === 0) {
        console.log("\n❌ No private securities found for this stakeholder in this stock class.");
        return;
      }

      await analyzeStockClass(securities, stockClassId, privateStockFacet, capTableAddress, signer, fhevm);
    } else {
      // Multi-stock class analysis would require knowing all stock class IDs
      // For now, we'll show a message that this requires a stock class filter
      console.log("❌ Stock class ID is required for portfolio analysis.");
      console.log("   Use --stock-class parameter to specify which stock class to analyze.");
      console.log("   To analyze multiple stock classes, run this command multiple times.");
      console.log("\nExample:");
      console.log(
        `   npx hardhat private-stock-summary --network ${network.name} --captable ${capTableAddress} --stakeholder ${stakeholderAddress} --stock-class 0x123...`
      );
    }
  });

async function analyzeStockClass(
  securities: string[],
  stockClassId: string,
  privateStockFacet: any,
  capTableAddress: string,
  signer: any,
  fhevm: any
): Promise<void> {
  let totalQuantity = 0;
  let totalValue = 0;
  let successfulDecryptions = 0;
  const positions: Array<{
    securityId: string;
    quantity: number;
    sharePrice: number;
    value: number;
  }> = [];

  console.log("\n🔍 ANALYZING POSITIONS");
  console.log("-".repeat(40));

  for (let i = 0; i < securities.length; i++) {
    const securityId = securities[i];
    console.log(`Processing security ${i + 1}/${securities.length}: ${securityId.slice(0, 10)}...`);

    try {
      const position = await privateStockFacet.getPrivateStockPosition(securityId);

      const decodedQuantity = await fhevm.userDecryptEuint(FhevmType.euint64, position.quantity, capTableAddress, signer);

      const decodedSharePrice = await fhevm.userDecryptEuint(FhevmType.euint64, position.share_price, capTableAddress, signer);

      const quantity = Number(decodedQuantity);
      const sharePrice = Number(decodedSharePrice);
      const value = quantity * sharePrice;

      positions.push({
        securityId,
        quantity,
        sharePrice,
        value,
      });

      totalQuantity += quantity;
      totalValue += value;
      successfulDecryptions++;
    } catch (error) {
      console.log(`❌ Failed to process security ${securityId}: ${error}`);
    }
  }

  // Display results
  console.log("\n" + "=".repeat(60));
  console.log("📊 PORTFOLIO SUMMARY");
  console.log("=".repeat(60));
  console.log("Stock Class ID:", stockClassId);
  console.log("Total Securities:", securities.length);
  console.log("Successfully Analyzed:", successfulDecryptions);
  console.log("Total Shares:", totalQuantity.toLocaleString());
  console.log("Total Portfolio Value:", totalValue.toLocaleString());

  if (totalQuantity > 0) {
    console.log("Average Price per Share:", (totalValue / totalQuantity).toFixed(2));
  }

  if (positions.length > 0) {
    console.log("\n📋 POSITION BREAKDOWN");
    console.log("-".repeat(60));
    console.log("│ Security ID (short)  │ Quantity    │ Price/Share │ Value       │");
    console.log("├─────────────────────┼─────────────┼─────────────┼─────────────┤");

    positions.forEach((pos) => {
      const shortId = `${pos.securityId.slice(0, 8)}...${pos.securityId.slice(-4)}`;
      const quantity = pos.quantity.toLocaleString().padStart(11);
      const price = pos.sharePrice.toLocaleString().padStart(11);
      const value = pos.value.toLocaleString().padStart(11);

      console.log(`│ ${shortId.padEnd(19)} │ ${quantity} │ ${price} │ ${value} │`);
    });

    console.log("└─────────────────────┴─────────────┴─────────────┴─────────────┘");

    // Statistics
    const quantities = positions.map((p) => p.quantity);
    const prices = positions.map((p) => p.sharePrice);
    const values = positions.map((p) => p.value);

    console.log("\n📈 STATISTICS");
    console.log("-".repeat(40));
    console.log("Largest Position:", Math.max(...quantities).toLocaleString(), "shares");
    console.log("Smallest Position:", Math.min(...quantities).toLocaleString(), "shares");
    console.log("Highest Price:", Math.max(...prices).toLocaleString(), "per share");
    console.log("Lowest Price:", Math.min(...prices).toLocaleString(), "per share");
    console.log("Most Valuable Position:", Math.max(...values).toLocaleString());
    console.log("Least Valuable Position:", Math.min(...values).toLocaleString());
  }

  console.log("=".repeat(60));
}
