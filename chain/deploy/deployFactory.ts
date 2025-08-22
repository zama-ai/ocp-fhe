import { ethers } from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import {
  AccessControlFacet__factory,
  ConvertiblesFacet__factory,
  DiamondCutFacet__factory,
  DiamondLoupeFacet__factory,
  EquityCompensationFacet__factory,
  IssuerFacet__factory,
  PrivateStockFacet__factory,
  StakeholderFacet__factory,
  StakeholderNFTFacet__factory,
  StockClassFacet__factory,
  StockFacet__factory,
  StockPlanFacet__factory,
  WarrantFacet__factory,
  CapTable__factory,
  CapTableFactory__factory,
} from "../types";
import type { IDiamondCut } from "../types";

interface DeploymentAddresses {
  network: string;
  deployedAt: string;
  deployer: string;
  facets: {
    DiamondCutFacet: string;
    DiamondLoupeFacet: string;
    IssuerFacet: string;
    StakeholderFacet: string;
    StockClassFacet: string;
    StockFacet: string;
    ConvertiblesFacet: string;
    EquityCompensationFacet: string;
    StockPlanFacet: string;
    WarrantFacet: string;
    StakeholderNFTFacet: string;
    AccessControlFacet: string;
    PrivateStockFacet: string;
  };
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

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("=".repeat(60));
  console.log("DEPLOYING CAPTABLE FACTORY INFRASTRUCTURE");
  console.log("=".repeat(60));
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("=".repeat(60));

  // Phase 1: Deploy all facets
  console.log("\n📦 PHASE 1: Deploying Facets");
  console.log("-".repeat(40));

  // Deploy DiamondCutFacet
  console.log("Deploying DiamondCutFacet...");
  const DiamondCutFacetFactory = (await ethers.getContractFactory("DiamondCutFacet")) as DiamondCutFacet__factory;
  const diamondCutFacet = await DiamondCutFacetFactory.deploy();
  await diamondCutFacet.waitForDeployment();
  const diamondCutFacetAddress = await diamondCutFacet.getAddress();
  console.log("✅ DiamondCutFacet:", diamondCutFacetAddress);

  // Deploy DiamondLoupeFacet
  console.log("Deploying DiamondLoupeFacet...");
  const DiamondLoupeFacetFactory = (await ethers.getContractFactory("DiamondLoupeFacet")) as DiamondLoupeFacet__factory;
  const diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy();
  await diamondLoupeFacet.waitForDeployment();
  const diamondLoupeFacetAddress = await diamondLoupeFacet.getAddress();
  console.log("✅ DiamondLoupeFacet:", diamondLoupeFacetAddress);

  // Deploy IssuerFacet
  console.log("Deploying IssuerFacet...");
  const IssuerFacetFactory = (await ethers.getContractFactory("IssuerFacet")) as IssuerFacet__factory;
  const issuerFacet = await IssuerFacetFactory.deploy();
  await issuerFacet.waitForDeployment();
  const issuerFacetAddress = await issuerFacet.getAddress();
  console.log("✅ IssuerFacet:", issuerFacetAddress);

  // Deploy StakeholderFacet
  console.log("Deploying StakeholderFacet...");
  const StakeholderFacetFactory = (await ethers.getContractFactory("StakeholderFacet")) as StakeholderFacet__factory;
  const stakeholderFacet = await StakeholderFacetFactory.deploy();
  await stakeholderFacet.waitForDeployment();
  const stakeholderFacetAddress = await stakeholderFacet.getAddress();
  console.log("✅ StakeholderFacet:", stakeholderFacetAddress);

  // Deploy StockClassFacet
  console.log("Deploying StockClassFacet...");
  const StockClassFacetFactory = (await ethers.getContractFactory("StockClassFacet")) as StockClassFacet__factory;
  const stockClassFacet = await StockClassFacetFactory.deploy();
  await stockClassFacet.waitForDeployment();
  const stockClassFacetAddress = await stockClassFacet.getAddress();
  console.log("✅ StockClassFacet:", stockClassFacetAddress);

  // Deploy StockFacet
  console.log("Deploying StockFacet...");
  const StockFacetFactory = (await ethers.getContractFactory("StockFacet")) as StockFacet__factory;
  const stockFacet = await StockFacetFactory.deploy();
  await stockFacet.waitForDeployment();
  const stockFacetAddress = await stockFacet.getAddress();
  console.log("✅ StockFacet:", stockFacetAddress);

  // Deploy ConvertiblesFacet
  console.log("Deploying ConvertiblesFacet...");
  const ConvertiblesFacetFactory = (await ethers.getContractFactory("ConvertiblesFacet")) as ConvertiblesFacet__factory;
  const convertiblesFacet = await ConvertiblesFacetFactory.deploy();
  await convertiblesFacet.waitForDeployment();
  const convertiblesFacetAddress = await convertiblesFacet.getAddress();
  console.log("✅ ConvertiblesFacet:", convertiblesFacetAddress);

  // Deploy EquityCompensationFacet
  console.log("Deploying EquityCompensationFacet...");
  const EquityCompensationFacetFactory = (await ethers.getContractFactory("EquityCompensationFacet")) as EquityCompensationFacet__factory;
  const equityCompensationFacet = await EquityCompensationFacetFactory.deploy();
  await equityCompensationFacet.waitForDeployment();
  const equityCompensationFacetAddress = await equityCompensationFacet.getAddress();
  console.log("✅ EquityCompensationFacet:", equityCompensationFacetAddress);

  // Deploy StockPlanFacet
  console.log("Deploying StockPlanFacet...");
  const StockPlanFacetFactory = (await ethers.getContractFactory("StockPlanFacet")) as StockPlanFacet__factory;
  const stockPlanFacet = await StockPlanFacetFactory.deploy();
  await stockPlanFacet.waitForDeployment();
  const stockPlanFacetAddress = await stockPlanFacet.getAddress();
  console.log("✅ StockPlanFacet:", stockPlanFacetAddress);

  // Deploy WarrantFacet
  console.log("Deploying WarrantFacet...");
  const WarrantFacetFactory = (await ethers.getContractFactory("WarrantFacet")) as WarrantFacet__factory;
  const warrantFacet = await WarrantFacetFactory.deploy();
  await warrantFacet.waitForDeployment();
  const warrantFacetAddress = await warrantFacet.getAddress();
  console.log("✅ WarrantFacet:", warrantFacetAddress);

  // Deploy StakeholderNFTFacet
  console.log("Deploying StakeholderNFTFacet...");
  const StakeholderNFTFacetFactory = (await ethers.getContractFactory("StakeholderNFTFacet")) as StakeholderNFTFacet__factory;
  const stakeholderNFTFacet = await StakeholderNFTFacetFactory.deploy();
  await stakeholderNFTFacet.waitForDeployment();
  const stakeholderNFTFacetAddress = await stakeholderNFTFacet.getAddress();
  console.log("✅ StakeholderNFTFacet:", stakeholderNFTFacetAddress);

  // Deploy AccessControlFacet
  console.log("Deploying AccessControlFacet...");
  const AccessControlFacetFactory = (await ethers.getContractFactory("AccessControlFacet")) as AccessControlFacet__factory;
  const accessControlFacet = await AccessControlFacetFactory.deploy();
  await accessControlFacet.waitForDeployment();
  const accessControlFacetAddress = await accessControlFacet.getAddress();
  console.log("✅ AccessControlFacet:", accessControlFacetAddress);

  // Deploy PrivateStockFacet
  console.log("Deploying PrivateStockFacet...");
  const PrivateStockFacetFactory = (await ethers.getContractFactory("PrivateStockFacet")) as PrivateStockFacet__factory;
  const privateStockFacet = await PrivateStockFacetFactory.deploy();
  await privateStockFacet.waitForDeployment();
  const privateStockFacetAddress = await privateStockFacet.getAddress();
  console.log("✅ PrivateStockFacet:", privateStockFacetAddress);

  // Phase 2: Create Reference Diamond
  console.log("\n💎 PHASE 2: Creating Reference Diamond");
  console.log("-".repeat(40));

  console.log("Deploying reference CapTable diamond...");
  const CapTableFactory = (await ethers.getContractFactory("CapTable")) as CapTable__factory;
  const referenceDiamond = await CapTableFactory.deploy(deployer.address, diamondCutFacetAddress);
  await referenceDiamond.waitForDeployment();
  const referenceDiamondAddress = await referenceDiamond.getAddress();
  console.log("✅ Reference Diamond:", referenceDiamondAddress);

  // Prepare facet cuts
  console.log("Configuring diamond cuts...");
  const cuts: IDiamondCut.FacetCutStruct[] = [
    {
      facetAddress: diamondLoupeFacetAddress,
      action: 0, // Add
      functionSelectors: [
        diamondLoupeFacet.interface.getFunction("facets").selector,
        diamondLoupeFacet.interface.getFunction("facetFunctionSelectors").selector,
        diamondLoupeFacet.interface.getFunction("facetAddresses").selector,
        diamondLoupeFacet.interface.getFunction("facetAddress").selector,
        diamondLoupeFacet.interface.getFunction("supportsInterface").selector,
      ],
    },
    {
      facetAddress: issuerFacetAddress,
      action: 0, // Add
      functionSelectors: [
        issuerFacet.interface.getFunction("initializeIssuer").selector,
        issuerFacet.interface.getFunction("adjustIssuerAuthorizedShares").selector,
      ],
    },
    {
      facetAddress: stakeholderFacetAddress,
      action: 0, // Add
      functionSelectors: [
        stakeholderFacet.interface.getFunction("createStakeholder").selector,
        stakeholderFacet.interface.getFunction("getStakeholderPositions").selector,
        stakeholderFacet.interface.getFunction("linkStakeholderAddress").selector,
      ],
    },
    {
      facetAddress: stockClassFacetAddress,
      action: 0, // Add
      functionSelectors: [
        stockClassFacet.interface.getFunction("createStockClass").selector,
        stockClassFacet.interface.getFunction("adjustAuthorizedShares").selector,
      ],
    },
    {
      facetAddress: stockFacetAddress,
      action: 0, // Add
      functionSelectors: [
        stockFacet.interface.getFunction("issueStock").selector,
        stockFacet.interface.getFunction("getStockPosition").selector,
        stockFacet.interface.getFunction("transferStock").selector,
        stockFacet.interface.getFunction("getStakeholderSecurities").selector,
        stockFacet.interface.getFunction("cancelStock").selector,
      ],
    },
    {
      facetAddress: convertiblesFacetAddress,
      action: 0, // Add
      functionSelectors: [
        convertiblesFacet.interface.getFunction("issueConvertible").selector,
        convertiblesFacet.interface.getFunction("getConvertiblePosition").selector,
      ],
    },
    {
      facetAddress: equityCompensationFacetAddress,
      action: 0, // Add
      functionSelectors: [
        equityCompensationFacet.interface.getFunction("issueEquityCompensation").selector,
        equityCompensationFacet.interface.getFunction("getPosition").selector,
        equityCompensationFacet.interface.getFunction("exerciseEquityCompensation").selector,
      ],
    },
    {
      facetAddress: stockPlanFacetAddress,
      action: 0, // Add
      functionSelectors: [
        stockPlanFacet.interface.getFunction("createStockPlan").selector,
        stockPlanFacet.interface.getFunction("adjustStockPlanPool").selector,
      ],
    },
    {
      facetAddress: warrantFacetAddress,
      action: 0, // Add
      functionSelectors: [
        warrantFacet.interface.getFunction("issueWarrant").selector,
        warrantFacet.interface.getFunction("getWarrantPosition").selector,
      ],
    },
    {
      facetAddress: stakeholderNFTFacetAddress,
      action: 0, // Add
      functionSelectors: [stakeholderNFTFacet.interface.getFunction("mint").selector, stakeholderNFTFacet.interface.getFunction("tokenURI").selector],
    },
    {
      facetAddress: accessControlFacetAddress,
      action: 0, // Add
      functionSelectors: [
        accessControlFacet.interface.getFunction("grantRole").selector,
        accessControlFacet.interface.getFunction("revokeRole").selector,
        accessControlFacet.interface.getFunction("hasRole").selector,
        accessControlFacet.interface.getFunction("initializeAccessControl").selector,
        accessControlFacet.interface.getFunction("transferAdmin").selector,
        accessControlFacet.interface.getFunction("acceptAdmin").selector,
        accessControlFacet.interface.getFunction("getAdmin").selector,
        accessControlFacet.interface.getFunction("getPendingAdmin").selector,
      ],
    },
    {
      facetAddress: privateStockFacetAddress,
      action: 0, // Add
      functionSelectors: [
        privateStockFacet.interface.getFunction("initialize").selector,
        privateStockFacet.interface.getFunction("issuePrivateStocks").selector,
        privateStockFacet.interface.getFunction("getRoundTotalAmount").selector,
        privateStockFacet.interface.getFunction("getRoundPreMoneyValuation").selector,
        privateStockFacet.interface.getFunction("getPrivateStockPosition").selector,
        privateStockFacet.interface.getFunction("getPrivateStakeholderSecurities").selector,
      ],
    },
  ];

  // Perform the cuts
  const diamondCut = DiamondCutFacet__factory.connect(referenceDiamondAddress, deployer);

  console.log(`Adding ${cuts.length} facets to reference diamond...`);
  for (let i = 0; i < cuts.length; i++) {
    console.log(`  Adding facet ${i + 1}/${cuts.length}: ${cuts[i].facetAddress}`);
    await diamondCut.diamondCut([cuts[i]], ethers.ZeroAddress, "0x");
  }
  console.log("✅ All facets added to reference diamond");

  // Phase 3: Deploy Factory
  console.log("\n🏭 PHASE 3: Deploying CapTableFactory");
  console.log("-".repeat(40));

  console.log("Deploying CapTableFactory...");
  const CapTableFactoryFactory = (await ethers.getContractFactory("CapTableFactory")) as CapTableFactory__factory;
  const capTableFactory = await CapTableFactoryFactory.deploy(referenceDiamondAddress);
  await capTableFactory.waitForDeployment();
  const factoryAddress = await capTableFactory.getAddress();
  console.log("✅ CapTableFactory:", factoryAddress);

  // Verify factory configuration
  const referenceDiamondFromFactory = await capTableFactory.referenceDiamond();
  if (referenceDiamondFromFactory !== referenceDiamondAddress) {
    throw new Error("Factory reference diamond mismatch!");
  }
  console.log("✅ Factory configuration verified");

  // Phase 4: Save Addresses
  console.log("\n💾 PHASE 4: Saving Deployment Addresses");
  console.log("-".repeat(40));

  const deploymentAddresses: DeploymentAddresses = {
    network: network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    facets: {
      DiamondCutFacet: diamondCutFacetAddress,
      DiamondLoupeFacet: diamondLoupeFacetAddress,
      IssuerFacet: issuerFacetAddress,
      StakeholderFacet: stakeholderFacetAddress,
      StockClassFacet: stockClassFacetAddress,
      StockFacet: stockFacetAddress,
      ConvertiblesFacet: convertiblesFacetAddress,
      EquityCompensationFacet: equityCompensationFacetAddress,
      StockPlanFacet: stockPlanFacetAddress,
      WarrantFacet: warrantFacetAddress,
      StakeholderNFTFacet: stakeholderNFTFacetAddress,
      AccessControlFacet: accessControlFacetAddress,
      PrivateStockFacet: privateStockFacetAddress,
    },
    referenceDiamond: referenceDiamondAddress,
    factory: factoryAddress,
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = join(__dirname, "deployments");
  if (!existsSync(deploymentsDir)) {
    mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment addresses
  const addressesFile = join(deploymentsDir, `${network.name}.json`);
  writeFileSync(addressesFile, JSON.stringify(deploymentAddresses, null, 2));
  console.log("✅ Addresses saved to:", addressesFile);

  // Initialize empty CapTable registry
  const capTableRegistry: CapTableRegistry = {
    network: network.name,
    capTables: [],
  };

  const registryFile = join(deploymentsDir, "capTables.json");
  writeFileSync(registryFile, JSON.stringify(capTableRegistry, null, 2));
  console.log("✅ CapTable registry initialized:", registryFile);

  // Final Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 FACTORY DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("Network:", network.name);
  console.log("Factory Address:", factoryAddress);
  console.log("Reference Diamond:", referenceDiamondAddress);
  console.log("Total Facets:", Object.keys(deploymentAddresses.facets).length);
  console.log("\nNext Steps:");
  console.log("1. Use deployCapTable.ts to create individual CapTable instances");
  console.log(
    "2. Example: npx hardhat run deploy/deployCapTable.ts --network sepolia -- --issuer-id 0x12345678901234567890123456789012 --shares 1000000000"
  );
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
