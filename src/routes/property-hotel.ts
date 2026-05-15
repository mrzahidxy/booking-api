import { Router } from "express";
import { asyncHandler } from "../exceptions/async-handler";
import {
  CreateUpdateHotel,
  deleteHotel,
  getHotelDetails,
  getHotels,
  searchHotels,
} from "../controllers/property-hotel";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { requireTenantManagement } from "../middleware/tenant-access";


export const hotelRoutes: Router = Router();

hotelRoutes.get("/", optionalAuthMiddleware, asyncHandler(getHotels));
hotelRoutes.get("/search/result", optionalAuthMiddleware, asyncHandler(searchHotels));
hotelRoutes.get("/:id", optionalAuthMiddleware, asyncHandler(getHotelDetails));


hotelRoutes.post(
  "/",
  authMiddleware,
  requireTenantManagement,
  asyncHandler(CreateUpdateHotel)
);

hotelRoutes.put(
  "/:id",
  authMiddleware,
  requireTenantManagement,
  asyncHandler(CreateUpdateHotel)
);

hotelRoutes.delete(
  "/:id",
  authMiddleware,
  requireTenantManagement,
  asyncHandler(deleteHotel)
);

