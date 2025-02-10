import { Router } from "express";
import baseTransactions from "./base.js";

const router = Router();

// Mount base transactions routes
router.use("/", baseTransactions);

// Mount your company's specific transactions routes

export default router;
