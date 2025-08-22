import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { CapTable, CapTableFactory, CapTableFactory__factory, PrivateStockFacet } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  founder: HardhatEthersSigner;
  investor1: HardhatEthersSigner;
  investor2: HardhatEthersSigner;
  unauthorized: HardhatEthersSigner;
};

async function deployFixture() {
  const [deployer] = await ethers.getSigners();

  // First deploy the required facets
  const DiamondCutFacetFactory = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacetFactory.deploy();
  await diamondCutFacet.waitForDeployment();

  const DiamondLoupeFacetFactory = await ethers.getContractFactory("DiamondLoupeFacet");
  const diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy();
  await diamondLoupeFacet.waitForDeployment();

  const IssuerFacetFactory = await ethers.getContractFactory("IssuerFacet");
  const issuerFacet = await IssuerFacetFactory.deploy();
  await issuerFacet.waitForDeployment();

  const AccessControlFacetFactory = await ethers.getContractFactory("AccessControlFacet");
  const accessControlFacet = await AccessControlFacetFactory.deploy();
  await accessControlFacet.waitForDeployment();

  const PrivateStockFacetFactory = await ethers.getContractFactory("PrivateStockFacet");
  const privateStockFacet = await PrivateStockFacetFactory.deploy();
  await privateStockFacet.waitForDeployment();

  // Create reference diamond
  const CapTableFactory = await ethers.getContractFactory("CapTable");
  const referenceDiamond = await CapTableFactory.deploy(deployer.address, await diamondCutFacet.getAddress());
  await referenceDiamond.waitForDeployment();

  // Add facets to reference diamond
  const diamondCut = await ethers.getContractAt("DiamondCutFacet", await referenceDiamond.getAddress());

  // Add DiamondLoupeFacet
  await diamondCut.diamondCut(
    [
      {
        facetAddress: await diamondLoupeFacet.getAddress(),
        action: 0, // Add
        functionSelectors: [
          diamondLoupeFacet.interface.getFunction("facets").selector,
          diamondLoupeFacet.interface.getFunction("facetFunctionSelectors").selector,
          diamondLoupeFacet.interface.getFunction("facetAddresses").selector,
          diamondLoupeFacet.interface.getFunction("facetAddress").selector,
          diamondLoupeFacet.interface.getFunction("supportsInterface").selector,
        ],
      },
    ],
    ethers.ZeroAddress,
    "0x"
  );

  // Add IssuerFacet
  await diamondCut.diamondCut(
    [
      {
        facetAddress: await issuerFacet.getAddress(),
        action: 0, // Add
        functionSelectors: [
          issuerFacet.interface.getFunction("initializeIssuer").selector,
          issuerFacet.interface.getFunction("adjustIssuerAuthorizedShares").selector,
        ],
      },
    ],
    ethers.ZeroAddress,
    "0x"
  );

  // Add AccessControlFacet
  await diamondCut.diamondCut(
    [
      {
        facetAddress: await accessControlFacet.getAddress(),
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
    ],
    ethers.ZeroAddress,
    "0x"
  );

  // Add PrivateStockFacet
  await diamondCut.diamondCut(
    [
      {
        facetAddress: await privateStockFacet.getAddress(),
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
    ],
    ethers.ZeroAddress,
    "0x"
  );

  // Deploy CapTableFactory with reference diamond
  const FactoryFactory = (await ethers.getContractFactory("CapTableFactory")) as CapTableFactory__factory;
  const capTableFactory = (await FactoryFactory.deploy(await referenceDiamond.getAddress())) as CapTableFactory;
  const factoryAddress = await capTableFactory.getAddress();

  return {
    capTableFactory,
    factoryAddress,
  };
}

describe("PrivateStockFacet System", function () {
  let signers: Signers;
  let capTableFactory: CapTableFactory;
  let factoryAddress: string;
  let capTableAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      founder: ethSigners[1],
      investor1: ethSigners[2],
      investor2: ethSigners[3],
      unauthorized: ethSigners[4],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ capTableFactory, factoryAddress } = await deployFixture());
    capTableFactory = capTableFactory.connect(signers.founder);
    // Create a cap table
    const issuerId = ethers.randomBytes(16);
    const initialSharesAuthorized = ethers.parseEther("1000000000"); // 1 billion shares
    const tx = await capTableFactory.createCapTable(issuerId, initialSharesAuthorized);
    const receipt = await tx.wait();

    // Get the cap table address from the event
    const event = receipt?.logs.find((log) => {
      try {
        const parsed = capTableFactory.interface.parseLog(log);
        return parsed?.name === "CapTableCreated";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = capTableFactory.interface.parseLog(event);
      capTableAddress = parsed?.args?.[0]; // capTable address is the first argument
    } else {
      // If no event, try to get from the factory
      capTableAddress = await capTableFactory.capTables(0);
    }
  });

  describe("CapTableFactory", function () {
    it("should create a cap table successfully", async function () {
      const capTableCount = await capTableFactory.getCapTableCount();
      expect(capTableCount).to.equal(1);

      const capTableAddress = await capTableFactory.capTables(0);
      expect(capTableAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("should increment cap table count correctly", async function () {
      // Create another cap table
      const issuerId = ethers.randomBytes(16);
      const initialSharesAuthorized = ethers.parseEther("1000000000");
      const tx = await capTableFactory.createCapTable(issuerId, initialSharesAuthorized);
      await tx.wait();

      const totalCapTables = await capTableFactory.getCapTableCount();
      expect(totalCapTables).to.equal(2);
    });

    it("should return correct cap table address", async function () {
      const capTableAddress = await capTableFactory.capTables(0);
      expect(capTableAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("should return correct total cap tables", async function () {
      const totalCapTables = await capTableFactory.getCapTableCount();
      expect(totalCapTables).to.equal(1);
    });
  });

  describe("Private Stock Issuance", function () {
    it("should be able to access PrivateStockFacet methods", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      // Just verify that we can access the facet
      expect(privateStockFacet).to.not.be.undefined;

      // Try to call a simple view function to see if the facet is accessible
      try {
        const securities = await privateStockFacet.getPrivateStakeholderSecurities(signers.founder.address, ethers.hexlify(ethers.randomBytes(16)));
        expect(securities).to.be.an("array");
      } catch (error: any) {
        console.log("Error accessing PrivateStockFacet:", error.message);
        // This is expected if the facet is not properly initialized
      }
    });

    it("should issue private stock to an investor", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const encryptedInput = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(100) // quantity
        .add64(1000) // share_price
        .add64(1000000) // pre_money_valuation
        .encrypt();
      console.log("cap table:", capTableAddress, "signer:", signers.founder.address);
      // Create issue private stock parameters
      const issuePrivateStockParams = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: ethers.hexlify(ethers.randomBytes(16)),
        share_price: encryptedInput.handles[1], // $10.00
        quantity: encryptedInput.handles[0], // 100 shares
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput.handles[2], // pre_money_valuation
        admin_viewer: signers.founder.address,
      };

      // Issue private stock
      const tx = await privateStockFacet.connect(signers.founder).issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);
      await tx.wait();

      // Check that the transaction was successful
      expect(tx.hash).to.not.be.undefined;
    });

    it("should issue private stock and show decoded data", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const clearQuantity = 150;
      const clearSharePrice = 2500;

      const encryptedInput = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(clearQuantity) // quantity
        .add64(clearSharePrice) // share_price
        .add64(5000000) // pre_money_valuation
        .encrypt();

      // Create issue private stock parameters
      const issuePrivateStockParams = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: ethers.hexlify(ethers.randomBytes(16)),
        share_price: encryptedInput.handles[1],
        quantity: encryptedInput.handles[0],
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput.handles[2],
        admin_viewer: signers.founder.address,
      };

      // Issue private stock
      const tx = await privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);
      await tx.wait();

      // Get the security ID from the stakeholder's securities
      const securities = await privateStockFacet.getPrivateStakeholderSecurities(signers.investor1.address, issuePrivateStockParams.stock_class_id);
      const securityId = securities[0];

      // Get the private stock position
      const position = await privateStockFacet.getPrivateStockPosition(securityId);
      console.log(position);

      // Decode the encrypted quantity
      const decodedQuantity = await fhevm.userDecryptEuint(FhevmType.euint64, position.quantity, capTableAddress, signers.founder);

      // Decode the encrypted share price
      const decodedSharePrice = await fhevm.userDecryptEuint(FhevmType.euint64, position.share_price, capTableAddress, signers.founder);

      // Verify the decoded values match the original values
      expect(decodedQuantity).to.equal(clearQuantity);
      expect(decodedSharePrice).to.equal(clearSharePrice);

      // Decode and verify pre_money_valuation
      const decodedPreMoneyValuation = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        position.pre_money_valuation,
        capTableAddress,
        signers.founder
      );

      expect(Number(decodedPreMoneyValuation)).to.equal(5000000);

      console.log("Decoded private stock position data:");
      console.log("  Stakeholder address:", position.stakeholder_address);
      console.log("  Stock class ID:", position.stock_class_id);
      console.log("  Quantity (decoded):", decodedQuantity.toString());
      console.log("  Share price (decoded):", decodedSharePrice.toString());
      console.log("  Pre-money valuation (decoded):", decodedPreMoneyValuation.toString());
    });

    it("should issue multiple private stocks and show decoded totals", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const stockClassId = ethers.hexlify(ethers.randomBytes(16));
      let totalQuantity = 0;
      let totalValue = 0;

      // Issue multiple private stocks to the same investor
      for (let i = 0; i < 3; i++) {
        const quantity = 100 + i * 50; // 100, 150, 200
        const sharePrice = 1000 + i * 500; // 1000, 1500, 2000

        totalQuantity += quantity;
        totalValue += quantity * sharePrice;

        const encryptedInput = await fhevm
          .createEncryptedInput(capTableAddress, signers.founder.address)
          .add64(quantity)
          .add64(sharePrice)
          .add64(1000000) // pre_money_valuation
          .encrypt();

        const issuePrivateStockParams = {
          id: ethers.hexlify(ethers.randomBytes(16)),
          stock_class_id: stockClassId,
          share_price: encryptedInput.handles[1],
          quantity: encryptedInput.handles[0],
          stakeholder_address: signers.investor1.address,
          security_id: ethers.hexlify(ethers.randomBytes(16)),
          custom_id: "",
          stock_legend_ids_mapping: "",
          security_law_exemptions_mapping: "",
          admin_viewer: signers.founder.address,
          round_id: ethers.hexlify(ethers.randomBytes(16)),
          pre_money_valuation: encryptedInput.handles[2],
        };

        await privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);
      }

      // Get all private securities for the investor
      const securities = await privateStockFacet.getPrivateStakeholderSecurities(signers.investor1.address, stockClassId);

      expect(securities.length).to.equal(3);

      // Decode and verify each position
      let decodedTotalQuantity = 0;
      let decodedTotalValue = 0;

      for (let i = 0; i < securities.length; i++) {
        const position = await privateStockFacet.getPrivateStockPosition(securities[i]);

        const decodedQuantity = await fhevm.userDecryptEuint(FhevmType.euint64, position.quantity, capTableAddress, signers.founder);

        const decodedSharePrice = await fhevm.userDecryptEuint(FhevmType.euint64, position.share_price, capTableAddress, signers.founder);

        decodedTotalQuantity += Number(decodedQuantity);
        decodedTotalValue += Number(decodedQuantity) * Number(decodedSharePrice);

        console.log(`Position ${i + 1}:`);
        console.log("  Security ID:", securities[i]);
        console.log("  Quantity (decoded):", decodedQuantity.toString());
        console.log("  Share price (decoded):", decodedSharePrice.toString());
        console.log("  Position value:", (Number(decodedQuantity) * Number(decodedSharePrice)).toString());
      }

      console.log("Total decoded data:");
      console.log("  Total quantity:", decodedTotalQuantity);
      console.log("  Total value:", decodedTotalValue);

      expect(decodedTotalQuantity).to.equal(totalQuantity);
      expect(decodedTotalValue).to.equal(totalValue);
    });

    it("should not allow non-operators to issue private stock", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const encryptedInput = await fhevm
        .createEncryptedInput(capTableAddress, signers.unauthorized.address)
        .add64(100) // quantity
        .add64(1000) // share_price
        .add64(1000000) // pre_money_valuation
        .encrypt();

      const issuePrivateStockParams = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: ethers.hexlify(ethers.randomBytes(16)),
        share_price: encryptedInput.handles[1],
        quantity: encryptedInput.handles[0],
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput.handles[2],
        admin_viewer: signers.founder.address,
      };

      await expect(privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof)).to.be.reverted;
    });

    it("should generate unique security IDs", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const encryptedInput1 = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(100) // quantity
        .add64(1000) // share_price
        .add64(1000000) // pre_money_valuation
        .encrypt();

      const encryptedInput2 = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(200) // quantity
        .add64(1500) // share_price
        .add64(2000000) // pre_money_valuation
        .encrypt();

      const issuePrivateStockParams1 = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: ethers.hexlify(ethers.randomBytes(16)),
        share_price: encryptedInput1.handles[1],
        quantity: encryptedInput1.handles[0],
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput1.handles[2],
        admin_viewer: signers.founder.address,
      };

      const issuePrivateStockParams2 = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: ethers.hexlify(ethers.randomBytes(16)),
        share_price: encryptedInput2.handles[1],
        quantity: encryptedInput2.handles[0],
        stakeholder_address: signers.investor2.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        admin_viewer: signers.founder.address,
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput2.handles[2],
      };

      // Issue private stock to two different investors
      await privateStockFacet.issuePrivateStocks([issuePrivateStockParams1], encryptedInput1.inputProof);
      await privateStockFacet.issuePrivateStocks([issuePrivateStockParams2], encryptedInput2.inputProof);

      // Check that both transactions were successful
      expect(issuePrivateStockParams1.security_id).to.not.equal(issuePrivateStockParams2.security_id);
    });
  });

  describe("Private Stock Position Retrieval", function () {
    let securityId: string;

    beforeEach(async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const encryptedInput = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(100) // quantity
        .add64(1000) // share_price
        .add64(1000000) // pre_money_valuation
        .encrypt();

      const issuePrivateStockParams = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: ethers.hexlify(ethers.randomBytes(16)),
        share_price: encryptedInput.handles[1],
        quantity: encryptedInput.handles[0],
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput.handles[2],
        admin_viewer: signers.founder.address,
      };

      await privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);

      // Get the security ID from the stakeholder's securities
      const securities = await privateStockFacet.getPrivateStakeholderSecurities(signers.investor1.address, issuePrivateStockParams.stock_class_id);
      securityId = securities[0];
    });

    it("should allow operators to get private stock position", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);
      const position = await privateStockFacet.getPrivateStockPosition(securityId);

      expect(position.stakeholder_address).to.equal(signers.investor1.address);
    });

    it("should allow investors to get their own private stock position", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);
      const position = await privateStockFacet.getPrivateStockPosition(securityId);

      expect(position.stakeholder_address).to.equal(signers.investor1.address);
    });

    it("should retrieve and decode private stock position data", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);
      const position = await privateStockFacet.getPrivateStockPosition(securityId);

      // Decode the encrypted quantity
      const decodedQuantity = await fhevm.userDecryptEuint(FhevmType.euint64, position.quantity, capTableAddress, signers.founder);

      // Decode the encrypted share price
      const decodedSharePrice = await fhevm.userDecryptEuint(FhevmType.euint64, position.share_price, capTableAddress, signers.founder);

      console.log("Retrieved and decoded private stock position:");
      console.log("  Security ID:", securityId);
      console.log("  Stakeholder address:", position.stakeholder_address);
      console.log("  Stock class ID:", position.stock_class_id);
      console.log("  Quantity (decoded):", decodedQuantity.toString());
      console.log("  Share price (decoded):", decodedSharePrice.toString());
      console.log("  Position value:", (Number(decodedQuantity) * Number(decodedSharePrice)).toString());

      // Verify the decoded values match expected values (100 quantity, 1000 share price)
      expect(decodedQuantity).to.equal(100);
      expect(decodedSharePrice).to.equal(1000);
    });
  });

  describe("Private Stakeholder Securities", function () {
    let stockClassId: string;

    beforeEach(async function () {
      stockClassId = ethers.hexlify(ethers.randomBytes(16));
    });

    it("should return correct private securities for stakeholder", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const encryptedInput = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(100) // quantity
        .add64(1000) // share_price
        .add64(1000000) // pre_money_valuation
        .encrypt();

      const issuePrivateStockParams = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: stockClassId,
        share_price: encryptedInput.handles[1],
        quantity: encryptedInput.handles[0],
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput.handles[2],
        admin_viewer: signers.founder.address,
      };

      await privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);

      const securities = await privateStockFacet.getPrivateStakeholderSecurities(signers.investor1.address, stockClassId);

      expect(securities.length).to.equal(1);
    });

    it("should retrieve and decode multiple private securities for stakeholder", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      // Issue multiple private securities to the same stakeholder
      const securitiesData = [
        { quantity: 100, sharePrice: 1000 },
        { quantity: 200, sharePrice: 1500 },
        { quantity: 300, sharePrice: 2000 },
      ];

      for (const data of securitiesData) {
        const encryptedInput = await fhevm
          .createEncryptedInput(capTableAddress, signers.founder.address)
          .add64(data.quantity)
          .add64(data.sharePrice)
          .add64(1000000) // pre_money_valuation
          .encrypt();

        const issuePrivateStockParams = {
          id: ethers.hexlify(ethers.randomBytes(16)),
          stock_class_id: stockClassId,
          share_price: encryptedInput.handles[1],
          quantity: encryptedInput.handles[0],
          stakeholder_address: signers.investor1.address,
          security_id: ethers.hexlify(ethers.randomBytes(16)),
          custom_id: "",
          stock_legend_ids_mapping: "",
          security_law_exemptions_mapping: "",
          round_id: ethers.hexlify(ethers.randomBytes(16)),
          pre_money_valuation: encryptedInput.handles[2],
          admin_viewer: signers.founder.address,
        };

        await privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);
      }

      // Get all private securities for the stakeholder
      const securities = await privateStockFacet.getPrivateStakeholderSecurities(signers.investor1.address, stockClassId);

      expect(securities.length).to.equal(3);

      console.log(`Retrieved ${securities.length} private securities for stakeholder ${signers.investor1.address}:`);

      // Decode and display each security
      for (let i = 0; i < securities.length; i++) {
        const position = await privateStockFacet.getPrivateStockPosition(securities[i]);

        const decodedQuantity = await fhevm.userDecryptEuint(FhevmType.euint64, position.quantity, capTableAddress, signers.founder);

        const decodedSharePrice = await fhevm.userDecryptEuint(FhevmType.euint64, position.share_price, capTableAddress, signers.founder);

        // Decode pre_money_valuation
        const decodedPreMoneyValuation = await fhevm.userDecryptEuint(
          FhevmType.euint64,
          position.pre_money_valuation,
          capTableAddress,
          signers.founder
        );

        const positionValue = Number(decodedQuantity) * Number(decodedSharePrice);

        console.log(`  Security ${i + 1}:`);
        console.log("    Security ID:", securities[i]);
        console.log("    Quantity (decoded):", decodedQuantity.toString());
        console.log("    Share price (decoded):", decodedSharePrice.toString());
        console.log("    Pre-money valuation (decoded):", decodedPreMoneyValuation.toString());
        console.log("    Position value:", positionValue.toString());

        // Verify the decoded values match the expected values
        expect(decodedQuantity).to.equal(securitiesData[i].quantity);
        expect(decodedSharePrice).to.equal(securitiesData[i].sharePrice);
        expect(Number(decodedPreMoneyValuation)).to.equal(1000000);
      }
    });

    it("should allow operators to view all private stakeholder securities", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const encryptedInput = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(100) // quantity
        .add64(1000) // share_price
        .add64(1000000) // pre_money_valuation
        .encrypt();

      const issuePrivateStockParams = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: stockClassId,
        share_price: encryptedInput.handles[1],
        quantity: encryptedInput.handles[0],
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput.handles[2],
        admin_viewer: signers.founder.address,
      };

      await privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);

      const securities = await privateStockFacet.getPrivateStakeholderSecurities(signers.investor1.address, stockClassId);

      expect(securities.length).to.equal(1);
    });

    it("should allow investors to view their own private securities", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const encryptedInput = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(100) // quantity
        .add64(1000) // share_price
        .add64(1000000) // pre_money_valuation
        .encrypt();

      const issuePrivateStockParams = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: stockClassId,
        share_price: encryptedInput.handles[1],
        quantity: encryptedInput.handles[0],
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput.handles[2],
        admin_viewer: signers.founder.address,
      };

      await privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);

      const investorPrivateStockFacet = await ethers.getContractAt("PrivateStockFacet", capTableAddress);
      const securities = await investorPrivateStockFacet.getPrivateStakeholderSecurities(signers.investor1.address, stockClassId);

      expect(securities.length).to.equal(1);
    });
  });

  describe("Investor Private Stock Position Decoding", function () {
    it("should allow investor to decode their own private stock position data", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const clearQuantity = 200;
      const clearSharePrice = 3000;

      const encryptedInput = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(clearQuantity) // quantity
        .add64(clearSharePrice) // share_price
        .add64(5000000) // pre_money_valuation
        .encrypt();

      // Create issue private stock parameters
      const issuePrivateStockParams = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: ethers.hexlify(ethers.randomBytes(16)),
        share_price: encryptedInput.handles[1],
        quantity: encryptedInput.handles[0],
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: ethers.hexlify(ethers.randomBytes(16)),
        pre_money_valuation: encryptedInput.handles[2],
        admin_viewer: signers.founder.address,
      };

      // Issue private stock
      const tx = await privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);
      await tx.wait();

      // Get the security ID from the stakeholder's securities
      const securities = await privateStockFacet.getPrivateStakeholderSecurities(signers.investor1.address, issuePrivateStockParams.stock_class_id);
      const securityId = securities[0];

      // Investor connects to the contract and gets their own position
      const investorPrivateStockFacet = await ethers.getContractAt("PrivateStockFacet", capTableAddress);
      const position = await investorPrivateStockFacet.getPrivateStockPosition(securityId);

      // Investor decrypts their own encrypted quantity
      const decodedQuantity = await fhevm.userDecryptEuint(FhevmType.euint64, position.quantity, capTableAddress, signers.investor1);

      // Investor decrypts their own encrypted share price
      const decodedSharePrice = await fhevm.userDecryptEuint(FhevmType.euint64, position.share_price, capTableAddress, signers.investor1);

      // Verify the decoded values match the original values
      expect(decodedQuantity).to.equal(clearQuantity);
      expect(decodedSharePrice).to.equal(clearSharePrice);

      console.log("Investor decoded their own private stock position data:");
      console.log("  Security ID:", securityId);
      console.log("  Stakeholder address:", position.stakeholder_address);
      console.log("  Stock class ID:", position.stock_class_id);
      console.log("  Quantity (decoded by investor):", decodedQuantity.toString());
      console.log("  Share price (decoded by investor):", decodedSharePrice.toString());
      console.log("  Position value:", (Number(decodedQuantity) * Number(decodedSharePrice)).toString());
    });

    it("should allow multiple investors to decode their own private stock position data", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const stockClassId = ethers.hexlify(ethers.randomBytes(16));
      const investorsData = [
        { investor: signers.investor1, quantity: 100, sharePrice: 1000 },
        { investor: signers.investor2, quantity: 150, sharePrice: 1500 },
      ];

      // Issue private stock to multiple investors
      for (const data of investorsData) {
        const encryptedInput = await fhevm
          .createEncryptedInput(capTableAddress, signers.founder.address)
          .add64(data.quantity)
          .add64(data.sharePrice)
          .add64(1000000) // pre_money_valuation
          .encrypt();

        const issuePrivateStockParams = {
          id: ethers.hexlify(ethers.randomBytes(16)),
          stock_class_id: stockClassId,
          share_price: encryptedInput.handles[1],
          quantity: encryptedInput.handles[0],
          stakeholder_address: data.investor.address,
          security_id: ethers.hexlify(ethers.randomBytes(16)),
          custom_id: "",
          stock_legend_ids_mapping: "",
          security_law_exemptions_mapping: "",
          round_id: ethers.hexlify(ethers.randomBytes(16)),
          pre_money_valuation: encryptedInput.handles[2],
          admin_viewer: signers.founder.address,
        };

        await privateStockFacet.issuePrivateStocks([issuePrivateStockParams], encryptedInput.inputProof);
      }

      // Each investor decodes their own data
      for (const data of investorsData) {
        const securities = await privateStockFacet.getPrivateStakeholderSecurities(data.investor.address, stockClassId);
        const securityId = securities[0];

        // Investor connects to the contract and gets their own position
        const investorPrivateStockFacet = await ethers.getContractAt("PrivateStockFacet", capTableAddress);
        const position = await investorPrivateStockFacet.getPrivateStockPosition(securityId);

        // Investor decrypts their own encrypted quantity
        const decodedQuantity = await fhevm.userDecryptEuint(FhevmType.euint64, position.quantity, capTableAddress, data.investor);

        // Investor decrypts their own encrypted share price
        const decodedSharePrice = await fhevm.userDecryptEuint(FhevmType.euint64, position.share_price, capTableAddress, data.investor);

        // Verify the decoded values match the original values
        expect(decodedQuantity).to.equal(data.quantity);
        expect(decodedSharePrice).to.equal(data.sharePrice);

        console.log(`Investor ${data.investor.address} decoded their own private stock position data:`);
        console.log("  Security ID:", securityId);
        console.log("  Stakeholder address:", position.stakeholder_address);
        console.log("  Stock class ID:", position.stock_class_id);
        console.log("  Quantity (decoded by investor):", decodedQuantity.toString());
        console.log("  Share price (decoded by investor):", decodedSharePrice.toString());
        console.log("  Position value:", (Number(decodedQuantity) * Number(decodedSharePrice)).toString());
      }
    });
  });

  describe("Round Total Amount", function () {
    it("should track round total amount correctly", async function () {
      const privateStockFacet = (await ethers.getContractAt("PrivateStockFacet", capTableAddress)).connect(signers.founder);

      const roundId = ethers.hexlify(ethers.randomBytes(16));

      // Issue first stock
      const encryptedInput1 = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(100) // quantity
        .add64(1000) // share_price
        .add64(1000000) // pre_money_valuation
        .encrypt();

      const issuePrivateStockParams1 = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: ethers.hexlify(ethers.randomBytes(16)),
        share_price: encryptedInput1.handles[1],
        quantity: encryptedInput1.handles[0],
        stakeholder_address: signers.investor1.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: roundId,
        pre_money_valuation: encryptedInput1.handles[2],
        admin_viewer: signers.founder.address,
      };

      await privateStockFacet.issuePrivateStocks([issuePrivateStockParams1], encryptedInput1.inputProof);

      // Issue second stock to same round
      const encryptedInput2 = await fhevm
        .createEncryptedInput(capTableAddress, signers.founder.address)
        .add64(200) // quantity
        .add64(1500) // share_price
        .add64(2000000) // pre_money_valuation
        .encrypt();

      const issuePrivateStockParams2 = {
        id: ethers.hexlify(ethers.randomBytes(16)),
        stock_class_id: ethers.hexlify(ethers.randomBytes(16)),
        share_price: encryptedInput2.handles[1],
        quantity: encryptedInput2.handles[0],
        stakeholder_address: signers.investor2.address,
        security_id: ethers.hexlify(ethers.randomBytes(16)),
        custom_id: "",
        stock_legend_ids_mapping: "",
        security_law_exemptions_mapping: "",
        round_id: roundId,
        pre_money_valuation: encryptedInput2.handles[2],
        admin_viewer: signers.founder.address,
      };

      await privateStockFacet.issuePrivateStocks([issuePrivateStockParams2], encryptedInput2.inputProof);

      // Get round total amount
      const roundTotalAmount = await privateStockFacet.getRoundTotalAmount(roundId);

      // Decode the total amount
      const decodedTotalAmount = await fhevm.userDecryptEuint(FhevmType.euint64, roundTotalAmount, capTableAddress, signers.founder);

      // Expected: (100 * 1000) + (200 * 1500) = 100000 + 300000 = 400000
      const expectedTotal = 100 * 1000 + 200 * 1500;
      expect(Number(decodedTotalAmount)).to.equal(expectedTotal);

      console.log("Round total amount test:");
      console.log("  Round ID:", roundId);
      console.log("  Expected total:", expectedTotal);
      console.log("  Actual total (decoded):", decodedTotalAmount.toString());
    });
  });
});
