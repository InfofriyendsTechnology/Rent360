import { Router } from "express";
import {
  getAllStores,
  createStore,
  getStoreById,
  updateStore,
  deleteStore,
  setStoreAdminPassword,
} from "../controllers/storeController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createStoreSchema,
  updateStoreSchema,
} from "../validations/store.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllStores);
router.post("/", validator({ body: createStoreSchema }), createStore);
router.get("/:id", getStoreById);
router.put("/:id", validator({ body: updateStoreSchema }), updateStore);
router.put("/:id/password", setStoreAdminPassword);
router.delete("/:id", deleteStore);
export default router;
