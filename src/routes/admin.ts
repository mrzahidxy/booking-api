import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../exceptions/async-handler";
import {
  createAdminOwner,
  getAdminDashboardStats,
  getAdminTenant,
  getAdminTenants,
  updateAdminTenantStatus,
} from "../controllers/admin";
import { requireTenantManagement } from "../middleware/tenant-access";
import { requirePlatformAdmin } from "../middleware/require-platform-admin";

const adminRoutes: Router = Router();

adminRoutes.post(
  "/owners",
  authMiddleware,
  requirePlatformAdmin,
  asyncHandler(createAdminOwner)
);

adminRoutes.get(
  "/stats",
  authMiddleware,
  requireTenantManagement,
  asyncHandler(getAdminDashboardStats)
);

adminRoutes.get(
  "/tenants",
  authMiddleware,
  requirePlatformAdmin,
  asyncHandler(getAdminTenants)
);

adminRoutes.get(
  "/tenants/:id",
  authMiddleware,
  requirePlatformAdmin,
  asyncHandler(getAdminTenant)
);

adminRoutes.patch(
  "/tenants/:id/status",
  authMiddleware,
  requirePlatformAdmin,
  asyncHandler(updateAdminTenantStatus)
);

export default adminRoutes;
