import { Router } from "express";
import { asyncHandler } from "../exceptions/async-handler";
import {
  createUpdateRestaurant,
  deleteRestaurant,
  getAllRestaurants,
  getRestaurantDetails,
  searchRestaurants,
} from "../controllers/property-restaurant";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { requireTenantManagement } from "../middleware/tenant-access";

const restaurantRoutes: Router = Router();

restaurantRoutes.get("/", optionalAuthMiddleware, asyncHandler(getAllRestaurants));
restaurantRoutes.get("/search/result", optionalAuthMiddleware, asyncHandler(searchRestaurants));
restaurantRoutes.get("/:id", optionalAuthMiddleware, asyncHandler(getRestaurantDetails));

restaurantRoutes.post(
  "/",
  authMiddleware,
  requireTenantManagement,
  asyncHandler(createUpdateRestaurant)
);
restaurantRoutes.put(
  "/:id",
  authMiddleware,
  requireTenantManagement,
  asyncHandler(createUpdateRestaurant)
);

restaurantRoutes.delete(
  "/:id",
  authMiddleware,
  requireTenantManagement,
  asyncHandler(deleteRestaurant)
);

export default restaurantRoutes;
