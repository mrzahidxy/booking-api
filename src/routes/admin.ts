import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../exceptions/async-handler";
import {
  createAdminTenantMember,
  createAdminOwner,
  deleteAdminTenantMember,
  getAdminDashboardStats,
  getAdminTenant,
  getAdminTenantMembers,
  getAdminTenants,
  updateAdminTenantMemberRole,
  updateAdminTenantStatus,
} from "../controllers/admin";
import { requireTenantManagement } from "../middleware/tenant-access";
import { requirePlatformAdmin } from "../middleware/require-platform-admin";
import { requirePlatformAdminOrTenantOwner } from "../middleware/require-platform-admin-or-tenant-owner";

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

adminRoutes.get(
  "/tenants/:id/members",
  authMiddleware,
  requirePlatformAdminOrTenantOwner,
  asyncHandler(getAdminTenantMembers)
);

adminRoutes.post(
  "/tenants/:id/members",
  authMiddleware,
  requirePlatformAdminOrTenantOwner,
  asyncHandler(createAdminTenantMember)
);

adminRoutes.patch(
  "/tenants/:id/members/:memberId",
  authMiddleware,
  requirePlatformAdminOrTenantOwner,
  asyncHandler(updateAdminTenantMemberRole)
);

adminRoutes.delete(
  "/tenants/:id/members/:memberId",
  authMiddleware,
  requirePlatformAdminOrTenantOwner,
  asyncHandler(deleteAdminTenantMember)
);

export default adminRoutes;
