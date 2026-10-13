import app from "./app";
import { setupSuperAdmin } from "./utils/setupSuperAdmin";

const PORT = process.env.PORT || 61026;

app.listen(PORT, async () => {
  console.log(`Rent360 Backend is running on http://localhost:${PORT}`);
  try {
    await setupSuperAdmin();
  } catch (err) {
    console.error("Super Admin auto-setup warning:", err);
  }
});
