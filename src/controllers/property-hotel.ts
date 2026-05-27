
import { Request, Response } from "express";
import { hotelSchema } from "../schemas/hotels";
import { handleValidationError } from "../utils/common-method";
import {
  checkRoomAvailabilityService,
  fetchHotelDetails,
  fetchHotels,
  removeHotel,
  searchHotels as searchHotelsService,
  upsertHotel,
} from "../services/hotel.service";
import { resolveTenantId } from "../utils/tenant-access";




export const CreateUpdateHotel = async (req: Request, res: Response) => {
  // ✅ Validate hotel data
  const validation = hotelSchema.safeParse(req.body);
  if (!validation.success) return handleValidationError(res, validation);

  const { name, location, description, amenities, image, rooms } = validation.data;
  const hotelId = req.params.id ? +req.params.id : null;
  const tenantId = resolveTenantId(req, { requireTenant: true });

  if (!tenantId) {
    return res.status(400).json({
      message: "Tenant context required",
    });
  }

  const response = await upsertHotel({
    hotelId,
    tenantId,
    data: { name, location, description, amenities, image, rooms },
  });

  return res.status(response.statusCode).json(response);
};


// Delete a Hotel
export const deleteHotel = async (req: Request, res: Response) => {
  const hotelId = +req.params.id;
  const tenantId = resolveTenantId(req, { requireTenant: true });

  if (!tenantId) {
    return res.status(400).json({
      message: "Tenant context required",
    });
  }

  const response = await removeHotel(hotelId, tenantId);
  return res.status(response.statusCode).json(response);
}

// Get All Hotels
export const getHotels = async (req: Request, res: Response) => {
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const tenantId = resolveTenantId(req);

  const response = await fetchHotels({ page, limit, tenantId });
  return res.status(response.statusCode).json(response);
}

// Get Detailed Hotel Information including Rooms
export const getHotelDetails = async (req: Request, res: Response) => {
  const hotelIdentifier = req.params.id;
  const tenantId = resolveTenantId(req);

  const response = await fetchHotelDetails(hotelIdentifier, tenantId);
  res.status(response.statusCode).json(response);
};


// Search Hotels by Location, Room Type, and Price Range
export const searchHotels = async (req: Request, res: Response) => {

  const { location, minPrice, maxPrice, roomType, name } = req.query;

  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const tenantId = resolveTenantId(req);

  const response = await searchHotelsService({
    location: location as string | undefined,
    minPrice: minPrice as string | undefined,
    maxPrice: maxPrice as string | undefined,
    roomType: roomType as string | undefined,
    name: name as string | undefined,
    page,
    limit,
    tenantId,
  });

  res.status(response.statusCode).json(response);
};

export const checkRoomAvailability = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { roomId, date, quantity } = req.query as {
    roomId: string;
    date: string;
    quantity: string
  };

  const response = await checkRoomAvailabilityService({
    roomId: roomId ? +roomId : undefined,
    date,
    quantity: quantity ? +quantity : undefined,
  });

  return res.status(response.statusCode).json(response);
};
