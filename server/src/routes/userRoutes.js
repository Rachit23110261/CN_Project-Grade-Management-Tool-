import express from "express";
import { getUsersByRole } from "../controllers/userController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/role/:role", verifyToken, isAdmin, getUsersByRole);

export default router;
