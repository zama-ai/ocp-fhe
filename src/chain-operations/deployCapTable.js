import { ethers } from "ethers";
// import CAP_TABLE from "../../chain/out/CapTable.sol/CapTable.json";
// import CAP_TABLE_FACTORY from "../../chain/out/CapTableFactory.sol/CapTableFactory.json";
import CAP_TABLE_FACTORY_DIAMOND from "../../chain/out/DiamondCapTableFactory.sol/DiamondCapTableFactory.json";
// import { readfactories } from "../db/operations/read.js";
import { toScaledBigNumber } from "../utils/convertToFixedPointDecimals.js";
import { setupEnv } from "../utils/env.js";
// import getTXLibContracts from "../utils/getLibrariesContracts.js";
import getProvider from "./getProvider.js";

setupEnv();

async function deployCapTable(issuerId, initial_shares_authorized) {
    const WALLET_PRIVATE_KEY = process.env.PRIVATE_KEY;

    const provider = getProvider();

    const wallet = new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
    console.log("🗽 | Wallet address: ", wallet.address);

    // const factories = await readfactories();
    const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // factories[0]?.factory_address;
    // console.log({ factories, factoryAddress });

    if (!factoryAddress) {
        throw new Error(`❌ | Factory address not found`);
    }

    const capTableFactory = new ethers.Contract(factoryAddress, CAP_TABLE_FACTORY_DIAMOND.abi, wallet);

    console.log("Creating a new cap table...");
    const tx = await capTableFactory.createCapTable(issuerId, toScaledBigNumber(initial_shares_authorized));
    await tx.wait();
    console.log({ tx });
    console.log("Cap table created");
    const capTableCount = await capTableFactory.getCapTableCount();

    console.log("📄 | Cap table count: ", capTableCount);

    const latestCapTableProxyContractAddress = await capTableFactory.capTables(capTableCount - BigInt(1));

    // const contract = new ethers.Contract(latestCapTableProxyContractAddress, CAP_TABLE.abi, wallet);

    console.log("⏳ | Waiting for contract to be deployed...");
    // console.log("✅ | Cap table contract address ", latestCapTableProxyContractAddress);
    // const libraries = getTXLibContracts(latestCapTableProxyContractAddress, wallet);

    return {
        contract: null,
        provider,
        address: latestCapTableProxyContractAddress,
        libraries: null,
        deployHash: tx.hash,
    };
}

export default deployCapTable;
