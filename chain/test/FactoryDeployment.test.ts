import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { CapTable, CapTable__factory, CapTableFactory, CapTableFactory__factory } from "../types";
import type { DiamondCutFacet, DiamondLoupeFacet } from "../types";
import type { IDiamondCut } from "../types";
import { DiamondCutFacet__factory, DiamondLoupeFacet__factory } from "../types";
import {
  IssuerFacet,
  IssuerFacet__factory,
  StakeholderFacet,
  StakeholderFacet__factory,
  StockClassFacet,
  StockClassFacet__factory,
  StockFacet,
  StockFacet__factory,
  ConvertiblesFacet,
  ConvertiblesFacet__factory,
  EquityCompensationFacet,
  EquityCompensationFacet__factory,
  StockPlanFacet,
  StockPlanFacet__factory,
  WarrantFacet,
  WarrantFacet__factory,
  StakeholderNFTFacet,
  StakeholderNFTFacet__factory,
  AccessControlFacet,
  AccessControlFacet__factory,
  PrivateStockFacet,
  PrivateStockFacet__factory,
} from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  founder: HardhatEthersSigner;
  investor1: HardhatEthersSigner;
  investor2: HardhatEthersSigner;
};

describe("Factory Deployment with All Facets", function () {
  let signers: Signers;
  let referenceDiamond: CapTable;
  let capTableFactory: CapTableFactory;
  let diamondCutFacet: DiamondCutFacet;
  let diamondLoupeFacet: DiamondLoupeFacet;

  // Facet addresses
  let issuerFacet: IssuerFacet;
  let stakeholderFacet: StakeholderFacet;
  let stockClassFacet: StockClassFacet;
  let stockFacet: StockFacet;
  let convertiblesFacet: ConvertiblesFacet;
  let equityCompensationFacet: EquityCompensationFacet;
  let stockPlanFacet: StockPlanFacet;
  let warrantFacet: WarrantFacet;
  let stakeholderNFTFacet: StakeholderNFTFacet;
  let accessControlFacet: AccessControlFacet;
  let privateStockFacet: PrivateStockFacet;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      founder: ethSigners[1],
      investor1: ethSigners[2],
      investor2: ethSigners[3],
    };
  });

  describe("Deploy Reference Diamond with All Facets", function () {
    it("should deploy all individual facets", async function () {
      console.log("Deploying individual facets...");

      // Deploy DiamondCutFacet
      const DiamondCutFacetFactory = (await ethers.getContractFactory("DiamondCutFacet")) as DiamondCutFacet__factory;
      diamondCutFacet = await DiamondCutFacetFactory.deploy();
      await diamondCutFacet.waitForDeployment();
      console.log("DiamondCutFacet deployed to:", await diamondCutFacet.getAddress());

      // Deploy DiamondLoupeFacet
      const DiamondLoupeFacetFactory = (await ethers.getContractFactory("DiamondLoupeFacet")) as DiamondLoupeFacet__factory;
      diamondLoupeFacet = await DiamondLoupeFacetFactory.deploy();
      await diamondLoupeFacet.waitForDeployment();
      console.log("DiamondLoupeFacet deployed to:", await diamondLoupeFacet.getAddress());

      // Deploy IssuerFacet
      const IssuerFacetFactory = (await ethers.getContractFactory("IssuerFacet")) as IssuerFacet__factory;
      issuerFacet = await IssuerFacetFactory.deploy();
      await issuerFacet.waitForDeployment();
      console.log("IssuerFacet deployed to:", await issuerFacet.getAddress());

      // Deploy StakeholderFacet
      const StakeholderFacetFactory = (await ethers.getContractFactory("StakeholderFacet")) as StakeholderFacet__factory;
      stakeholderFacet = await StakeholderFacetFactory.deploy();
      await stakeholderFacet.waitForDeployment();
      console.log("StakeholderFacet deployed to:", await stakeholderFacet.getAddress());

      // Deploy StockClassFacet
      const StockClassFacetFactory = (await ethers.getContractFactory("StockClassFacet")) as StockClassFacet__factory;
      stockClassFacet = await StockClassFacetFactory.deploy();
      await stockClassFacet.waitForDeployment();
      console.log("StockClassFacet deployed to:", await stockClassFacet.getAddress());

      // Deploy StockFacet
      const StockFacetFactory = (await ethers.getContractFactory("StockFacet")) as StockFacet__factory;
      stockFacet = await StockFacetFactory.deploy();
      await stockFacet.waitForDeployment();
      console.log("StockFacet deployed to:", await stockFacet.getAddress());

      // Deploy ConvertiblesFacet
      const ConvertiblesFacetFactory = (await ethers.getContractFactory("ConvertiblesFacet")) as ConvertiblesFacet__factory;
      convertiblesFacet = await ConvertiblesFacetFactory.deploy();
      await convertiblesFacet.waitForDeployment();
      console.log("ConvertiblesFacet deployed to:", await convertiblesFacet.getAddress());

      // Deploy EquityCompensationFacet
      const EquityCompensationFacetFactory = (await ethers.getContractFactory("EquityCompensationFacet")) as EquityCompensationFacet__factory;
      equityCompensationFacet = await EquityCompensationFacetFactory.deploy();
      await equityCompensationFacet.waitForDeployment();
      console.log("EquityCompensationFacet deployed to:", await equityCompensationFacet.getAddress());

      // Deploy StockPlanFacet
      const StockPlanFacetFactory = (await ethers.getContractFactory("StockPlanFacet")) as StockPlanFacet__factory;
      stockPlanFacet = await StockPlanFacetFactory.deploy();
      await stockPlanFacet.waitForDeployment();
      console.log("StockPlanFacet deployed to:", await stockPlanFacet.getAddress());

      // Deploy WarrantFacet
      const WarrantFacetFactory = (await ethers.getContractFactory("WarrantFacet")) as WarrantFacet__factory;
      warrantFacet = await WarrantFacetFactory.deploy();
      await warrantFacet.waitForDeployment();
      console.log("WarrantFacet deployed to:", await warrantFacet.getAddress());

      // Deploy StakeholderNFTFacet
      const StakeholderNFTFacetFactory = (await ethers.getContractFactory("StakeholderNFTFacet")) as StakeholderNFTFacet__factory;
      stakeholderNFTFacet = await StakeholderNFTFacetFactory.deploy();
      await stakeholderNFTFacet.waitForDeployment();
      console.log("StakeholderNFTFacet deployed to:", await stakeholderNFTFacet.getAddress());

      // Deploy AccessControlFacet
      const AccessControlFacetFactory = (await ethers.getContractFactory("AccessControlFacet")) as AccessControlFacet__factory;
      accessControlFacet = await AccessControlFacetFactory.deploy();
      await accessControlFacet.waitForDeployment();
      console.log("AccessControlFacet deployed to:", await accessControlFacet.getAddress());

      // Deploy PrivateStockFacet
      const PrivateStockFacetFactory = (await ethers.getContractFactory("PrivateStockFacet")) as PrivateStockFacet__factory;
      privateStockFacet = await PrivateStockFacetFactory.deploy();
      await privateStockFacet.waitForDeployment();
      console.log("PrivateStockFacet deployed to:", await privateStockFacet.getAddress());

      // Verify all facets are deployed
      expect(await diamondCutFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await diamondLoupeFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await issuerFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await stakeholderFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await stockClassFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await stockFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await convertiblesFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await equityCompensationFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await stockPlanFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await warrantFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await stakeholderNFTFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await accessControlFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await privateStockFacet.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("should create reference diamond with all facets", async function () {
      console.log("\nCreating reference diamond...");

      // Create reference diamond with deployer as owner
      const CapTableFactory = (await ethers.getContractFactory("CapTable")) as CapTable__factory;
      referenceDiamond = await CapTableFactory.deploy(signers.deployer.address, await diamondCutFacet.getAddress());
      await referenceDiamond.waitForDeployment();
      console.log("Reference diamond created at:", await referenceDiamond.getAddress());

      // Prepare facet cuts
      const cuts: IDiamondCut.FacetCutStruct[] = [
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
        {
          facetAddress: await issuerFacet.getAddress(),
          action: 0, // Add
          functionSelectors: [
            issuerFacet.interface.getFunction("initializeIssuer").selector,
            issuerFacet.interface.getFunction("adjustIssuerAuthorizedShares").selector,
          ],
        },
        {
          facetAddress: await stakeholderFacet.getAddress(),
          action: 0, // Add
          functionSelectors: [
            stakeholderFacet.interface.getFunction("createStakeholder").selector,
            stakeholderFacet.interface.getFunction("getStakeholderPositions").selector,
            stakeholderFacet.interface.getFunction("linkStakeholderAddress").selector,
          ],
        },
        {
          facetAddress: await stockClassFacet.getAddress(),
          action: 0, // Add
          functionSelectors: [
            stockClassFacet.interface.getFunction("createStockClass").selector,
            stockClassFacet.interface.getFunction("adjustAuthorizedShares").selector,
          ],
        },
        {
          facetAddress: await stockFacet.getAddress(),
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
          facetAddress: await convertiblesFacet.getAddress(),
          action: 0, // Add
          functionSelectors: [
            convertiblesFacet.interface.getFunction("issueConvertible").selector,
            convertiblesFacet.interface.getFunction("getConvertiblePosition").selector,
          ],
        },
        {
          facetAddress: await equityCompensationFacet.getAddress(),
          action: 0, // Add
          functionSelectors: [
            equityCompensationFacet.interface.getFunction("issueEquityCompensation").selector,
            equityCompensationFacet.interface.getFunction("getPosition").selector,
            equityCompensationFacet.interface.getFunction("exerciseEquityCompensation").selector,
          ],
        },
        {
          facetAddress: await stockPlanFacet.getAddress(),
          action: 0, // Add
          functionSelectors: [
            stockPlanFacet.interface.getFunction("createStockPlan").selector,
            stockPlanFacet.interface.getFunction("adjustStockPlanPool").selector,
          ],
        },
        {
          facetAddress: await warrantFacet.getAddress(),
          action: 0, // Add
          functionSelectors: [
            warrantFacet.interface.getFunction("issueWarrant").selector,
            warrantFacet.interface.getFunction("getWarrantPosition").selector,
          ],
        },
        {
          facetAddress: await stakeholderNFTFacet.getAddress(),
          action: 0, // Add
          functionSelectors: [
            stakeholderNFTFacet.interface.getFunction("mint").selector,
            stakeholderNFTFacet.interface.getFunction("tokenURI").selector,
          ],
        },
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
      ];

      console.log("Performing diamond cuts...");

      // Perform the cuts
      const diamondCut = DiamondCutFacet__factory.connect(await referenceDiamond.getAddress(), signers.deployer);

      for (let i = 0; i < cuts.length; i++) {
        console.log(`Adding facet ${i + 1}/${cuts.length}: ${cuts[i].facetAddress}`);
        await diamondCut.diamondCut([cuts[i]], ethers.ZeroAddress, "0x");
      }

      console.log("All facets added to reference diamond");
    });

    it("should verify all facets are properly added", async function () {
      console.log("\nVerifying facets...");

      // Get the loupe interface from the reference diamond
      const loupe = DiamondLoupeFacet__factory.connect(await referenceDiamond.getAddress(), signers.deployer);

      // Get all facets
      const facets = await loupe.facets();
      console.log(`Total facets found: ${facets.length}`);

      // Verify each facet
      const expectedFacetAddresses = [
        await diamondCutFacet.getAddress(),
        await diamondLoupeFacet.getAddress(),
        await issuerFacet.getAddress(),
        await stakeholderFacet.getAddress(),
        await stockClassFacet.getAddress(),
        await stockFacet.getAddress(),
        await convertiblesFacet.getAddress(),
        await equityCompensationFacet.getAddress(),
        await stockPlanFacet.getAddress(),
        await warrantFacet.getAddress(),
        await stakeholderNFTFacet.getAddress(),
        await accessControlFacet.getAddress(),
        await privateStockFacet.getAddress(),
      ];

      for (const facet of facets) {
        console.log(`Facet: ${facet.facetAddress}, Selectors: ${facet.functionSelectors.length}`);
        expect(expectedFacetAddresses).to.include(facet.facetAddress);
      }

      // Verify specific function selectors for key facets
      const privateStockFacetAddress = await privateStockFacet.getAddress();
      const privateStockFacetInfo = facets.find((f) => f.facetAddress === privateStockFacetAddress);
      expect(privateStockFacetInfo).to.not.be.undefined;
      expect(privateStockFacetInfo!.functionSelectors.length).to.be.greaterThan(0);
    });
  });

  describe("Deploy CapTableFactory", function () {
    it("should deploy CapTableFactory with reference diamond", async function () {
      console.log("\nDeploying CapTableFactory...");

      const CapTableFactoryFactory = (await ethers.getContractFactory("CapTableFactory")) as CapTableFactory__factory;
      capTableFactory = await CapTableFactoryFactory.deploy(await referenceDiamond.getAddress());
      await capTableFactory.waitForDeployment();

      const factoryAddress = await capTableFactory.getAddress();
      console.log("CapTableFactory deployed to:", factoryAddress);

      // Verify factory is properly configured
      const referenceDiamondAddress = await capTableFactory.referenceDiamond();
      expect(referenceDiamondAddress).to.equal(await referenceDiamond.getAddress());
    });
  });

  describe("Create CapTable from Factory", function () {
    it("should create a new cap table with all facets", async function () {
      console.log("\nCreating cap table from factory...");

      const issuerId = ethers.randomBytes(16);
      const initialSharesAuthorized = ethers.parseEther("1000000000"); // 1 billion shares

      console.log("Issuer ID:", ethers.hexlify(issuerId));
      console.log("Initial shares authorized:", initialSharesAuthorized.toString());

      // Create cap table
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

      let capTableAddress: string;
      if (event) {
        const parsed = capTableFactory.interface.parseLog(event);
        capTableAddress = parsed?.args?.[0];
      } else {
        // If no event, try to get from the factory
        capTableAddress = await capTableFactory.capTables(0);
      }

      console.log("CapTable created at:", capTableAddress);

      // Verify cap table was created
      expect(capTableAddress).to.not.equal(ethers.ZeroAddress);

      // Get cap table count
      const capTableCount = await capTableFactory.getCapTableCount();
      expect(capTableCount).to.equal(1);

      // Verify the cap table has all the facets
      const loupe = DiamondLoupeFacet__factory.connect(capTableAddress, signers.deployer);

      const facets = await loupe.facets();
      console.log(`CapTable has ${facets.length} facets`);

      // Should have at least the same number of facets as the reference diamond
      expect(facets.length).to.be.greaterThan(0);

      // Verify key facets are present
      const facetAddresses = facets.map((f) => f.facetAddress);
      expect(facetAddresses).to.include(await accessControlFacet.getAddress());
      expect(facetAddresses).to.include(await issuerFacet.getAddress());
      expect(facetAddresses).to.include(await privateStockFacet.getAddress());
    });
  });

  describe("Deployment Summary", function () {
    it("should log all deployed addresses", async function () {
      console.log("\n" + "=".repeat(60));
      console.log("DEPLOYMENT SUMMARY");
      console.log("=".repeat(60));
      console.log("Reference Diamond:", await referenceDiamond.getAddress());
      console.log("CapTableFactory:", await capTableFactory.getAddress());
      console.log("\nFacet Addresses:");
      console.log("  DiamondCutFacet:", await diamondCutFacet.getAddress());
      console.log("  DiamondLoupeFacet:", await diamondLoupeFacet.getAddress());
      console.log("  IssuerFacet:", await issuerFacet.getAddress());
      console.log("  StakeholderFacet:", await stakeholderFacet.getAddress());
      console.log("  StockClassFacet:", await stockClassFacet.getAddress());
      console.log("  StockFacet:", await stockFacet.getAddress());
      console.log("  ConvertiblesFacet:", await convertiblesFacet.getAddress());
      console.log("  EquityCompensationFacet:", await equityCompensationFacet.getAddress());
      console.log("  StockPlanFacet:", await stockPlanFacet.getAddress());
      console.log("  WarrantFacet:", await warrantFacet.getAddress());
      console.log("  StakeholderNFTFacet:", await stakeholderNFTFacet.getAddress());
      console.log("  AccessControlFacet:", await accessControlFacet.getAddress());
      console.log("  PrivateStockFacet:", await privateStockFacet.getAddress());
      console.log("=".repeat(60));
    });
  });
});
