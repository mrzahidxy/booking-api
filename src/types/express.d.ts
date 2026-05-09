import express from "express";
import type { TenantMembership } from "../utils/tenant-access";
import { User } from "@prisma/client";


// declare module 'express'{
//     export interface Request {
//         user?: User
//     }
// }


declare global {
    namespace Express {
      interface Request {
        user?: User & {
          role?: {
            name: string;
            rolePermission?: { permission: { name: string } }[];
          };
          tenantMembership?: TenantMembership;
        }; // Add this line to declare the user property
        userPermissions?: Set<string>;
      }
    }
  }
  
