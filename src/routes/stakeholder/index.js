import { Router } from "express";
import baseStakeholder from "./base.js";

const router = Router();

// Mount base stakeholder routes
router.use("/", baseStakeholder);

// Mount your companies specific routes

export default router;
