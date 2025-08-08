import { ProductModel, ProductCategoryModel } from "../modules/product/";
import { UserModel } from "../modules/user/";
const userId = "687079ca427278c033a8d8ed";

export async function SEED() {
  const data = getData().map((d) => ({
    ...d,
    createdById: userId,
  }));
  return data;
}

function getData() {
return  [
  // Fashion Product (Configurable, Updated)
  {
    "name": "Women's Leather Jacket",
    "description": "A premium women's leather jacket with a modern cut. Crafted from genuine leather, available in multiple colors.",
    "slug": "womens-leather-jacket",
    "sku": "FASH-LJ001",
    "price": 129.99,
    "currency": "USD",
    "discountPercentage": 20,
    "discountStartDate": "2025-08-15T00:00:00Z",
    "discountEndDate": "2025-08-30T23:59:59Z",
    "categoryId": "6871963b88f85abf69880317",
    "brand": "TrendyWear",
    "tags": ["leather", "jacket", "womens", "fashion"],
    "images": [
      { "url": "https://plus.unsplash.com/premium_photo-1698749256809-291e42c2e7a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDJ8fHxlbnwwfHx8fHw%3D", "alt": "Black leather jacket view" },
      { "url": "https://images.unsplash.com/photo-1551488831-68b0e82a5e8f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", "alt": "Brown leather jacket view" }
    ],
    "thumbnail": { "url": "https://plus.unsplash.com/premium_photo-1698749344903-2639d1cc31a1?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1pbi1zYW1lLXNlcmllc3w0fHx8ZW58MHx8fHx8", "alt": "Leather jacket thumbnail" },
    "type": "configurable",
    "status": "active",
    "visibility": "public",
    "condition": "new",
    "featured": true,
    "stockQuantity": 0,
    "variants": [
      {
        "sku": "FASH-LJ001-BLK",
        "name": "Black",
        "price": 129.99,
        "currency": "USD",
        "discountPrice": 103.99,
        "attributes": { "color": "Black" },
        "stockQuantity": 40,
        "images": [
          { "url": "https://plus.unsplash.com/premium_photo-1698749256809-291e42c2e7a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDJ8fHxlbnwwfHx8fHw%3D", "alt": "Black leather jacket" }
        ],
        "thumbnail": { "url": "https://plus.unsplash.com/premium_photo-1698749344903-2639d1cc31a1?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1pbi1zYW1lLXNlcmllc3w0fHx8ZW58MHx8fHx8", "alt": "Black leather jacket thumbnail" },
        "weight": 1.2,
        "weightUnit": "kg"
      },
      {
        "sku": "FASH-LJ001-BRN",
        "name": "Brown",
        "price": 129.99,
        "currency": "USD",
        "attributes": { "color": "Brown" },
        "stockQuantity": 30,
        "images": [
          { "url": "https://images.unsplash.com/photo-1551488831-68b0e82a5e8f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", "alt": "Brown leather jacket" }
        ],
        "thumbnail": { "url": "https://images.unsplash.com/photo-1551488831-68b0e82a5e8f?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", "alt": "Brown leather jacket thumbnail" },
        "weight": 1.2,
        "weightUnit": "kg"
      }
    ],
    "seo": {
      "title": "Women's Leather Jacket",
      "description": "Shop stylish women's leather jackets in black and brown.",
      "keywords": ["leather jacket", "womens", "fashion"]
    },
    "createdById": "user123"
  },
  // Anime Product (Configurable, Updated)
  {
    "name": "My Hero Academia Hoodie",
    "description": "A comfortable hoodie featuring characters from My Hero Academia. Available in multiple sizes and designs.",
    "slug": "my-hero-academia-hoodie",
    "sku": "ANIM-HD001",
    "price": 39.99,
    "currency": "USD",
    "categoryId": "6871963b88f85abf69880315",
    "brand": "AnimeWear",
    "tags": ["hoodie", "my-hero-academia", "anime", "apparel"],
    "images": [
      { "url": "https://m.media-amazon.com/images/I/71kvw4raIVL._AC_SX569_.jpg", "alt": "Deku hoodie view" },
      { "url": "https://m.media-amazon.com/images/I/61ozqFPuCwL._AC_SX569_.jpg", "alt": "Bakugo hoodie view" }
    ],
    "thumbnail": { "url": "https://m.media-amazon.com/images/I/61ycq-a1AtL._AC_SX569_.jpg", "alt": "My Hero Academia hoodie thumbnail" },
    "type": "configurable",
    "status": "active",
    "visibility": "public",
    "condition": "new",
    "featured": true,
    "stockQuantity": 0,
    "variants": [
      {
        "sku": "ANIM-HD001-S-DEKU",
        "name": "Small - Deku",
        "price": 39.99,
        "currency": "USD",
        "attributes": { "size": "Small", "design": "Deku" },
        "stockQuantity": 50,
        "images": [
          { "url": "https://m.media-amazon.com/images/I/71kvw4raIVL._AC_SX569_.jpg", "alt": "Deku hoodie" }
        ],
        "thumbnail": { "url": "https://m.media-amazon.com/images/I/71kvw4raIVL._AC_SX569_.jpg", "alt": "Deku hoodie thumbnail" },
        "weight": 0.5,
        "weightUnit": "kg"
      },
      {
        "sku": "ANIM-HD001-M-BAKU",
        "name": "Medium - Bakugo",
        "price": 39.99,
        "currency": "USD",
        "attributes": { "size": "Medium", "design": "Bakugo" },
        "stockQuantity": 40,
        "images": [
          { "url": "https://m.media-amazon.com/images/I/61ozqFPuCwL._AC_SX569_.jpg", "alt": "Bakugo hoodie" }
        ],
        "thumbnail": { "url": "https://m.media-amazon.com/images/I/61ozqFPuCwL._AC_SX569_.jpg", "alt": "Bakugo hoodie thumbnail" },
        "weight": 0.5,
        "weightUnit": "kg"
      }
    ],
    "createdById": "user123"
  },
  // Electronics Product (Simple)
  {
    "name": "Wireless Earbuds",
    "description": "Compact wireless earbuds with noise cancellation and 24-hour battery life. Includes a charging case.",
    "slug": "wireless-earbuds",
    "sku": "ELEC-EB001",
    "price": 79.99,
    "currency": "USD",
    "categoryId": "6871963b88f85abf69880319",
    "brand": "TechTrend",
    "tags": ["earbuds", "wireless", "electronics", "audio"],
    "images": [
      { "url": "https://m.media-amazon.com/images/I/71fS-+D89YL._AC_SX569_.jpg", "alt": "Wireless earbuds view" }
    ],
    "thumbnail": { "url": "https://m.media-amazon.com/images/I/71fS-+D89YL._AC_SX200_.jpg", "alt": "Wireless earbuds thumbnail" },
    "type": "simple",
    "status": "active",
    "visibility": "public",
    "condition": "new",
    "featured": false,
    "stockQuantity": 200,
    "weight": 0.1,
    "weightUnit": "kg",
    "dimensions": { "length": 6, "width": 4, "height": 3, "unit": "cm" },
    "seo": {
      "title": "Wireless Earbuds",
      "description": "Shop compact wireless earbuds with noise cancellation.",
      "keywords": ["earbuds", "wireless", "audio"]
    },
    "createdById": "user123"
  },
  // Home and Living Product (Simple)
  {
    "name": "Cotton Throw Blanket",
    "description": "A soft cotton throw blanket, perfect for cozy evenings. Machine washable and available in a neutral taupe color.",
    "slug": "cotton-throw-blanket",
    "sku": "HOME-TB001",
    "price": 34.99,
    "currency": "USD",
    "categoryId": "6871963b88f85abf6988031b",
    "brand": "CozyHome",
    "tags": ["blanket", "home-decor", "cotton", "cozy"],
    "images": [
      { "url": "https://images.unsplash.com/photo-1515634927130-7b7f770e2db1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", "alt": "Cotton throw blanket view" }
    ],
    "thumbnail": { "url": "https://images.unsplash.com/photo-1515634927130-7b7f770e2db1?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", "alt": "Cotton throw blanket thumbnail" },
    "type": "simple",
    "status": "active",
    "visibility": "public",
    "condition": "new",
    "featured": false,
    "stockQuantity": 150,
    "weight": 0.8,
    "weightUnit": "kg",
    "dimensions": { "length": 150, "width": 130, "height": 1, "unit": "cm" },
    "createdById": "user123"
  },
  // Anime Product (Configurable)
  {
    "name": "Naruto T-Shirt",
    "description": "A stylish Naruto-themed t-shirt featuring iconic characters. Available in multiple sizes and designs.",
    "slug": "naruto-t-shirt",
    "sku": "ANIM-TS001",
    "price": 24.99,
    "currency": "USD",
    "categoryId": "6871963b88f85abf69880315",
    "brand": "AnimeWear",
    "tags": ["t-shirt", "naruto", "anime", "apparel"],
    "images": [
      { "url": "https://m.media-amazon.com/images/I/61q3+-oI1ML._AC_SX569_.jpg", "alt": "Naruto t-shirt view" },
      { "url": "https://m.media-amazon.com/images/I/61-+Y0sRYwL._AC_SX569_.jpg", "alt": "Sasuke t-shirt view" }
    ],
    "thumbnail": { "url": "https://m.media-amazon.com/images/I/61q3+-oI1ML._AC_SX200_.jpg", "alt": "Naruto t-shirt thumbnail" },
    "type": "configurable",
    "status": "active",
    "visibility": "public",
    "condition": "new",
    "featured": true,
    "stockQuantity": 0,
    "variants": [
      {
        "sku": "ANIM-TS001-M-NAR",
        "name": "Medium - Naruto",
        "price": 24.99,
        "currency": "USD",
        "attributes": { "size": "Medium", "design": "Naruto" },
        "stockQuantity": 60,
        "images": [
          { "url": "https://m.media-amazon.com/images/I/61q3+-oI1ML._AC_SX569_.jpg", "alt": "Naruto t-shirt" }
        ],
        "thumbnail": { "url": "https://m.media-amazon.com/images/I/61q3+-oI1ML._AC_SX200_.jpg", "alt": "Naruto t-shirt thumbnail" },
        "weight": 0.2,
        "weightUnit": "kg"
      },
      {
        "sku": "ANIM-TS001-L-SAS",
        "name": "Large - Sasuke",
        "price": 24.99,
        "currency": "USD",
        "attributes": { "size": "Large", "design": "Sasuke" },
        "stockQuantity": 50,
        "images": [
          { "url": "https://m.media-amazon.com/images/I/61-+Y0sRYwL._AC_SX569_.jpg", "alt": "Sasuke t-shirt" }
        ],
        "thumbnail": { "url": "https://m.media-amazon.com/images/I/61-+Y0sRYwL._AC_SX200_.jpg", "alt": "Sasuke t-shirt thumbnail" },
        "weight": 0.2,
        "weightUnit": "kg"
      }
    ],
    "createdById": "user123"
  },
  // Electronics Product (Configurable)
  {
    "name": "Smartwatch",
    "description": "A sleek smartwatch with heart rate monitoring, GPS, and water resistance. Available in different strap colors.",
    "slug": "smartwatch",
    "sku": "ELEC-SW001",
    "price": 149.99,
    "currency": "USD",
    "categoryId": "6871963b88f85abf69880319",
    "brand": "TechTrend",
    "tags": ["smartwatch", "wearable", "electronics", "fitness"],
    "images": [
      { "url": "https://m.media-amazon.com/images/I/61ZjlBOp8nL._AC_SX569_.jpg", "alt": "Black smartwatch view" },
      { "url": "https://m.media-amazon.com/images/I/61r3FzR0f3L._AC_SX569_.jpg", "alt": "Blue smartwatch view" }
    ],
    "thumbnail": { "url": "https://m.media-amazon.com/images/I/61ZjlBOp8nL._AC_SX200_.jpg", "alt": "Smartwatch thumbnail" },
    "type": "configurable",
    "status": "active",
    "visibility": "public",
    "condition": "new",
    "featured": true,
    "stockQuantity": 0,
    "variants": [
      {
        "sku": "ELEC-SW001-BLK",
        "name": "Black Strap",
        "price": 149.99,
        "currency": "USD",
        "attributes": { "strap_color": "Black" },
        "stockQuantity": 70,
        "images": [
          { "url": "https://m.media-amazon.com/images/I/61ZjlBOp8nL._AC_SX569_.jpg", "alt": "Black smartwatch" }
        ],
        "thumbnail": { "url": "https://m.media-amazon.com/images/I/61ZjlBOp8nL._AC_SX200_.jpg", "alt": "Black smartwatch thumbnail" },
        "weight": 0.05,
        "weightUnit": "kg",
        "dimensions": { "length": 4, "width": 4, "height": 1, "unit": "cm" }
      },
      {
        "sku": "ELEC-SW001-BLU",
        "name": "Blue Strap",
        "price": 149.99,
        "currency": "USD",
        "attributes": { "strap_color": "Blue" },
        "stockQuantity": 60,
        "images": [
          { "url": "https://m.media-amazon.com/images/I/61r3FzR0f3L._AC_SX569_.jpg", "alt": "Blue smartwatch" }
        ],
        "thumbnail": { "url": "https://m.media-amazon.com/images/I/61r3FzR0f3L._AC_SX200_.jpg", "alt": "Blue smartwatch thumbnail" },
        "weight": 0.05,
        "weightUnit": "kg",
        "dimensions": { "length": 4, "width": 4, "height": 1, "unit": "cm" }
      }
    ],
    "seo": {
      "title": "Smartwatch with GPS",
      "description": "Shop smartwatches with heart rate monitoring and GPS.",
      "keywords": ["smartwatch", "fitness", "wearable"]
    },
    "createdById": "user123"
  }
]
}
