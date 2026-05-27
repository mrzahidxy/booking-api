import { Request, Response } from "express";
import {
  createAdminTenantMemberService,
  createAdminOwnerService,
  deleteAdminTenantMemberService,
  getAdminDashboardStatsService,
  getAdminTenantService,
  getAdminTenantMembersService,
  getAdminTenantsService,
  updateAdminTenantMemberRoleService,
  updateAdminTenantStatusService,
} from "../services/admin.service";
import { resolveTenantId } from "../utils/tenant-access";
import {
  CreateOwnerSchema,
  CreateTenantMemberSchema,
  UpdateTenantMemberSchema,
} from "../schemas/users";
import { TenantMemberRole } from "@prisma/client";

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

export const getAdminTenantMembers = async (req: Request, res: Response) => {
  const tenantId = Number(req.params.id);
  const response = await getAdminTenantMembersService(tenantId);
  return res.status(response.statusCode).json(response);
};

export const createAdminTenantMember = async (req: Request, res: Response) => {
  const tenantId = Number(req.params.id);
  const payload = CreateTenantMemberSchema.parse(req.body);
  const response = await createAdminTenantMemberService(tenantId, {
    ...payload,
    role: payload.role as TenantMemberRole,
  });
  return res.status(response.statusCode).json(response);
};

export const updateAdminTenantMemberRole = async (
  req: Request,
  res: Response
) => {
  const tenantId = Number(req.params.id);
  const memberId = Number(req.params.memberId);
  const payload = UpdateTenantMemberSchema.parse(req.body);
  const response = await updateAdminTenantMemberRoleService(
    tenantId,
    memberId,
    payload.role as TenantMemberRole
  );
  return res.status(response.statusCode).json(response);
};

export const deleteAdminTenantMember = async (req: Request, res: Response) => {
  const tenantId = Number(req.params.id);
  const memberId = Number(req.params.memberId);
  const response = await deleteAdminTenantMemberService(tenantId, memberId);
  return res.status(response.statusCode).json(response);
};
