import express from "express";
import { getUsersByRole } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/role/:role", protect, adminOnly, getUsersByRole);

export default router;
