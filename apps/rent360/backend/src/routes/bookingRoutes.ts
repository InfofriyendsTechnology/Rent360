import { Router } from "express";
import {
  getAllBookings,
  createBooking,
  getBookingById,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createBookingSchema,
  updateBookingSchema,
} from "../validations/booking.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllBookings);
router.post("/", validator({ body: createBookingSchema }), createBooking);
router.get("/:id", getBookingById);
router.put("/:id", validator({ body: updateBookingSchema }), updateBooking);
router.delete("/:id", deleteBooking);
export default router;
