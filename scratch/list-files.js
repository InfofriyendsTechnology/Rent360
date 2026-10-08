const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: "pbnqazpy",
  api_key: "636433964381783",
  api_secret: "zgkcxd4_xqwEiH6c4Oq1HwSZJqo",
});

async function run() {
  try {
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'rent360',
      max_results: 500,
    });
    
    console.log("Files found:", resources.resources.length);
    resources.resources.forEach(r => {
      console.log(`- ${r.public_id} (${r.bytes} bytes)`);
    });
  } catch (e) {
    console.error(e);
  }
}

run();
