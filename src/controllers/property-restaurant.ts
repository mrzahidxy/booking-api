import { Request, Response } from "express";
import { reservationSchema } from "../schemas/booking";
import { handleValidationError } from "../utils/common-method";
import { restaurantSchema } from "../schemas/restaurant";
import {
  checkTableAvailabilityService,
  fetchRestaurantDetailsService,
  fetchRestaurantsService,
  removeRestaurant,
  reserveTableService,
  searchRestaurantsService,
  upsertRestaurant,
} from "../services/restaurant.service";
import { resolveTenantId } from "../utils/tenant-access";


export const createUpdateRestaurant = async (req: Request, res: Response) => {
  const validation = restaurantSchema.safeParse(req.body);
  if (!validation.success) return handleValidationError(res, validation);
  const { name, location, cuisine, seats, menu, image, description } = validation.data;
  const restaurantId = req.params.id ? +req.params.id : null;
  const tenantId = resolveTenantId(req, { requireTenant: true });

  if (!tenantId) {
    return res.status(400).json({ message: "Tenant context required" });
  }

  const response = await upsertRestaurant({
    restaurantId,
    tenantId,
    data: {
      name,
      location,
      cuisine,
      seats,
      menu,
      image,
      description,
    },
  });
  return res.status(response.statusCode).json(response);
};

export const deleteRestaurant = async (req: Request, res: Response) => {
  const restaurantId = +req.params.id;
  const tenantId = resolveTenantId(req, { requireTenant: true });

  if (!tenantId) {
    return res.status(400).json({ message: "Tenant context required" });
  }

  const response = await removeRestaurant(restaurantId, tenantId);
  return res.status(response.statusCode).json(response);
};

export const getAllRestaurants = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const tenantId = resolveTenantId(req);

  const response = await fetchRestaurantsService({
    page: +page,
    limit: +limit,
    tenantId,
  });
  res.status(response.statusCode).json(response);
};

// // Search Restaurants by Cuisine, Location, Price Range, and Availability

export const searchRestaurants = async (req: Request, res: Response) => {
  // Validate and parse query parameters
  const { name, location, ratings, cuisine, page = 1, limit = 10 } = req.query;
  const tenantId = resolveTenantId(req);

  const response = await searchRestaurantsService({
    name: name as string | undefined,
    location: location as string | undefined,
    ratings: ratings as string | undefined,
    cuisine: cuisine as string | undefined,
    page: parseInt(page as string, 10),
    limit: parseInt(limit as string, 10),
    tenantId,
  });
  return res.status(response.statusCode).json(response);
};


// // Get Detailed Restaurant Information
export const getRestaurantDetails = async (req: Request, res: Response) => {
  const restaurantIdentifier = req.params.id;
  const tenantId = resolveTenantId(req);

  const response = await fetchRestaurantDetailsService(restaurantIdentifier, tenantId);
  res.status(response.statusCode).json(response);
};

// Check table availability for a restaurant
export const checkTableAvailability = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Extract query parameters
  const { propertyId, restaurantId, date, partySize, timeSlot } = req.query as {
    propertyId?: string;
    restaurantId: string;
    date: string;
    timeSlot: string;
    partySize?: string; // Optional
  };

  const response = await checkTableAvailabilityService({
    restaurantId: propertyId ? +propertyId : restaurantId ? +restaurantId : undefined,
    date,
    partySize: partySize ? Number(partySize) : undefined,
    timeSlot,
  });

  return res.status(response.statusCode).json(response);
};

// Reserve a table at a restaurant
export const reserveTable = async (req: Request, res: Response) => {
  // Validate request data
  const validationResult = reservationSchema.safeParse(req.body);
  if (!validationResult.success) {
    return handleValidationError(res, validationResult);
  }

  const { propertyId, restaurantId, bookingDate, partySize, timeSlot } =
    validationResult.data;
  const resolvedRestaurantId = propertyId ?? restaurantId;

  if (!resolvedRestaurantId) {
    return res.status(400).json({ message: "propertyId is required" });
  }

  const response = await reserveTableService({
    userId: req.user?.id,
    restaurantId: resolvedRestaurantId,
    bookingDate: new Date(bookingDate),
    partySize,
    timeSlot,
  });

  return res.status(response.statusCode).json(response);
};
