import { isCallException, isError, Interface } from "ethers";
import CAP_TABLE from "../../chain/out/CapTable.sol/CapTable.json" assert { type: "json" };

// Create an Interface instance
const icap = new Interface(CAP_TABLE.abi);

export const withChainErrorHandler =
    (fn) =>
    async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            if (isCallException(error)) {
                console.log("incoming error", error);
                try {
                    const decodedError = icap.parseError(error.data);
                    console.error(`Onchain error: ${decodedError.name}`, decodedError.args);
                    throw new Error(`Onchain - ${decodedError.name}: ${decodedError.args}`);
                } catch (parseError) {
                    console.log("captable interface decoding failed - trying stock lib interface");
                    const decodedError = icap.parseTransaction(error.transaction);
                    console.log({ decodedError });
                    console.error(`Onchain error: ${decodedError.name}`, decodedError.args);
                    throw new Error(`Onchain - ${decodedError.name}: ${decodedError.args}`);
                }
            }
            throw error; // Re-throw the error after logging
        }
    };
