import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

const normalizeNameField = (value: unknown) => {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  if (value && typeof value === "object" && "set" in value) {
    const setValue = (value as { set?: unknown }).set;
    if (typeof setValue === "string") {
      return { ...(value as object), set: setValue.toUpperCase() };
    }
  }
  return value;
};

const normalizeRolePermissionData = (data: Record<string, unknown>) => {
  if (!data) return;
  if ("name" in data) {
    data.name = normalizeNameField(data.name);
  }
};

// Lazy-initialize Prisma so cold starts and simple routes (like /live) don't spin up a DB connection until needed.
const getPrisma = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
    prisma.$use(async (params, next) => {
      if (params.model === "Role" || params.model === "Permission") {
        if (params.action === "create" || params.action === "update" || params.action === "updateMany") {
          normalizeRolePermissionData(params.args?.data);
        } else if (params.action === "createMany") {
          const data = params.args?.data;
          if (Array.isArray(data)) {
            data.forEach((item) => normalizeRolePermissionData(item));
          } else if (data) {
            normalizeRolePermissionData(data);
          }
        } else if (params.action === "upsert") {
          normalizeRolePermissionData(params.args?.create);
          normalizeRolePermissionData(params.args?.update);
        }
      }
      return next(params);
    });
  }
  return prisma;
};

// Lazy proxy so existing imports don't trigger a connection until first query.
const prismaProxy = new Proxy({} as PrismaClient, {
  get: (_target, prop, receiver) => {
    const client = getPrisma();
    const value = Reflect.get(client as any, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prismaProxy;
