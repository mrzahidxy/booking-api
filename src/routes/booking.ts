import { Router } from "express";
import { bookingStatusUpdate, bookRoom, getBookings, getUserBookings } from "../controllers/booking";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../exceptions/async-handler";
import { checkRoomAvailability } from "../controllers/property-hotel";
import { checkTableAvailability, reserveTable } from "../controllers/property-restaurant";
import { requireTenantManagement } from "../middleware/tenant-access";



export const bookingRoute: Router = Router();

bookingRoute.post('/room', authMiddleware, asyncHandler(bookRoom))
bookingRoute.get('/', authMiddleware, asyncHandler(getUserBookings))
bookingRoute.get('/admin', authMiddleware, requireTenantManagement, asyncHandler(getBookings))
bookingRoute.put('/status/:id', authMiddleware, requireTenantManagement, asyncHandler(bookingStatusUpdate))
bookingRoute.get('/check-room', asyncHandler(checkRoomAvailability) )
bookingRoute.post('/restaurant', authMiddleware, asyncHandler(reserveTable))
bookingRoute.get('/check-restaurant', asyncHandler(checkTableAvailability))
