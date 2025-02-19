// @ts-nocheck
import { Router } from "express";

import { readFactories } from "../db/operations/read";
import { upsertFactory } from "../db/operations/update";

export const router = Router();

router.get("/", async (req, res) => {
    try {
        const factories = await readFactories();
        res.json(factories);
    } catch (error) {
        console.error("Error getting factories:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/register", async (req, res) => {
    /*
    Register the factory contracts addresses
    */
    try {
        const { factory_address, implementation_address, chain_id } = req.body;
        const factory = await upsertFactory({ factory_address, implementation_address, chain_id });
        res.send({ factory });
    } catch (error) {
        console.error(error);
        res.status(500).send(`${error}`);
    }
});

export default router;
