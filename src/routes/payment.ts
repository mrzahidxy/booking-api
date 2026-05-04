import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  cancelCheckoutSession,
  createCheckoutSession,
  getCheckoutSession,
} from "../controllers/payment";
import { asyncHandler } from "../exceptions/async-handler";

export const paymentRoutes: Router = Router();

paymentRoutes.post('/:id', authMiddleware, asyncHandler(createCheckoutSession));
paymentRoutes.post('/:bookingId/cancel', authMiddleware, asyncHandler(cancelCheckoutSession));
paymentRoutes.get('/session/:sessionId', authMiddleware, asyncHandler(getCheckoutSession));
