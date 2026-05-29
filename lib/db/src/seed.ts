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

  // Insert or update users
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
  ]).onConflictDoNothing();

  // Insert or update categories
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
  ]).onConflictDoNothing();

  // Get category IDs
  const categories = await db.select().from(categoriesTable);
  const stationeryCategory = categories.find(c => c.slug === "stationery")!;
  const medicalCategory = categories.find(c => c.slug === "medical")!;
  const laboratoryCategory = categories.find(c => c.slug === "laboratory")!;
  const surgicalCategory = categories.find(c => c.slug === "surgical")!;
  const canteenCategory = categories.find(c => c.slug === "canteen")!;
  const housekeepingCategory = categories.find(c => c.slug === "housekeeping")!;
  const miscCategory = categories.find(c => c.slug === "miscellaneous")!;

  // Get vendor ID
  const vendor = await db.select().from(usersTable).where(eq(usersTable.email, "vendor@yelements.com"));
  const vendorId = vendor[0]?.id;

  function generateMapping(productName: string, subcat: string, catSlug: string, sku: string, price: number) {
    return {
      masterData: {
        sku: sku,
        brand: "Yelements Premium",
        hsnCode: "HSN-" + Math.floor(1000 + Math.random() * 9000),
        gst: "18",
        unit: "Pack",
        origin: "India"
      },
      attributes: [
        { name: "Material Grade", value: "Premium Industry Standard" },
        { name: "Warranty Period", value: "12 Months Manufacturer Warranty" },
        { name: "Certification", value: "ISO 9001:2015 & CE Certified" },
        { name: "Special Feature", value: "Heavy-duty B2B Institutional Quality" }
      ],
      taxonomy: ["Institutional", catSlug.toUpperCase(), subcat],
      variants: [
        { variant: "Standard Pack", size: "Regular", sku: sku + "-STD", packingUnit: "Pack" },
        { variant: "Bulk Carton", size: "10x Pack", sku: sku + "-BULK", packingUnit: "Carton" }
      ],
      suppliers: [
        { name: "ABC Medical & Stationery Ltd", price: Math.round(price * 0.92), rating: "⭐ 4.8 (Verified)", sku: sku + "-ABC" },
        { name: "Apex Global Supplies", price: Math.round(price * 0.95), rating: "⭐ 4.6 (Verified)", sku: sku + "-APX" }
      ],
      packSize: {
        smallPackSize: "1 unit / box",
        smallPackType: "Standard Box",
        smallContains: "1 piece with manual",
        smallSku: sku + "-STD",
        cartonPackSize: "10 boxes / carton",
        cartonPackType: "Corrugated Carton",
        cartonContains: "10 individually boxed units",
        cartonSku: sku + "-BULK"
      },
      media: {
        techSheetPdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        userManualPdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        brochurePdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      }
    };
  }

  // Insert or update products
  console.log("Inserting products...");
  const rawProducts = [
    // 📝 Stationery (5)
    {
      name: "Executive Gel Pens - Box of 50",
      price: "250",
      originalPrice: "300",
      description: "High quality smooth writing gel pens for corporate and educational institutions.",
      categoryId: stationeryCategory.id,
      subcategory: "Pens",
      imageUrl: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400",
      images: ["https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400"],
      stock: 500,
      vendorId,
      isFeatured: true,
      sku: "ST-PEN-GEL50",
      tags: ["stationery", "pens", "office"],
      mapping: generateMapping("Executive Gel Pens - Box of 50", "Pens", "stationery", "ST-PEN-GEL50", 250)
    },
    {
      name: "A4 Spiral Notebooks - Pack of 10",
      price: "450",
      originalPrice: "550",
      description: "Premium A4 size ruled spiral notebooks, 200 pages each, high gsm paper.",
      categoryId: stationeryCategory.id,
      subcategory: "Notebooks",
      imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
      images: ["https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400"],
      stock: 350,
      vendorId,
      isFeatured: true,
      sku: "ST-NB-SPIRAL10",
      tags: ["stationery", "notebooks", "office"],
      mapping: generateMapping("A4 Spiral Notebooks - Pack of 10", "Notebooks", "stationery", "ST-NB-SPIRAL10", 450)
    },
    {
      name: "Ring Binder Files - Pack of 5",
      price: "350",
      originalPrice: "420",
      description: "Heavy duty cardboard ring binder files for office document archiving.",
      categoryId: stationeryCategory.id,
      subcategory: "Files",
      imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400",
      images: ["https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400"],
      stock: 600,
      vendorId,
      isFeatured: false,
      sku: "ST-FILE-RING5",
      tags: ["stationery", "files", "office"],
      mapping: generateMapping("Ring Binder Files - Pack of 5", "Files", "stationery", "ST-FILE-RING5", 350)
    },
    {
      name: "12-Digit Desk Calculator",
      price: "550",
      originalPrice: "699",
      description: "Solar powered dual-power desk calculator with large LCD display.",
      categoryId: stationeryCategory.id,
      subcategory: "Calculators",
      imageUrl: "https://images.unsplash.com/photo-1574607383476-f517f220d324?w=400",
      images: ["https://images.unsplash.com/photo-1574607383476-f517f220d324?w=400"],
      stock: 200,
      vendorId,
      isFeatured: false,
      sku: "ST-CALC-12D",
      tags: ["stationery", "calculators", "office"],
      mapping: generateMapping("12-Digit Desk Calculator", "Calculators", "stationery", "ST-CALC-12D", 550)
    },
    {
      name: "Premium Acrylic Paints Set",
      price: "850",
      originalPrice: "1000",
      description: "Vibrant acrylic paint tube set of 24 colors with brushes for art rooms.",
      categoryId: stationeryCategory.id,
      subcategory: "Art Supplies",
      imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
      images: ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400"],
      stock: 120,
      vendorId,
      isFeatured: false,
      sku: "ST-ART-ACRY24",
      tags: ["stationery", "art", "acrylic"],
      mapping: generateMapping("Premium Acrylic Paints Set", "Art Supplies", "stationery", "ST-ART-ACRY24", 850)
    },

    // 🏥 Medical (4)
    {
      name: "Emergency First Aid Kit",
      price: "1200",
      originalPrice: "1500",
      description: "Fully loaded emergency response medical kit certified for workplaces.",
      categoryId: medicalCategory.id,
      subcategory: "First Aid",
      imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400",
      images: ["https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400"],
      stock: 250,
      vendorId,
      isFeatured: true,
      sku: "MD-FA-IND1",
      tags: ["medical", "firstaid", "emergency"],
      mapping: generateMapping("Emergency First Aid Kit", "First Aid", "medical", "MD-FA-IND1", 1200)
    },
    {
      name: "Digital Blood Pressure Monitor",
      price: "1850",
      originalPrice: "2400",
      description: "Automatic upper arm blood pressure monitor with digital pulse reading.",
      categoryId: medicalCategory.id,
      subcategory: "Diagnostic",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
      images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400"],
      stock: 150,
      vendorId,
      isFeatured: true,
      sku: "MD-DI-BPMON",
      tags: ["medical", "diagnostic", "bp"],
      mapping: generateMapping("Digital Blood Pressure Monitor", "Diagnostic", "medical", "MD-DI-BPMON", 1850)
    },
    {
      name: "Surgical Disposables Set",
      price: "650",
      originalPrice: "800",
      description: "Hospital grade surgical gown, cap, and mask disposable set.",
      categoryId: medicalCategory.id,
      subcategory: "Surgical",
      imageUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400",
      images: ["https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400"],
      stock: 400,
      vendorId,
      isFeatured: false,
      sku: "MD-SU-DISP",
      tags: ["medical", "surgical", "disposable"],
      mapping: generateMapping("Surgical Disposables Set", "Surgical", "medical", "MD-SU-DISP", 650)
    },
    {
      name: "Adjustable Patient Wheelchair",
      price: "7500",
      originalPrice: "9000",
      description: "Heavy duty foldable patient wheelchair with padded armrests.",
      categoryId: medicalCategory.id,
      subcategory: "Patient Care",
      imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
      images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400"],
      stock: 50,
      vendorId,
      isFeatured: false,
      sku: "MD-PC-WCHAIR",
      tags: ["medical", "wheelchair", "care"],
      mapping: generateMapping("Adjustable Patient Wheelchair", "Patient Care", "medical", "MD-PC-WCHAIR", 7500)
    },

    // 🔬 Laboratory (4)
    {
      name: "Borosilicate Beaker Pack - 10pcs",
      price: "950",
      originalPrice: "1200",
      description: "Heat resistant laboratory grade borosilicate beakers (50ml to 1000ml).",
      categoryId: laboratoryCategory.id,
      subcategory: "Glassware",
      imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
      images: ["https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400"],
      stock: 180,
      vendorId,
      isFeatured: true,
      sku: "LB-GL-BEAK10",
      tags: ["laboratory", "glassware", "beakers"],
      mapping: generateMapping("Borosilicate Beaker Pack - 10pcs", "Glassware", "laboratory", "LB-GL-BEAK10", 950)
    },
    {
      name: "Laboratory Grade Ethanol - 5L",
      price: "1450",
      originalPrice: "1800",
      description: "99% pure laboratory grade ethanol for research and sterilization.",
      categoryId: laboratoryCategory.id,
      subcategory: "Chemicals",
      imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400",
      images: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400"],
      stock: 300,
      vendorId,
      isFeatured: false,
      sku: "LB-CH-ETH99",
      tags: ["laboratory", "chemicals", "ethanol"],
      mapping: generateMapping("Laboratory Grade Ethanol - 5L", "Chemicals", "laboratory", "LB-CH-ETH99", 1450)
    },
    {
      name: "Digital Precision Laboratory Scale",
      price: "4200",
      originalPrice: "5000",
      description: "High precision digital balance for measuring chemical powders (0.01g accuracy).",
      categoryId: laboratoryCategory.id,
      subcategory: "Instruments",
      imageUrl: "https://images.unsplash.com/photo-1581093588401-f3c22d66c2c9?w=400",
      images: ["https://images.unsplash.com/photo-1581093588401-f3c22d66c2c9?w=400"],
      stock: 80,
      vendorId,
      isFeatured: true,
      sku: "LB-IN-SCALE",
      tags: ["laboratory", "instruments", "scale"],
      mapping: generateMapping("Digital Precision Laboratory Scale", "Instruments", "laboratory", "LB-IN-SCALE", 4200)
    },
    {
      name: "Anti-Splash Safety Goggles",
      price: "180",
      originalPrice: "250",
      description: "Chemical resistant clear safety goggles with ventilation valves.",
      categoryId: laboratoryCategory.id,
      subcategory: "Safety",
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
      images: ["https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400"],
      stock: 500,
      vendorId,
      isFeatured: false,
      sku: "LB-SF-GOGG",
      tags: ["laboratory", "safety", "goggles"],
      mapping: generateMapping("Anti-Splash Safety Goggles", "Safety", "laboratory", "LB-SF-GOGG", 180)
    },

    // 🩺 Surgical (3)
    {
      name: "Stainless Steel Scalpel Handles",
      price: "320",
      originalPrice: "400",
      description: "Reusable surgical stainless steel scalpel handles size 3 and 4.",
      categoryId: surgicalCategory.id,
      subcategory: "Instruments",
      imageUrl: "https://images.unsplash.com/photo-1583912267550-d974311a29c5?w=400",
      images: ["https://images.unsplash.com/photo-1583912267550-d974311a29c5?w=400"],
      stock: 150,
      vendorId,
      isFeatured: false,
      sku: "SR-IN-SCALP",
      tags: ["surgical", "scalpel", "instruments"],
      mapping: generateMapping("Stainless Steel Scalpel Handles", "Instruments", "surgical", "SR-IN-SCALP", 320)
    },
    {
      name: "Sterile Surgical Gloves - Box of 100",
      price: "1150",
      originalPrice: "1500",
      description: "Powder-free sterile latex gloves for professional surgical procedures.",
      categoryId: surgicalCategory.id,
      subcategory: "Disposables",
      imageUrl: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400",
      images: ["https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400"],
      stock: 250,
      vendorId,
      isFeatured: true,
      sku: "SR-DI-GLOV100",
      tags: ["surgical", "gloves", "disposables"],
      mapping: generateMapping("Sterile Surgical Gloves - Box of 100", "Disposables", "surgical", "SR-DI-GLOV100", 1150)
    },
    {
      name: "Autoclave Sterilization Rolls",
      price: "850",
      originalPrice: "1100",
      description: "Flat sterilization pouch rolls for steam and EO gas sterilization systems.",
      categoryId: surgicalCategory.id,
      subcategory: "Sterilization",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
      images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400"],
      stock: 180,
      vendorId,
      isFeatured: false,
      sku: "SR-ST-ROLL",
      tags: ["surgical", "sterilization", "autoclave"],
      mapping: generateMapping("Autoclave Sterilization Rolls", "Sterilization", "surgical", "SR-ST-ROLL", 850)
    },

    // 🍽️ Canteen (4)
    {
      name: "Premium Instant Coffee - 500g",
      price: "380",
      originalPrice: "450",
      description: "Freeze-dried rich aroma instant coffee for office pantries and canteens.",
      categoryId: canteenCategory.id,
      subcategory: "Beverages",
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
      images: ["https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400"],
      stock: 200,
      vendorId,
      isFeatured: true,
      sku: "CN-BV-COFF500",
      tags: ["canteen", "coffee", "beverages"],
      mapping: generateMapping("Premium Instant Coffee - 500g", "Beverages", "canteen", "CN-BV-COFF500", 380)
    },
    {
      name: "Roasted Salted Almonds - 1kg",
      price: "890",
      originalPrice: "1100",
      description: "Premium California roasted and salted almonds, bulk institutional pantry pack.",
      categoryId: canteenCategory.id,
      subcategory: "Snacks",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"],
      stock: 150,
      vendorId,
      isFeatured: false,
      sku: "CN-SN-ALM1",
      tags: ["canteen", "snacks", "almonds"],
      mapping: generateMapping("Roasted Salted Almonds - 1kg", "Snacks", "canteen", "CN-SN-ALM1", 890)
    },
    {
      name: "Ceramic Coffee Mugs - Set of 12",
      price: "720",
      originalPrice: "900",
      description: "Dishwasher and microwave safe classic black ceramic coffee mugs.",
      categoryId: canteenCategory.id,
      subcategory: "Crockery",
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400",
      images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400"],
      stock: 100,
      vendorId,
      isFeatured: false,
      sku: "CN-CR-MUG12",
      tags: ["canteen", "crockery", "mugs"],
      mapping: generateMapping("Ceramic Coffee Mugs - Set of 12", "Crockery", "canteen", "CN-CR-MUG12", 720)
    },
    {
      name: "Stainless Steel Spoons - Set of 24",
      price: "480",
      originalPrice: "600",
      description: "Polished heavy gauge stainless steel spoons for canteen and office pantry.",
      categoryId: canteenCategory.id,
      subcategory: "Cutlery",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"],
      stock: 120,
      vendorId,
      isFeatured: false,
      sku: "CN-CU-SPOON24",
      tags: ["canteen", "cutlery", "spoons"],
      mapping: generateMapping("Stainless Steel Spoons - Set of 24", "Cutlery", "canteen", "CN-CU-SPOON24", 480)
    },

    // 🧹 Housekeeping (3)
    {
      name: "Liquid Hand Soap - 5L Can",
      price: "340",
      originalPrice: "450",
      description: "Gentle moisturizing liquid hand wash formula for bulk soap dispensers.",
      categoryId: housekeepingCategory.id,
      subcategory: "Cleaning",
      imageUrl: "https://images.unsplash.com/photo-1581578731117-104f2a4bd0dd?w=400",
      images: ["https://images.unsplash.com/photo-1581578731117-104f2a4bd0dd?w=400"],
      stock: 300,
      vendorId,
      isFeatured: true,
      sku: "HK-CL-SOAP5L",
      tags: ["housekeeping", "cleaning", "soap"],
      mapping: generateMapping("Liquid Hand Soap - 5L Can", "Cleaning", "housekeeping", "HK-CL-SOAP5L", 340)
    },
    {
      name: "Industrial Detergent Powder - 10kg",
      price: "920",
      originalPrice: "1200",
      description: "High efficiency low foam washing powder for institutional laundry systems.",
      categoryId: housekeepingCategory.id,
      subcategory: "Laundry",
      imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
      images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400"],
      stock: 150,
      vendorId,
      isFeatured: false,
      sku: "HK-LD-DET10K",
      tags: ["housekeeping", "laundry", "detergent"],
      mapping: generateMapping("Industrial Detergent Powder - 10kg", "Laundry", "housekeeping", "HK-LD-DET10K", 920)
    },
    {
      name: "Heavy Duty Pedal Dustbin - 50L",
      price: "1250",
      originalPrice: "1600",
      description: "Durable pedal-operated waste bin for clinical, school, and office spaces.",
      categoryId: housekeepingCategory.id,
      subcategory: "Waste Management",
      imageUrl: "https://images.unsplash.com/photo-1581578731117-104f2a4bd0dd?w=400",
      images: ["https://images.unsplash.com/photo-1581578731117-104f2a4bd0dd?w=400"],
      stock: 200,
      vendorId,
      isFeatured: true,
      sku: "HK-WM-BIN50",
      tags: ["housekeeping", "waste", "dustbin"],
      mapping: generateMapping("Heavy Duty Pedal Dustbin - 50L", "Waste Management", "housekeeping", "HK-WM-BIN50", 1250)
    },

    // 📦 Miscellaneous (3)
    {
      name: "Rechargeable Emergency LED Lantern",
      price: "950",
      originalPrice: "1200",
      description: "High brightness rechargeable LED emergency lantern with mobile charging.",
      categoryId: miscCategory.id,
      subcategory: "Electronics",
      imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
      images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"],
      stock: 120,
      vendorId,
      isFeatured: false,
      sku: "MS-EL-LANT",
      tags: ["miscellaneous", "electronics", "light"],
      mapping: generateMapping("Rechargeable Emergency LED Lantern", "Electronics", "miscellaneous", "MS-EL-LANT", 950)
    },
    {
      name: "Ergonomic Mesh Office Chair",
      price: "6500",
      originalPrice: "8500",
      description: "High back office desk chair with lumbar support and nylon rolling wheels.",
      categoryId: miscCategory.id,
      subcategory: "Furniture",
      imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
      images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"],
      stock: 60,
      vendorId,
      isFeatured: true,
      sku: "MS-FR-CHAIR",
      tags: ["miscellaneous", "furniture", "chair"],
      mapping: generateMapping("Ergonomic Mesh Office Chair", "Furniture", "miscellaneous", "MS-FR-CHAIR", 6500)
    },
    {
      name: "ABC Dry Powder Fire Extinguisher - 4kg",
      price: "1450",
      originalPrice: "1800",
      description: "Wall-mounted ABC dry powder fire extinguisher with safety gauge.",
      categoryId: miscCategory.id,
      subcategory: "Safety",
      imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400",
      images: ["https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400"],
      stock: 150,
      vendorId,
      isFeatured: true,
      sku: "MS-SF-EXT4",
      tags: ["miscellaneous", "safety", "fire"],
      mapping: generateMapping("ABC Dry Powder Fire Extinguisher - 4kg", "Safety", "miscellaneous", "MS-SF-EXT4", 1450)
    }
  ];

  await db.insert(productsTable).values(rawProducts).onConflictDoNothing();

  // Insert or update sample address for user
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
  }).onConflictDoNothing();

  // Insert or update sample coupons
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
  ).onConflictDoNothing();

  console.log("Database seed completed successfully!");
  console.log("\n=== Login Credentials ===");
  console.log("Admin: admin@yelements.com / admin123");
  console.log("Vendor: vendor@yelements.com / vendor123");
  console.log("User: user@yelements.com / user123");
}

seed().catch(console.error);
