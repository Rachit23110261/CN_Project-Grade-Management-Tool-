import express from "express";
import { getUsersByRole, bulkRegisterUsers, deleteUser } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateBulkRegistration, validateUserId } from "../middleware/validationMiddleware.js";
import { bulkOperationLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/role/:role", protect, adminOnly, getUsersByRole);
router.post("/bulk-register", protect, adminOnly, bulkOperationLimiter, validateBulkRegistration, bulkRegisterUsers);
router.delete("/:userId", protect, adminOnly, validateUserId, deleteUser);

export default router;
