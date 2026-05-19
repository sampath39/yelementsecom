process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import "dotenv/config";
import { db } from "../lib/db/src";
import { usersTable } from "../lib/db/src/schema/users";
import { categoriesTable } from "../lib/db/src/schema/categories";
import { productsTable } from "../lib/db/src/schema/products";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding database with premium categories and products...");

  const adminPassword = await bcrypt.hash("admin123", 10);
  const vendorPassword = await bcrypt.hash("vendor123", 10);

  try {
    // 1. Seed Users
    const [adminUser] = await db.insert(usersTable).values([
      {
        email: "admin@example.com",
        password: adminPassword,
        name: "Admin User",
        role: "admin",
      }
    ]).onConflictDoNothing().returning();

    const [vendorUser] = await db.insert(usersTable).values([
      {
        email: "vendor@example.com",
        password: vendorPassword,
        name: "Vendor User",
        role: "vendor",
      }
    ]).onConflictDoNothing().returning();

    // Fetch existing users if not returned (due to onConflictDoNothing)
    const adminId = adminUser?.id || (await db.select().from(usersTable).where(eq(usersTable.email, "admin@example.com")))[0]?.id;
    const vendorId = vendorUser?.id || (await db.select().from(usersTable).where(eq(usersTable.email, "vendor@example.com")))[0]?.id;

    // 2. Seed Categories
    const categoriesData = [
      { name: "Stationery", slug: "stationery", description: "Premium academic and office supplies", subcategories: ["Notebooks", "Pens", "Organizers"] },
      { name: "Medical", slug: "medical", description: "Clinical diagnostics and care supplies", subcategories: ["Thermometers", "Stethoscopes", "Diagnostics"] },
      { name: "Laboratory", slug: "laboratory", description: "Scientific glassware and clinical tools", subcategories: ["Glassware", "Centrifuges", "Measuring"] },
      { name: "Surgical", slug: "surgical", description: "Sterile instruments and clinical tools", subcategories: ["Scissors", "Tweezers", "Disposables"] },
      { name: "Canteen", slug: "canteen", description: "Institutional culinary and snack supplies", subcategories: ["Beverages", "Snacks", "Condiments"] },
      { name: "Housekeeping", slug: "housekeeping", description: "Professional sanitization and cleaning supplies", subcategories: ["Disinfectants", "Soaps", "Detergents"] },
    ];

    const seededCategories = [];
    for (const cat of categoriesData) {
      const [seeded] = await db.insert(categoriesTable).values({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        subcategories: cat.subcategories,
      }).onConflictDoNothing().returning();

      if (seeded) {
        seededCategories.push(seeded);
      } else {
        const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, cat.slug));
        seededCategories.push(existing);
      }
    }

    const categoryMap = Object.fromEntries(seededCategories.map(c => [c.slug, c.id]));

    // 3. Seed Products
    const productsData = [
      // Laboratory
      {
        name: "Borosilicate 3.3 Glass Flask (500ml)",
        price: "450.00",
        originalPrice: "600.00",
        description: "Premium ISO 3819 standard borosilicate glassware with high chemical and thermal shock resistance.",
        categoryId: categoryMap["laboratory"],
        subcategory: "Glassware",
        imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop",
        stock: 120,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Benchtop Clinical Centrifuge (4000 RPM)",
        price: "12500.00",
        originalPrice: "16000.00",
        description: "High-stability clinical centrifuge with digital timing controls and brushless induction motor.",
        categoryId: categoryMap["laboratory"],
        subcategory: "Centrifuges",
        imageUrl: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?q=80&w=600&auto=format&fit=crop",
        stock: 15,
        vendorId,
        isFeatured: true,
      },
      // Medical
      {
        name: "Infrared Non-Contact Digital Thermometer",
        price: "1200.00",
        originalPrice: "1800.00",
        description: "Medical-grade infrared thermometer for instant, touchless body temperature readings with memory storage.",
        categoryId: categoryMap["medical"],
        subcategory: "Thermometers",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop",
        stock: 350,
        vendorId,
        isFeatured: true,
      },
      // Surgical
      {
        name: "Sterile Surgical Scissors (Stainless Steel)",
        price: "350.00",
        originalPrice: "500.00",
        description: "Autoclavable, premium German stainless steel surgical scissors with fine, curved sharp tips.",
        categoryId: categoryMap["surgical"],
        subcategory: "Scissors",
        imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop",
        stock: 200,
        vendorId,
        isFeatured: true,
      },
      // Stationery
      {
        name: "Premium Grid Paper Spiral Lab Notebook (A4)",
        price: "180.00",
        originalPrice: "240.00",
        description: "Heavyweight 90gsm acid-free grid-lined paper, perfect for scientific calculations and institutional record keeping.",
        categoryId: categoryMap["stationery"],
        subcategory: "Notebooks",
        imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=600&auto=format&fit=crop",
        stock: 500,
        vendorId,
        isFeatured: true,
      },
      // Housekeeping
      {
        name: "Automatic Sanitizer Gel Dispenser (1L)",
        price: "1500.00",
        originalPrice: "2200.00",
        description: "Smart motion-activated contactless hand sanitizer dispenser for high-traffic institutional entryways.",
        categoryId: categoryMap["housekeeping"],
        subcategory: "Disinfectants",
        imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop",
        stock: 90,
        vendorId,
        isFeatured: true,
      },
      // 10 MORE PRODUCTS FOR E-COMMERCE SEED
      {
        name: "Premium Glass Beaker Set (5 Pieces)",
        price: "799.00",
        originalPrice: "1200.00",
        description: "Set of 5 premium borosilicate glass beakers (50ml, 100ml, 250ml, 500ml, 1000ml) with clear measurement graduations.",
        categoryId: categoryMap["laboratory"],
        subcategory: "Glassware",
        imageUrl: "https://images.unsplash.com/photo-1617155093730-a8bf47be792d?q=80&w=600&auto=format&fit=crop",
        stock: 80,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Digital Analytical Balance (0.001g Precision)",
        price: "8500.00",
        originalPrice: "11500.00",
        description: "High-accuracy digital analytical lab scale balance with draft shield for wind protection and advanced calibration.",
        categoryId: categoryMap["laboratory"],
        subcategory: "Centrifuges",
        imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=600&auto=format&fit=crop",
        stock: 25,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Professional Dual-Head Stethoscope",
        price: "1999.00",
        originalPrice: "2999.00",
        description: "Premium acoustic sensitivity clinical stethoscope with dual-head chestpiece, non-chill rim, and soft ear tips.",
        categoryId: categoryMap["medical"],
        subcategory: "Stethoscopes",
        imageUrl: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=600&auto=format&fit=crop",
        stock: 140,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Disposable Nitrile Examination Gloves (Box of 100)",
        price: "499.00",
        originalPrice: "750.00",
        description: "Powder-free, latex-free blue nitrile gloves offering outstanding puncture resistance and touch sensitivity.",
        categoryId: categoryMap["medical"],
        subcategory: "Diagnostics",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop",
        stock: 600,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Sterile Carbon Steel Scalpel Blades #11 (Pack of 100)",
        price: "650.00",
        originalPrice: "900.00",
        description: "Individually foil-wrapped sterile surgical carbon steel scalpel blades size 11 for clinical precision.",
        categoryId: categoryMap["surgical"],
        subcategory: "Disposables",
        imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=600&auto=format&fit=crop",
        stock: 180,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Retractable Matte Black Gel Pens (Pack of 12)",
        price: "249.00",
        originalPrice: "350.00",
        description: "Premium smooth gel ink pens with comfortable ergonomic rubber grips, perfect for laboratories and schools.",
        categoryId: categoryMap["stationery"],
        subcategory: "Pens",
        imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=600&auto=format&fit=crop",
        stock: 300,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Premium Office Desk Document Organizer",
        price: "450.00",
        originalPrice: "650.00",
        description: "Multi-tier desktop document mesh tray organizer for keeping paperwork and records structured.",
        categoryId: categoryMap["stationery"],
        subcategory: "Organizers",
        imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=600&auto=format&fit=crop",
        stock: 95,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Industrial Grade Disinfectant Floor Cleaner (5L)",
        price: "699.00",
        originalPrice: "999.00",
        description: "Concentrated pine-fresh floor disinfectant and surface cleaner that kills 99.9% of bacteria and viruses.",
        categoryId: categoryMap["housekeeping"],
        subcategory: "Disinfectants",
        imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
        stock: 150,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Organic Herbal Green Tea Bags (Box of 100)",
        price: "350.00",
        originalPrice: "500.00",
        description: "Premium rich antioxidant green tea bags, perfect for institutional staff break rooms and canteens.",
        categoryId: categoryMap["canteen"],
        subcategory: "Beverages",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
        stock: 250,
        vendorId,
        isFeatured: true,
      },
      {
        name: "Roasted Arabica Coffee Beans (1kg Bag)",
        price: "850.00",
        originalPrice: "1200.00",
        description: "Medium roast 100% Arabica coffee beans for breakroom espresso and cafeteria coffee makers.",
        categoryId: categoryMap["canteen"],
        subcategory: "Snacks",
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
        stock: 120,
        vendorId,
        isFeatured: true,
      }
    ];

    for (const prod of productsData) {
      await db.insert(productsTable).values(prod).onConflictDoNothing();
    }

    console.log("Database seeded successfully with all premium categories and products.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  process.exit(0);
}

main();
