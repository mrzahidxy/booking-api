import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { HTTPSuccessResponse } from "../helpers/success-response";
import { ErrorCode } from "../exceptions/root";
import { NotFoundException } from "../exceptions/not-found";
import { BadRequestException } from "../exceptions/bad-request";
import { formatPaginationResponse } from "../utils/common-method";



// Role Management
export const getRoles = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Fetch roles with pagination
  const roles = await prisma.role.findMany({ skip, take: limit });
  const totalRoles = await prisma.role.count();

  if (!roles || roles.length === 0) {
    throw new NotFoundException("No roles found", ErrorCode.ROLE_NOT_FOUND);
  }

  const formattedResponse = formatPaginationResponse(roles, totalRoles, page, limit);

  const response = new HTTPSuccessResponse(
    "Roles fetched successfully",
    200,
    formattedResponse
  );
  return res.status(response.statusCode).json(response);

};

export const getRoleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const role = await prisma.role.findUnique({
    where: {
      id: +id,
    },
  });


  if (!role) {
    throw new NotFoundException("Role not found", ErrorCode.ROLE_NOT_FOUND);
  }

  const response = new HTTPSuccessResponse(
    "Role fetched successfully",
    200,
    role

  )
  return res.status(response.statusCode).json(response);
}

// Permission Management
export const getPermissions = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Fetch permissions with pagination
  const permissions = await prisma.permission.findMany({ skip, take: limit });
  const totalPermissions = await prisma.permission.count();


  if (!permissions || permissions.length === 0) {
    throw new NotFoundException(
      "No permissions found",
      ErrorCode.PERMISIION_NOT_FOUND
    );
  }
  const formattedResponse = formatPaginationResponse(permissions, totalPermissions, page, limit);

  const response = new HTTPSuccessResponse(
    "Permissions fetched successfully",
    200,
    formattedResponse
  );
  return res.status(response.statusCode).json(response);

};

export const getPermissionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const permission = await prisma.permission.findUnique({
    where: {
      id: +id,
    },
  });

  if (!permission) {
    throw new NotFoundException(
      "Permission not found",
      ErrorCode.PERMISIION_NOT_FOUND
    );
  }

  const response = new HTTPSuccessResponse(
    "Permission fetched successfully",
    200,
    permission
  )
  return res.status(response.statusCode).json(response);
}

// Ssign Permissions to Role

export const getAssignedPermissions = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Step 1️⃣: Get total distinct roles count
  const totalRoles = await prisma.role.count();

  if (totalRoles === 0) {
    throw new NotFoundException("No roles found", ErrorCode.ROLE_NOT_FOUND);
  }

  // Step 2️⃣: Fetch paginated roles
  const roles = await prisma.role.findMany({
    skip,
    take: limit,
  });

  const roleIds = roles.map((role) => role.id);

  // Step 3️⃣: Fetch permissions for these roles
  const permissions = await prisma.rolePermission.findMany({
    where: {
      roleId: { in: roleIds },
    },
    include: {
      permission: true,
    },
  });

  // Step 4️⃣: Group permissions under their roles
  const rolePermissionsMap = new Map<number, { roleId: number; roleName: string; permissions: string[] }>();

  roles.forEach((role) => {
    rolePermissionsMap.set(role.id, {
      roleId: role.id,
      roleName: role.name,
      permissions: [],
    });
  });

  permissions.forEach((rp) => {
    const role = rolePermissionsMap.get(rp.roleId);
    if (role) {
      role.permissions.push(rp.permission.name);
    }
  });

  const formattedPermissions = Array.from(rolePermissionsMap.values());

  // Step 5️⃣: Format pagination response
  const formattedResponse = formatPaginationResponse(
    formattedPermissions,
    totalRoles,
    page,
    limit
  );

  return res.status(200).json(
    new HTTPSuccessResponse(
      "Assigned Permissions fetched successfully",
      200,
      formattedResponse
    )
  );
};

export const getAssignedPermissionsById = async (req: Request, res: Response) => {
  const roleId = parseInt(req.params.id);

  if (!roleId) {
    throw new NotFoundException("Invalid role ID", ErrorCode.ROLE_NOT_FOUND);
  }

  // Fetch the role
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new NotFoundException("Role not found", ErrorCode.ROLE_NOT_FOUND);
  }

  // Fetch all permissions assigned to this role
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: {
      permission: true,
    },
  });

  const permissionIds = rolePermissions.map((rp) => rp.permissionId);

  const result = {
    roleId: role.id,
    roleName: role.name,
    permissionIds,
  };

  const response = new HTTPSuccessResponse(
    "Role-wise permissions fetched successfully",
    200,
    result
  );

  return res.status(response.statusCode).json(response);
}

export const createOrUpdateRolePermission = async (req: Request, res: Response) => {
  const { permissionIds, roleId } = req.body;

  // ✅ Check if role exists
  const role = await prisma.role.findUnique({
    where: { id: +roleId },
  });

  if (!role) {
    throw new NotFoundException("Role not found", ErrorCode.ROLE_NOT_FOUND);
  }

  // ✅ Validate permissions
  const permissions = await prisma.permission.findMany({
    where: {
      id: {
        in: permissionIds,
      },
    },
  });

  if (permissions.length !== permissionIds.length) {
    throw new BadRequestException(
      "Some permissions are invalid",
      ErrorCode.PERMISSION_ALREADY_EXISTS
    );
  }

  // ✅ Delete all existing role-permission mappings for this role (if any)
  await prisma.rolePermission.deleteMany({
    where: { roleId: role.id },
  });

  // ✅ Insert new role-permission mappings
  const newRolePermissions = permissionIds.map((permissionId: number) => ({
    roleId: role.id,
    permissionId,
  }));

  await prisma.rolePermission.createMany({
    data: newRolePermissions,
  });

  const response = new HTTPSuccessResponse(
    "Role permissions assigned successfully",
    200,
    {
      roleId: role.id,
      permissionsAssigned: permissionIds,
    }
  );

  return res.status(response.statusCode).json(response);
};


// Assign Role to User

export const getRoleWiseUserList = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const users = await prisma.user.findMany({
    skip,
    take: limit,
    include: {
      role: true
    }
  })

  const totalUsers = await prisma.user.count();

  if (!users || users.length === 0) {
    throw new NotFoundException("No users found", ErrorCode.USER_NOT_FOUND);
  }

  const formattedResponse = formatPaginationResponse(users, totalUsers, page, limit);

  return res.status(200).json(
    new HTTPSuccessResponse(
      "Users fetched successfully",
      200,
      formattedResponse
    )
  )
}

export const GetUserRoleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: {
      id: +id,
    },
    include: {
      role: true
    }
  });

  if (!user) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }

  const response = new HTTPSuccessResponse(
    "User fetched successfully",
    200,
    user
  );

  return res.status(response.statusCode).json(response);

}


export const assaignUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roleId } = req.body;

  // Check if user and role exist
  const user = await prisma.user.findUnique({
    where: {
      id: +id,
    },
  });

  if (!user) {
    throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
  }

  // Check if role exist
  const role = await prisma.role.findUnique({
    where: {
      id: +roleId,
    },
  });

  if (!role) {
    throw new NotFoundException("Role not found", ErrorCode.ROLE_NOT_FOUND);
  }

  // Check if role assignment already exists
  if (user?.roleId === role?.id) {
    throw new BadRequestException(
      "Role already assigned to user",
      ErrorCode.BAD_REQUEST
    );
  }

  const newRoleAssignment = await prisma.user.update({
    where: {
      id: +id,
    },
    data: {
      roleId: +roleId,
    },
  });

  const response = new HTTPSuccessResponse(
    "Role assignment created successfully",
    201,
    newRoleAssignment
  );
  res.status(response.statusCode).json(response);
};
