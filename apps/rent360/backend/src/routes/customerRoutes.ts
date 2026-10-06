import { Router } from "express";
import {
  getAllCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validations/customer.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllCustomers);
router.post("/", validator({ body: createCustomerSchema }), createCustomer);
router.get("/:id", getCustomerById);
router.put("/:id", validator({ body: updateCustomerSchema }), updateCustomer);
router.delete("/:id", deleteCustomer);
export default router;
