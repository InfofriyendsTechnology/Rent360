import { Router } from "express";
import {
  getAllAccessorys,
  createAccessory,
  getAccessoryById,
  updateAccessory,
  deleteAccessory,
} from "../controllers/accessoryController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createAccessorySchema,
  updateAccessorySchema,
} from "../validations/accessory.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllAccessorys);
router.post("/", validator({ body: createAccessorySchema }), createAccessory);
router.get("/:id", getAccessoryById);
router.put("/:id", validator({ body: updateAccessorySchema }), updateAccessory);
router.delete("/:id", deleteAccessory);
export default router;
