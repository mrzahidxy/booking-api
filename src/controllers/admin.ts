import { Request, Response } from "express";
import {
  createAdminOwnerService,
  getAdminDashboardStatsService,
  getAdminTenantService,
  getAdminTenantsService,
  updateAdminTenantStatusService,
} from "../services/admin.service";
import { resolveTenantId } from "../utils/tenant-access";
import { CreateOwnerSchema } from "../schemas/users";

export const getAdminDashboardStats = async (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const response = await getAdminDashboardStatsService(tenantId);
  return res.status(response.statusCode).json(response);
};

export const getAdminTenants = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const response = await getAdminTenantsService({ page, limit });
  return res.status(response.statusCode).json(response);
};

export const getAdminTenant = async (req: Request, res: Response) => {
  const tenantId = Number(req.params.id);
  const response = await getAdminTenantService(tenantId);
  return res.status(response.statusCode).json(response);
};

export const updateAdminTenantStatus = async (req: Request, res: Response) => {
  const tenantId = Number(req.params.id);
  const isActive = req.body?.isActive;
  const response = await updateAdminTenantStatusService(tenantId, isActive);
  return res.status(response.statusCode).json(response);
};

export const createAdminOwner = async (req: Request, res: Response) => {
  CreateOwnerSchema.parse(req.body);
  const response = await createAdminOwnerService(req.body);
  return res.status(response.statusCode).json(response);
};
