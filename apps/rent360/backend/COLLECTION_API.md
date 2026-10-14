# Rent360 Collection API & Inventory Architecture

This document outlines the full-stack architecture, database models, and API specifications for the **Rent360 Collection & Inventory System**.

---

## 1. Core Model Architecture: Record-wise vs. Item-wise

Wedding and festive apparel rental operations (like **Sherwani**, **Jodhpuri / Chotpur suits**, **Indo-Western**) require a specialized **two-tier product architecture**:

```
Store (e.g., Virasat Fashion Studio)
  │
  └── Category (e.g., Jodhpuri, Sherwani, Indo-Western, Tuxedo)
        │
        └── Product [RECORD-WISE / DESIGN LEVEL]
              ├── Name: "Imperial Velvet Hand-Embroidered Sherwani"
              ├── Product Code: "SHW-001"
              ├── Base Rent: ₹3,500
              ├── Base Deposit: ₹7,000
              ├── Cloudinary Image Gallery: ["url1", "url2", "url3"]
              │
              └── ProductItem [ITEM-WISE / PHYSICAL INVENTORY PIECE]
                    ├── SKU: SHW-001-38-MRN | Size: 38 (M)  | Color: Maroon | Status: AVAILABLE
                    ├── SKU: SHW-001-40-MRN | Size: 40 (L)  | Color: Maroon | Status: AVAILABLE
                    └── SKU: SHW-001-42-MRN | Size: 42 (XL) | Color: Maroon | Status: BOOKED
```

### Why This Separation is Essential:
1. **Record-wise (Design Level):** Customers browse designs, photos, rent rates, and style descriptions. One design is photographed once with multiple angle shots.
2. **Item-wise (Physical Piece Level):** The store holds multiple physical pieces of that design in different chest sizes (36, 38, 40, 42, 44), colors, and condition notes.
3. **Availability & Calendar Blocking:** When a customer books a Sherwani for a wedding date, only the specific physical piece (`ProductItem` SKU `SHW-001-40-MRN`) is blocked on that date range, while size 38 and 42 remain freely available for other customers!

---

## 2. Categories

Rent360 comes pre-seeded with standardized wedding and ethnic rental categories:

| Category Code | Display Name | Description |
|---|---|---|
| `SHERWANI` | Sherwani | Groom, Royal Silk, Velvet & Hand-Embroidered Wedding Sherwanis |
| `JODHPURI` | Jodhpuri (Chotpur) | Classic Royal Jodhpuri Suits, Bandhgala, Italian Wool & Silk |
| `INDO_WESTERN` | Indo-Western | Asymmetric Cuts, Designer Cowl Kurtas, Fusion Jackets |
| `TUXEDO` | Tuxedo & Blazers | Black-Tie Tuxedos, Shawl Lapel, 3-Piece Party Suits |
| `KURTA_PAJAMA` | Kurta Pajama & Koti | Sangeet & Haldi Kurtas, Floral Printed Koti & Nehru Jackets |

---

## 3. Image Upload Engine (Cloudinary)

The collection API supports both **single image** and **multiple image uploads**:

- **Accepted formats:** Base64 Data URI (`data:image/jpeg;base64,...`) or hosted image URLs.
- **Storage path in Cloudinary:**
  `rent360/stores/{storeSlug}/products/{productCode}_{timestamp}_{index}`
- **Features:**
  - Automatic folder creation per store.
  - Generates optimized web-delivery URLs.
  - Image cleanup when products are updated or deleted.
  - Allows mixed payload (e.g. keep 2 existing URLs and upload 1 new base64 image).

---

## 4. Subscription Plan Limit Enforcement

Store capacity is governed by the store's active **Subscription Plan**:

| Plan Tier | Collection Items Limit | Max Staff | Bookings |
|---|---|---|---|
| **STARTER** | Up to **100** Items | 2 Staff | Unlimited |
| **GROWTH** | Up to **500** Items | 10 Staff | Unlimited |
| **ENTERPRISE** | **Unlimited** Items | Unlimited | Unlimited |

- Before creating new items (`POST /api/products` with nested items, or `POST /api/productItems`), the backend verifies the current physical inventory count via `checkStoreCollectionLimit(storeId)`.
- If the store has reached capacity, the API rejects with HTTP 400 and prompts an upgrade to Growth or Enterprise.

---

## 5. API Reference

All collection routes require JWT Authentication (`Authorization: Bearer <token>`).

### A. Categories API (`/api/categories`)

#### 1. List Categories
- **Endpoint:** `GET /api/categories`
- **Query Params:** `storeId` (optional for SUPER_ADMIN), `search` (filter by name/code)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Categories fetched successfully",
    "data": [
      {
        "id": "bdf6b608-de7f-460e-b844-e0ca1ba7a067",
        "storeId": "3d69efd7-be84-42cd-aa8c-9f2f65fa6484",
        "category_code": "SHERWANI",
        "name": "Sherwani",
        "description": "Groom, Royal Silk, Velvet & Hand-Embroidered Wedding Sherwanis",
        "_count": { "products": 2 }
      }
    ]
  }
  ```

#### 2. Create Category
- **Endpoint:** `POST /api/categories`
- **Payload:**
  ```json
  {
    "name": "Jodhpuri (Chotpur)",
    "category_code": "JODHPURI",
    "description": "Classic Bandhgala Suits"
  }
  ```

#### 3. Update Category
- **Endpoint:** `PUT /api/categories/:id`
- **Payload:** `{ "name": "Royal Jodhpuri", "description": "Updated description" }`

#### 4. Delete Category
- **Endpoint:** `DELETE /api/categories/:id`
- **Safety Guard:** Prevented if products are linked to the category.

---

### B. Products API (`/api/products`) [Record-wise / Design Level]

#### 1. List Products
- **Endpoint:** `GET /api/products`
- **Query Params:** `categoryId`, `storeId`, `search`, `minRent`, `maxRent`, `status`
- **Response:** Returns list of product designs with nested category and physical items.

#### 2. Create Product (with Multiple Images & Nested Items)
- **Endpoint:** `POST /api/products`
- **Payload:**
  ```json
  {
    "categoryId": "bdf6b608-de7f-460e-b844-e0ca1ba7a067",
    "name": "Imperial Velvet Hand-Embroidered Sherwani",
    "product_code": "SHW-001",
    "base_rent_price": 3500,
    "base_security_deposit": 7000,
    "images": [
      "data:image/jpeg;base64,...",
      "https://res.cloudinary.com/.../img2.jpg"
    ],
    "items": [
      { "size": "38 (M)", "color": "Maroon & Gold", "condition_notes": "Showroom piece" },
      { "size": "40 (L)", "color": "Maroon & Gold", "condition_notes": "Dry-cleaned" }
    ]
  }
  ```

#### 3. Update Product
- **Endpoint:** `PUT /api/products/:id`
- **Payload:**
  ```json
  {
    "name": "Imperial Velvet Hand-Embroidered Sherwani (Updated)",
    "base_rent_price": 3800,
    "base_security_deposit": 7500,
    "images": ["url1", "data:image/jpeg;base64,..."]
  }
  ```

#### 4. Delete Product
- **Endpoint:** `DELETE /api/products/:id`
- **Safety Guard:** Verifies no items of this design are currently in active (`UPCOMING` or `PICKED_UP`) bookings. Cleans up Cloudinary assets upon deletion.

---

### C. ProductItems API (`/api/productItems`) [Item-wise / Physical Piece Level]

#### 1. List Physical Items
- **Endpoint:** `GET /api/productItems`
- **Query Params:** `productId`, `storeId`, `status`, `size`, `color`, `search`
- **Status values:** `AVAILABLE`, `BOOKED`, `PICKED_UP`, `LAUNDRY`, `DAMAGED`

#### 2. Create Physical Item (Add Size/Color to Design)
- **Endpoint:** `POST /api/productItems`
- **Payload:**
  ```json
  {
    "productId": "76fc7774-de92-4063-97f2-a85b067a4c34",
    "size": "42 (XL)",
    "color": "Maroon & Gold",
    "sku_code": "SHW-001-42-MRN",
    "condition_notes": "New stock added"
  }
  ```

#### 3. Update Physical Item
- **Endpoint:** `PUT /api/productItems/:id`
- **Payload:** `{ "status": "LAUNDRY", "condition_notes": "Sent for dry-cleaning after wedding return" }`

#### 4. Delete Physical Item
- **Endpoint:** `DELETE /api/productItems/:id`
- **Safety Guard:** Prevented if the item is currently assigned to an active booking.
