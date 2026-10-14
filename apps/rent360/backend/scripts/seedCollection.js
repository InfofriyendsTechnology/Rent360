const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCollection() {
  console.log("Starting Collection Seeding (Categories, Products & Items)...");

  // Fetch all stores
  const stores = await prisma.store.findMany();
  if (stores.length === 0) {
    console.log("No stores found in DB. Run basic store seed first.");
    return;
  }

  for (const store of stores) {
    console.log(`\nSeeding for Store: ${store.name} (${store.id})`);

    // 1. Seed Categories
    const categoriesData = [
      {
        name: "Sherwani",
        category_code: "SHERWANI",
        description: "Groom, Royal Silk, Velvet & Hand-Embroidered Wedding Sherwanis"
      },
      {
        name: "Jodhpuri (Chotpur)",
        category_code: "JODHPURI",
        description: "Classic Royal Jodhpuri Suits, Bandhgala, Italian Wool & Silk Jodhpuri"
      },
      {
        name: "Indo-Western",
        category_code: "INDO_WESTERN",
        description: "Asymmetric Cuts, Designer Cowl Kurtas, Fusion Jackets"
      },
      {
        name: "Tuxedo & Blazers",
        category_code: "TUXEDO",
        description: "Black-Tie Tuxedos, Shawl Lapel, 3-Piece Party Suits"
      },
      {
        name: "Kurta Pajama & Koti",
        category_code: "KURTA_PAJAMA",
        description: "Sangeet & Haldi Kurtas, Floral Printed Koti & Nehru Jackets"
      }
    ];

    const categoryMap = {};

    for (const cat of categoriesData) {
      let existingCat = await prisma.category.findFirst({
        where: {
          storeId: store.id,
          OR: [
            { category_code: cat.category_code },
            { name: cat.name }
          ]
        }
      });

      if (!existingCat) {
        existingCat = await prisma.category.create({
          data: {
            storeId: store.id,
            name: cat.name,
            category_code: cat.category_code,
            description: cat.description
          }
        });
        console.log(`  + Created Category: ${cat.name}`);
      } else {
        console.log(`  = Existing Category: ${cat.name}`);
      }

      categoryMap[cat.category_code] = existingCat;
    }

    // 2. Sample Products & Items (Record-wise & Item-wise)
    const productsData = [
      // SHERWANI
      {
        category_code: "SHERWANI",
        product_code: "SHW-001",
        name: "Imperial Velvet Hand-Embroidered Sherwani",
        base_rent_price: 3500,
        base_security_deposit: 7000,
        image_urls: [
          "https://res.cloudinary.com/pbnqazpy/image/upload/v1728800000/rent360/sample_sherwani_1.jpg",
          "https://res.cloudinary.com/pbnqazpy/image/upload/v1728800000/rent360/sample_sherwani_2.jpg"
        ],
        items: [
          { size: "38 (M)", color: "Maroon & Antique Gold", sku_code: "SHW-001-38-MRN", condition_notes: "Brand new showroom condition" },
          { size: "40 (L)", color: "Maroon & Antique Gold", sku_code: "SHW-001-40-MRN", condition_notes: "Dry-cleaned, perfect embroidery" },
          { size: "42 (XL)", color: "Maroon & Antique Gold", sku_code: "SHW-001-42-MRN", condition_notes: "Crisp velvet fabric" }
        ]
      },
      {
        category_code: "SHERWANI",
        product_code: "SHW-002",
        name: "Raw Silk Pearl Cream Royal Sherwani",
        base_rent_price: 2800,
        base_security_deposit: 5000,
        image_urls: [
          "https://res.cloudinary.com/pbnqazpy/image/upload/v1728800000/rent360/sample_sherwani_cream.jpg"
        ],
        items: [
          { size: "38 (M)", color: "Pearl Cream", sku_code: "SHW-002-38-CRM", condition_notes: "Includes matching stole" },
          { size: "40 (L)", color: "Pearl Cream", sku_code: "SHW-002-40-CRM", condition_notes: "Includes matching safa" }
        ]
      },

      // JODHPURI (CHOTPUR)
      {
        category_code: "JODHPURI",
        product_code: "JDP-001",
        name: "Classic Midnight Blue Jodhpuri Bandhgala",
        base_rent_price: 2200,
        base_security_deposit: 4500,
        image_urls: [
          "https://res.cloudinary.com/pbnqazpy/image/upload/v1728800000/rent360/sample_jodhpuri_navy.jpg"
        ],
        items: [
          { size: "38 (M)", color: "Midnight Blue", sku_code: "JDP-001-38-NVY", condition_notes: "Polished brass buttons" },
          { size: "40 (L)", color: "Midnight Blue", sku_code: "JDP-001-40-NVY", condition_notes: "Tailored slim fit" },
          { size: "42 (XL)", color: "Midnight Blue", sku_code: "JDP-001-42-NVY", condition_notes: "Includes breeches/trousers" }
        ]
      },
      {
        category_code: "JODHPURI",
        product_code: "JDP-002",
        name: "Italian Wool Royal Black Jodhpuri Suit",
        base_rent_price: 2400,
        base_security_deposit: 5000,
        image_urls: [
          "https://res.cloudinary.com/pbnqazpy/image/upload/v1728800000/rent360/sample_jodhpuri_black.jpg"
        ],
        items: [
          { size: "38 (M)", color: "Jet Black", sku_code: "JDP-002-38-BLK", condition_notes: "Fine Italian wool finish" },
          { size: "40 (L)", color: "Jet Black", sku_code: "JDP-002-40-BLK", condition_notes: "Signature Mandarin collar" }
        ]
      },

      // INDO-WESTERN
      {
        category_code: "INDO_WESTERN",
        product_code: "IND-001",
        name: "Asymmetric Cut Emerald Green Indo-Western",
        base_rent_price: 1900,
        base_security_deposit: 3800,
        image_urls: [
          "https://res.cloudinary.com/pbnqazpy/image/upload/v1728800000/rent360/sample_indo_green.jpg"
        ],
        items: [
          { size: "38 (M)", color: "Emerald & Cream", sku_code: "IND-001-38-EMR", condition_notes: "Modern sangeet wear" },
          { size: "40 (L)", color: "Emerald & Cream", sku_code: "IND-001-40-EMR", condition_notes: "Includes cowl dhoti pant" }
        ]
      }
    ];

    for (const prd of productsData) {
      const category = categoryMap[prd.category_code];
      if (!category) continue;

      let product = await prisma.product.findFirst({
        where: {
          storeId: store.id,
          product_code: prd.product_code
        }
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            storeId: store.id,
            categoryId: category.id,
            product_code: prd.product_code,
            name: prd.name,
            base_rent_price: prd.base_rent_price,
            base_security_deposit: prd.base_security_deposit,
            image_urls: prd.image_urls
          }
        });
        console.log(`    * Created Product (Record): ${prd.name} [${prd.product_code}]`);
      } else {
        console.log(`    = Existing Product (Record): ${prd.name} [${prd.product_code}]`);
      }

      // Seed physical ProductItems
      for (const item of prd.items) {
        const existingItem = await prisma.productItem.findUnique({
          where: { sku_code: item.sku_code }
        });

        if (!existingItem) {
          await prisma.productItem.create({
            data: {
              storeId: store.id,
              productId: product.id,
              sku_code: item.sku_code,
              size: item.size,
              color: item.color,
              status: "AVAILABLE",
              condition_notes: item.condition_notes
            }
          });
          console.log(`      - Added Physical Item: SKU ${item.sku_code} (${item.size})`);
        }
      }
    }
  }

  console.log("\nCollection Seeding successfully completed!");
}

seedCollection()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
