import { Router } from "express";
import { asyncHandler } from "../exceptions/async-handler";
import { createReview, deleteReview, getReviews, updateReview } from "../controllers/review";
import { authMiddleware } from "../middleware/auth";

const reviewRoutes: Router = Router();

reviewRoutes.get("/", asyncHandler(getReviews));
reviewRoutes.post("/", authMiddleware, asyncHandler(createReview));
reviewRoutes.delete("/:id", authMiddleware, asyncHandler(deleteReview));
reviewRoutes.put("/:id", authMiddleware, asyncHandler(updateReview));


export default reviewRoutes;
