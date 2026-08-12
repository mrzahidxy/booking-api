import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../exceptions/async-handler";
import { getCurrentUser, getUserById, getUsers, saveFcmToken, updateCurrentUser, updateUser } from "../controllers/user";
import { requirePlatformAdmin } from "../middleware/require-platform-admin";
import { requireWorkspaceManager } from "../middleware/require-workspace-manager";


const userRoutes: Router =  Router();

userRoutes.put('/fcm', authMiddleware, asyncHandler(saveFcmToken))

userRoutes.get("/me", authMiddleware, asyncHandler(getCurrentUser));
userRoutes.put("/me", authMiddleware, asyncHandler(updateCurrentUser));
userRoutes.get("/", authMiddleware, requireWorkspaceManager, asyncHandler(getUsers));
userRoutes.get("/:id", authMiddleware, requireWorkspaceManager, asyncHandler(getUserById));
userRoutes.put("/:id", authMiddleware, requirePlatformAdmin, asyncHandler(updateUser));

export default userRoutes
