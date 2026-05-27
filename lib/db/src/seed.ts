import { db } from "./index";
import { usersTable, categoriesTable, productsTable, addressesTable, couponsTable } from "./schema";
import { eq } from "drizzle-orm";
// @ts-ignore
import bcrypt from "bcrypt";

async function seed() {
  console.log("Starting database seed...");

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const vendorPassword = await bcrypt.hash("vendor123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  // Insert users
  console.log("Inserting users...");
  await db.insert(usersTable).values([
    {
      name: "Admin User",
      email: "admin@yelements.com",
      password: adminPassword,
      role: "admin",
      referralCode: "ADMIN-2026",
      rewardPoints: 0,
    },
    {
      name: "Vendor User",
      email: "vendor@yelements.com",
      password: vendorPassword,
      role: "vendor",
      referralCode: "VENDOR-2026",
      rewardPoints: 0,
    },
    {
      name: "Regular User",
      email: "user@yelements.com",
      password: userPassword,
      role: "user",
      referralCode: "USER-2026",
      rewardPoints: 100,
    },
  ]);

  // Insert categories
  console.log("Inserting categories...");
  await db.insert(categoriesTable).values([
    {
      name: "Stationery",
      slug: "stationery",
      description: "Office and school stationery supplies",
      icon: "📝",
      subcategories: ["Pens", "Notebooks", "Files", "Calculators", "Art Supplies"],
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Medical",
      slug: "medical",
      description: "Medical and healthcare supplies",
      icon: "🏥",
      subcategories: ["First Aid", "Diagnostic", "Surgical", "Patient Care"],
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "Laboratory",
      slug: "laboratory",
      description: "Laboratory equipment and chemicals",
      icon: "🔬",
      subcategories: ["Glassware", "Chemicals", "Instruments", "Safety"],
      isActive: true,
      sortOrder: 3,
    },
    {
      name: "Surgical",
      slug: "surgical",
      description: "Surgical instruments and supplies",
      icon: "🩺",
      subcategories: ["Instruments", "Disposables", "Sterilization"],
      isActive: true,
      sortOrder: 4,
    },
    {
      name: "Canteen",
      slug: "canteen",
      description: "Food and beverage supplies",
      icon: "🍽️",
      subcategories: ["Beverages", "Snacks", "Crockery", "Cutlery"],
      isActive: true,
      sortOrder: 5,
    },
    {
      name: "Housekeeping",
      slug: "housekeeping",
      description: "Cleaning and maintenance supplies",
      icon: "🧹",
      subcategories: ["Cleaning", "Laundry", "Waste Management"],
      isActive: true,
      sortOrder: 6,
    },
    {
      name: "Miscellaneous",
      slug: "miscellaneous",
      description: "Other institutional supplies",
      icon: "📦",
      subcategories: ["Electronics", "Furniture", "Safety"],
      isActive: true,
      sortOrder: 7,
    },
  ]);

  // Get category IDs
  const categories = await db.select().from(categoriesTable);
  const stationeryCategory = categories.find(c => c.slug === "stationery");
  const medicalCategory = categories.find(c => c.slug === "medical");
  const laboratoryCategory = categories.find(c => c.slug === "laboratory");

  // Get vendor ID
  const vendor = await db.select().from(usersTable).where(eq(usersTable.email, "vendor@yelements.com"));

  // Insert products
  console.log("Inserting products...");
  await db.insert(productsTable).values(
    [
      {
        name: "A4 Size Notebook - 200 Pages",
        price: "45",
        originalPrice: "55",
        description: "Premium quality A4 size notebook with 200 ruled pages. Perfect for office and school use.",
        categoryId: stationeryCategory!.id,
        subcategory: "Notebooks",
        imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
        images: ["https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400"],
        stock: 500,
        vendorId: vendor[0].id,
        isFeatured: true,
        discount: "18",
        pointsReward: 5,
        sku: "NB-A4-200",
        tags: ["stationery", "notebook", "office"],
      },
      {
        name: "Ballpoint Pens - Pack of 10",
        price: "120",
        originalPrice: "150",
        description: "Smooth writing ballpoint pens, pack of 10 assorted colors. Long-lasting ink.",
        categoryId: stationeryCategory!.id,
        subcategory: "Pens",
        imageUrl: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400",
        images: ["https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400"],
        stock: 1000,
        vendorId: vendor[0].id,
        isFeatured: true,
        discount: "20",
        pointsReward: 10,
        sku: "PN-BP-10",
        tags: ["stationery", "pens", "office"],
      },
      {
        name: "Digital Thermometer",
        price: "350",
        originalPrice: "450",
        description: "Medical grade digital thermometer with fast reading and fever alert.",
        categoryId: medicalCategory!.id,
        subcategory: "Diagnostic",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
        images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400"],
        stock: 200,
        vendorId: vendor[0].id,
        isFeatured: true,
        discount: "22",
        pointsReward: 20,
        sku: "TH-DIG-01",
        tags: ["medical", "thermometer", "diagnostic"],
      },
      {
        name: "Beaker Set - 5 Pieces",
        price: "850",
        originalPrice: "1000",
        description: "Laboratory grade borosilicate glass beakers, set of 5 different sizes.",
        categoryId: laboratoryCategory!.id,
        subcategory: "Glassware",
        imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
        images: ["https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400"],
        stock: 150,
        vendorId: vendor[0].id,
        isFeatured: false,
        discount: "15",
        pointsReward: 30,
        sku: "BK-GLS-5",
        tags: ["laboratory", "glassware", "beaker"],
      },
      {
        name: "Surgical Scissors - 6 inch",
        price: "280",
        originalPrice: "350",
        description: "Stainless steel surgical scissors, 6 inch, sharp and durable.",
        categoryId: categories.find(c => c.slug === "surgical")!.id,
        subcategory: "Instruments",
        imageUrl: "https://images.unsplash.com/photo-1583912267550-d974311a29c5?w=400",
        images: ["https://images.unsplash.com/photo-1583912267550-d974311a29c5?w=400"],
        stock: 300,
        vendorId: vendor[0].id,
        isFeatured: false,
        discount: "20",
        pointsReward: 15,
        sku: "SC-SS-6",
        tags: ["surgical", "scissors", "instruments"],
      },
      {
        name: "Tea Powder - 1kg",
        price: "450",
        originalPrice: "500",
        description: "Premium Assam tea powder, 1kg pack. Rich aroma and taste.",
        categoryId: categories.find(c => c.slug === "canteen")!.id,
        subcategory: "Beverages",
        imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
        images: ["https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400"],
        stock: 400,
        vendorId: vendor[0].id,
        isFeatured: true,
        discount: "10",
        pointsReward: 25,
        sku: "TP-ASM-1KG",
        tags: ["canteen", "tea", "beverages"],
      },
      {
        name: "All Purpose Cleaner - 5L",
        price: "320",
        originalPrice: "400",
        description: "Industrial strength all purpose cleaner, 5L can. Safe for all surfaces.",
        categoryId: categories.find(c => c.slug === "housekeeping")!.id,
        subcategory: "Cleaning",
        imageUrl: "https://images.unsplash.com/photo-1581578731117-104f2a4bd0dd?w=400",
        images: ["https://images.unsplash.com/photo-1581578731117-104f2a4bd0dd?w=400"],
        stock: 250,
        vendorId: vendor[0].id,
        isFeatured: true,
        discount: "20",
        pointsReward: 20,
        sku: "CL-APC-5L",
        tags: ["housekeeping", "cleaner", "cleaning"],
      },
      {
        name: "LED Desk Lamp",
        price: "1200",
        originalPrice: "1500",
        description: "Adjustable LED desk lamp with USB charging port. Energy efficient.",
        categoryId: categories.find(c => c.slug === "miscellaneous")!.id,
        subcategory: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
        images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"],
        stock: 100,
        vendorId: vendor[0].id,
        isFeatured: false,
        discount: "20",
        pointsReward: 50,
        sku: "EL-LED-DL",
        tags: ["electronics", "lamp", "lighting"],
      },
    ]
  );

  // Insert sample address for user
  console.log("Inserting sample address...");
  const user = await db.select().from(usersTable).where(eq(usersTable.email, "user@yelements.com"));
  await db.insert(addressesTable).values({
    userId: user[0].id,
    fullName: "Regular User",
    phone: "9876543210",
    addressLine1: "123 Main Street",
    addressLine2: "Apartment 4B",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    country: "India",
    isDefault: true,
  });

  // Insert sample coupons
  console.log("Inserting sample coupons...");
  await db.insert(couponsTable).values(
    [
      {
        code: "WELCOME10",
        type: "percentage",
        value: "10",
        minOrderValue: "500",
        maxDiscount: "100",
        usageLimit: 100,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        code: "FLAT50",
        type: "flat",
        value: "50",
        minOrderValue: "1000",
        maxDiscount: "50",
        usageLimit: 50,
        isActive: true,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
    ]
  );

  console.log("Database seed completed successfully!");
  console.log("\n=== Login Credentials ===");
  console.log("Admin: admin@yelements.com / admin123");
  console.log("Vendor: vendor@yelements.com / vendor123");
  console.log("User: user@yelements.com / user123");
}

seed().catch(console.error);
