import { Router } from "express";
import { hotelRoutes } from "./property-hotel";
import restaurantRoutes from "./property-restaurant";

const propertyRoutes: Router = Router();

propertyRoutes.use("/hotels", hotelRoutes);
propertyRoutes.use("/restaurants", restaurantRoutes);

export default propertyRoutes;
