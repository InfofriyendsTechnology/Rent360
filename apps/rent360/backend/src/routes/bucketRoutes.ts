import { Router } from "express";
import { getBucketStats, getBucketFolders, getBucketFiles, deleteBucketFile } from "../controllers/bucketController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/stats", getBucketStats);
router.get("/folders", getBucketFolders);
router.get("/files", getBucketFiles);
router.delete("/files", deleteBucketFile);

export default router;
