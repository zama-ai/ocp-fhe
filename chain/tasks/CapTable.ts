import { randomBytes } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("captable:deploy-factory", "Deploy CapTableFactory contract").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();

    console.log("Deploying CapTableFactory with account:", deployer.address);

    // Deploy CapTableFactory
    const CapTableFactory = await ethers.getContractFactory("CapTableFactory");
    const capTableFactory = await CapTableFactory.deploy();
    await capTableFactory.waitForDeployment();

    const factoryAddress = await capTableFactory.getAddress();
    console.log("CapTableFactory deployed to:", factoryAddress);

    console.log("Deployment completed successfully!");
    console.log("CapTableFactory:", factoryAddress);
  },
);

task("captable:create-captable", "Create a new cap table")
  .addParam("factory", "Factory contract address")
  .addParam("founder", "Founder address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();

    const factory = await ethers.getContractAt("CapTableFactory", taskArgs.factory);

    console.log("Creating cap table...");
    const tx = await factory.createCapTable(taskArgs.founder, randomBytes(32));
    const receipt = await tx.wait();

    console.log("Cap table created successfully!");
    console.log("Transaction hash:", receipt?.hash);

    // Get the campaign ID (should be 0 for first one)
    const totalCampaigns = await factory.totalCampaigns();
    const campaignId = totalCampaigns - 1n;
    const capTableAddress = await factory.getCampaign(campaignId);
    console.log("Campaign ID:", campaignId.toString());
    console.log("Cap table address:", capTableAddress);
  });

task("captable:get-campaign", "Get campaign address")
  .addParam("factory", "Factory contract address")
  .addParam("campaignId", "Campaign ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const factory = await ethers.getContractAt("CapTableFactory", taskArgs.factory);
    const campaignAddress = await factory.getCampaign(taskArgs.campaignId);

    console.log("Campaign address:", campaignAddress);
  });

task("captable:check-campaign-exists", "Check if campaign exists")
  .addParam("factory", "Factory contract address")
  .addParam("campaignId", "Campaign ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const factory = await ethers.getContractAt("CapTableFactory", taskArgs.factory);
    const exists = await factory.campaignExists(taskArgs.campaignId);

    console.log("Campaign exists:", exists);
  });

task("captable:get-total-campaigns", "Get total number of campaigns")
  .addParam("factory", "Factory contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const factory = await ethers.getContractAt("CapTableFactory", taskArgs.factory);
    const totalCampaigns = await factory.totalCampaigns();

    console.log("Total campaigns:", totalCampaigns.toString());
  });

task("captable:grant-role", "Grant role to address")
  .addParam("captable", "CapTable contract address")
  .addParam("role", "Role to grant (OPERATOR_ROLE or INVESTOR_ROLE)")
  .addParam("address", "Address to grant role to")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();

    const capTable = await ethers.getContractAt("CapTable", taskArgs.captable);

    console.log("Granting role...");
    const tx = await capTable.grantRole(taskArgs.role, taskArgs.address);
    const receipt = await tx.wait();

    console.log("Role granted successfully!");
    console.log("Transaction hash:", receipt?.hash);
  });

task("captable:check-role", "Check if address has role")
  .addParam("captable", "CapTable contract address")
  .addParam("role", "Role to check")
  .addParam("address", "Address to check")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const capTable = await ethers.getContractAt("CapTable", taskArgs.captable);
    const hasRole = await capTable.hasRole(taskArgs.role, taskArgs.address);

    console.log("Address:", taskArgs.address);
    console.log("Role:", taskArgs.role);
    console.log("Has role:", hasRole);
  });

task("captable:get-founder", "Get founder address")
  .addParam("captable", "CapTable contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const capTable = await ethers.getContractAt("CapTable", taskArgs.captable);
    const founder = await capTable.founder();

    console.log("Founder address:", founder);
  });

task("captable:get-total-securities", "Get total securities issued")
  .addParam("captable", "CapTable contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const capTable = await ethers.getContractAt("CapTable", taskArgs.captable);
    const totalSecurities = await capTable.totalSecuritiesIssued();

    console.log("Total securities issued:", totalSecurities.toString());
  });

task("captable:get-stock-position", "Get stock position details")
  .addParam("captable", "CapTable contract address")
  .addParam("securityId", "Security ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const capTable = await ethers.getContractAt("CapTable", taskArgs.captable);

    try {
      const position = await capTable.getStockPosition(taskArgs.securityId);
      console.log("Stock position details:");
      console.log("Stakeholder address:", position.stakeholder_address);
      console.log("Stock class ID:", position.stock_class_id);
      console.log("Quantity (encrypted):", position.quantity);
      console.log("Share price (encrypted):", position.share_price);
    } catch (error) {
      console.log("Error getting stock position:", error);
    }
  });

task("captable:get-stakeholder-securities", "Get securities for a stakeholder")
  .addParam("captable", "CapTable contract address")
  .addParam("stakeholder", "Stakeholder address")
  .addParam("stockClassId", "Stock class ID")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const capTable = await ethers.getContractAt("CapTable", taskArgs.captable);

    try {
      const securities = await capTable.getStakeholderSecurities(taskArgs.stakeholder, taskArgs.stockClassId);

      console.log("Securities for", taskArgs.stakeholder + ":");
      console.log("Stock class ID:", taskArgs.stockClassId);
      console.log("Count:", securities.length);
      console.log("Security IDs:", securities);
    } catch (error) {
      console.log("Error getting stakeholder securities:", error);
    }
  });

task("captable:issue-stock", "Issue stock to an investor")
  .addParam("captable", "CapTable contract address")
  .addParam("stakeholder", "Stakeholder address")
  .addParam("stockClassId", "Stock class ID")
  .addParam("quantity", "Number of shares")
  .addParam("sharePrice", "Share price (in cents)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, fhevm } = hre;
    const [deployer] = await ethers.getSigners();

    const capTable = await ethers.getContractAt("CapTable", taskArgs.captable);

    console.log("Issuing stock...");

    const quantity = parseInt(taskArgs.quantity);
    const sharePrice = parseInt(taskArgs.sharePrice);

    const encryptedInput = await fhevm
      .createEncryptedInput(taskArgs.captable, deployer.address)
      .add64(quantity)
      .add64(sharePrice)
      .encrypt();

    // Create issue stock parameters
    const issueStockParams = {
      id: ethers.hexlify(ethers.randomBytes(16)),
      stock_class_id: taskArgs.stockClassId,
      share_price: encryptedInput.handles[1],
      quantity: encryptedInput.handles[0],
      stakeholder_address: taskArgs.stakeholder,
      security_id: ethers.hexlify(ethers.randomBytes(16)),
      custom_id: "",
      stock_legend_ids_mapping: "",
      security_law_exemptions_mapping: "",
    };

    const tx = await capTable.issueStock(issueStockParams, encryptedInput.inputProof);
    const receipt = await tx.wait();

    console.log("Stock issued successfully!");
    console.log("Transaction hash:", receipt?.hash);
  });

task("captable:decode-stock-position", "Decode stock position data")
  .addParam("captable", "CapTable contract address")
  .addParam("securityId", "Security ID")
  .addParam("user", "User address to decrypt with")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, fhevm } = hre;
    const [deployer] = await ethers.getSigners();

    const capTable = await ethers.getContractAt("CapTable", taskArgs.captable);

    try {
      const position = await capTable.getStockPosition(taskArgs.securityId);

      console.log("Stock position details:");
      console.log("Security ID:", taskArgs.securityId);
      console.log("Stakeholder address:", position.stakeholder_address);
      console.log("Stock class ID:", position.stock_class_id);

      // Decode the encrypted quantity
      const decodedQuantity = await fhevm.userDecryptEuint(
        "euint64" as any,
        position.quantity,
        taskArgs.captable,
        deployer,
      );

      // Decode the encrypted share price
      const decodedSharePrice = await fhevm.userDecryptEuint(
        "euint64" as any,
        position.share_price,
        taskArgs.captable,
        deployer,
      );

      console.log("Decoded data:");
      console.log("Quantity (decoded):", decodedQuantity.toString());
      console.log("Share price (decoded):", decodedSharePrice.toString());
      console.log("Position value:", (Number(decodedQuantity) * Number(decodedSharePrice)).toString());
    } catch (error) {
      console.log("Error decoding stock position:", error);
    }
  });

task("captable:transfer-stock", "Transfer stock (placeholder)")
  .addParam("captable", "CapTable contract address")
  .addParam("transferor", "Transferor stakeholder address")
  .addParam("transferee", "Transferee stakeholder address")
  .addParam("stockClassId", "Stock class ID")
  .addParam("quantity", "Number of shares")
  .addParam("sharePrice", "Share price (in cents)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, fhevm } = hre;
    const [deployer] = await ethers.getSigners();

    const capTable = await ethers.getContractAt("CapTable", taskArgs.captable);

    console.log("Transfer stock function is not yet implemented");
    console.log("This is a placeholder task for future implementation");

    // Note: The transferStock function in the contract is empty
    // This task will be updated when the function is implemented
  });
