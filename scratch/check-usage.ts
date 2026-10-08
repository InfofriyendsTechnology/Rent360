import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "pbnqazpy",
  api_key: "636433964381783",
  api_secret: "zgkcxd4_xqwEiH6c4Oq1HwSZJqo",
});

async function run() {
  const usage = await cloudinary.api.usage();
  console.log(JSON.stringify(usage, null, 2));
}

run();
