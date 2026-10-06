import { Router } from "express";
import {
  getAllOffers,
  createOffer,
  getOfferById,
  updateOffer,
  deleteOffer,
} from "../controllers/offerController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createOfferSchema,
  updateOfferSchema,
} from "../validations/offer.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllOffers);
router.post("/", validator({ body: createOfferSchema }), createOffer);
router.get("/:id", getOfferById);
router.put("/:id", validator({ body: updateOfferSchema }), updateOffer);
router.delete("/:id", deleteOffer);
export default router;
