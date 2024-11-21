import { convertUUIDToBytes16 } from "../../utils/convertUUID.js";
import { toScaledBigNumber } from "../../utils/convertToFixedPointDecimals.js";
import { withChainErrorHandler } from "../helper.js";

export const convertAndCreateIssuanceStockOnchain = withChainErrorHandler(
    async (contract, { security_id, stock_class_id, stakeholder_id, quantity, share_price }) => {
        const stockClassIdBytes16 = convertUUIDToBytes16(stock_class_id);
        const stakeholderIdBytes16 = convertUUIDToBytes16(stakeholder_id);
        const securityIdBytes16 = convertUUIDToBytes16(security_id);
        const quantityScaled = toScaledBigNumber(quantity);
        const sharePriceScaled = toScaledBigNumber(share_price.amount);

        // Second: create issuance onchain
        console.log(JSON.stringify(contract, null, 2));
        const tx = await contract.issueStock(stockClassIdBytes16, sharePriceScaled, quantityScaled, stakeholderIdBytes16, securityIdBytes16);
        await tx.wait();
        console.log("Transaction hash:", tx.hash);

        console.log("✅ | Issued stock onchain, unconfirmed: ", { security_id, stock_class_id, stakeholder_id, quantity, share_price });
    }
);
