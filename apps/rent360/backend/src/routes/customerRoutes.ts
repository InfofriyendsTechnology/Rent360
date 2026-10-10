import { Router } from "express";
import {
  getAllCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import validator from "../utils/validators";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validations/customer.validation";

const router = Router();
router.use(authenticate);
router.use(authorize(["ALL", "CUSTOMERS_MANAGE"]));
router.get("/", getAllCustomers);
router.post("/", validator({ body: createCustomerSchema }), createCustomer);
router.get("/:id", getCustomerById);
router.put("/:id", validator({ body: updateCustomerSchema }), updateCustomer);
router.delete("/:id", deleteCustomer);
export default router;
