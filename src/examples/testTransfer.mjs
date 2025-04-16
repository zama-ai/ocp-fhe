import { issuer, stakeholder1, stakeholder2, stockClass, stockIssuance, stockTransfer } from "./sampleData.js";
import axios from "axios";
import sleep from "../utils/sleep.js";
import { v4 as uuid } from "uuid";
import { setupEnv } from "../utils/env.js";

setupEnv();

const API_URL = `http://localhost:${process.env.PORT || 8080}`;
const CHAIN_ID = process.env.CHAIN_ID;
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
const IMPLEMENTATION_ADDRESS = process.env.REFERENCE_DIAMOND;

const main = async () => {
    try {
        // First register the factory
        console.log("⏳ Registering factory...", { CHAIN_ID, FACTORY_ADDRESS, IMPLEMENTATION_ADDRESS });
        const factoryResponse = await axios.post(`${API_URL}/factory/register`, {
            chain_id: parseInt(CHAIN_ID),
            factory_address: FACTORY_ADDRESS,
            implementation_address: IMPLEMENTATION_ADDRESS,
        });
        console.log("✅ Factory registered:", factoryResponse.data);

        // Debug: Check factory directly
        const checkFactory = await axios.get(`${API_URL}/factory`);
        console.log("Current factories:", checkFactory.data);

        await sleep(2000);

        // Generate UUIDs
        const issuerId = uuid();
        const stakeholder1Id = uuid();
        const stakeholder2Id = uuid();
        const stockClassId = uuid();

        // 1. Create issuer
        console.log("⏳ Creating issuer...");
        issuer.id = issuerId;
        issuer.chain_id = parseInt(CHAIN_ID);
        const issuerResponse = await axios.post(`${API_URL}/issuer/create`, issuer);
        console.log("✅ Issuer created:", issuerResponse.data);

        await sleep(2000);

        // 2. Create stakeholder1
        console.log("\n⏳ Creating stakeholder1...");
        const sh1Data = stakeholder1(issuerId);
        sh1Data.data.id = stakeholder1Id;
        const stakeholder1Response = await axios.post(`${API_URL}/stakeholder/create`, sh1Data);
        console.log("✅ Stakeholder1 created:", stakeholder1Response.data);

        await sleep(2000);

        // 3. Create stakeholder2
        console.log("\n⏳ Creating stakeholder2...");
        const sh2Data = stakeholder2(issuerId);
        sh2Data.data.id = stakeholder2Id;
        const stakeholder2Response = await axios.post(`${API_URL}/stakeholder/create`, sh2Data);
        console.log("✅ Stakeholder2 created:", stakeholder2Response.data);

        await sleep(2000);

        // 4. Create stock class
        console.log("\n⏳ Creating stock class...");
        const stockClassData = stockClass(issuerId);
        stockClassData.data.id = stockClassId;
        const stockClassResponse = await axios.post(`${API_URL}/stock-class/create`, stockClassData);
        console.log("✅ Stock class created:", stockClassResponse.data);

        await sleep(2000);

        // 5. Create stock issuance to stakeholder1
        console.log("\n⏳ Creating stock issuance...");
        const issuanceData = stockIssuance(issuerId, stakeholder1Id, stockClassId, "1000", "1");
        const stockIssuanceResponse = await axios.post(`${API_URL}/transactions/issuance/stock`, issuanceData);
        console.log("✅ Stock issued:", stockIssuanceResponse.data);

        await sleep(2000);

        // 6. Create transfer from stakeholder1 to stakeholder2
        console.log("\n⏳ Creating stock transfer...");
        const transferData = stockTransfer(issuerId, "500", stakeholder1Id, stakeholder2Id, stockClassId, "1");
        const transferResponse = await axios.post(`${API_URL}/transactions/transfer/stock`, transferData);
        console.log("✅ Stock transferred:", transferResponse.data);

        console.log("\nTest completed successfully! 🎉");
    } catch (error) {
        if (error.response) {
            console.error("Error Response:", {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            });
        } else if (error.request) {
            console.error("Error Request:", error.request);
        } else {
            console.error("Error Message:", error.message);
        }
        console.error("Error Config:", error.config);
    }
};

main();
