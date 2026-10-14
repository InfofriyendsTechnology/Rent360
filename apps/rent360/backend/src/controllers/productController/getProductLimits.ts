import { Response } from "express";
import responseHandler from "../../utils/responseHandler";
import { AuthRequest } from "../../middleware/auth";
import { checkStoreCollectionLimit } from "../../utils/planLimitsHelper";

export const getProductLimitsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let storeId = req.query.storeId as string;
    if (user?.role !== "SUPER_ADMIN" && user?.storeId) {
      storeId = user.storeId;
    }
    if (!storeId) {
      return responseHandler.badRequest(res, "Store ID is required");
    }

    const limits = await checkStoreCollectionLimit(storeId);
    return responseHandler.success(res, "Collection limits summary fetched", limits);
  } catch (error) {
    console.error("Error getting product limits summary:", error);
    return responseHandler.internalServerError(res, error);
  }
};
