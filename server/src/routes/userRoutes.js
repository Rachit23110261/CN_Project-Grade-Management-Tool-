import express from "express";
import { getUsersByRole, bulkRegisterUsers } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/role/:role", protect, adminOnly, getUsersByRole);
router.post("/bulk-register", protect, adminOnly, bulkRegisterUsers);

export default router;
