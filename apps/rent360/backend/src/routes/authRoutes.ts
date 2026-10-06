import { Router } from "express";
import { registerStore, login } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import { registerSchema, loginSchema } from "../validations/auth.validation";
import responseHandler from "../utils/responseHandler";

const router = Router();

// Public routes with Joi validation
router.post("/register", validator({ body: registerSchema }), registerStore);
router.post("/login", validator({ body: loginSchema }), login);

// Protected route (to test token)
router.get("/me", authenticate, (req: any, res) => {
  return responseHandler.success(res, "Token is valid", { user: req.user });
});

export default router;
