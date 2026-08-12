import { PropertyKind } from "@prisma/client";

export const buildPropertyWhere = (kind: PropertyKind, tenantId?: number | null) => {
  return tenantId == null ? { kind } : { tenantId, kind };
};

export const resolvePropertyIdentifierWhere = (identifier: string) => {
  return { slug: identifier };
};
