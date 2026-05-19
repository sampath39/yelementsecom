import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, sql, or, asc } from "drizzle-orm";
import { desc } from "drizzle-orm";
import {
  db,
  productsTable,
  categoriesTable,
  usersTable,
  reviewsTable,
} from "@workspace/db";
import {
  GetProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";
import { requireAuth, requireVendorOrAdmin, optionalAuth } from "../lib/auth";

const router: IRouter = Router();

async function enrichProduct(product: typeof productsTable.$inferSelect) {
  const [category] = await db
    .select({ name: categoriesTable.name })
    .from(categoriesTable)
    .where(eq(categoriesTable.id, product.categoryId));
  let vendorName: string | null = null;
  if (product.vendorId) {
    const [vendor] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, product.vendorId));
    vendorName = vendor?.name ?? null;
  }
  const reviews = await db
    .select({ rating: reviewsTable.rating })
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, product.id));
  const reviewCount = reviews.length;
  const rating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  return {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    description: product.description,
    categoryId: product.categoryId,
    categoryName: category?.name ?? null,
    subcategory: product.subcategory,
    imageUrl: product.imageUrl,
    images: product.images ?? [],
    stock: product.stock,
    vendorId: product.vendorId,
    vendorName,
    rating,
    reviewCount,
    isFeatured: product.isFeatured,
    discount: product.discount ? Number(product.discount) : null,
    createdAt: product.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  // Strip out "null" string values sent by the frontend for optional params
  const rawQuery = Object.fromEntries(
    Object.entries(req.query).filter(([, v]) => v !== "null" && v !== "undefined" && v !== "")
  );
  const params = GetProductsQueryParams.safeParse(rawQuery);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const {
    categoryId,
    subcategory,
    search,
    minPrice,
    maxPrice,
    page = 1,
    limit = 20,
    vendorId,
  } = params.data;

  // 🏷️ Dynamically match category slug/name if passed as a string parameter
  let activeCategoryId = categoryId;
  const categorySlug = rawQuery.category as string | undefined;

  if (categorySlug && !activeCategoryId) {
    const [matchedCategory] = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(
        or(
          ilike(categoriesTable.slug, categorySlug),
          ilike(categoriesTable.name, categorySlug)
        )
      );
    if (matchedCategory) {
      activeCategoryId = matchedCategory.id;
    } else {
      activeCategoryId = -1; // force returning empty products list if not found
    }
  }

  const conditions = [];
  if (activeCategoryId) conditions.push(eq(productsTable.categoryId, activeCategoryId));
  if (subcategory) conditions.push(eq(productsTable.subcategory, subcategory));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (minPrice != null)
    conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice != null)
    conditions.push(lte(productsTable.price, String(maxPrice)));
  if (vendorId) conditions.push(eq(productsTable.vendorId, vendorId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const safePage = page ?? 1;
  const safeLimit = limit ?? 20;
  const offset = (safePage - 1) * safeLimit;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(where);

  // 📈 Custom database sorting
  const sortOption = rawQuery.sort as string | undefined;
  let orderByClause = desc(productsTable.createdAt);
  if (sortOption === "price_low") {
    orderByClause = asc(sql`price::numeric`);
  } else if (sortOption === "price_high") {
    orderByClause = desc(sql`price::numeric`);
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(where)
    .orderBy(orderByClause)
    .limit(safeLimit)
    .offset(offset);

  const enriched = await Promise.all(products.map(enrichProduct));
  const total = totalResult?.count ?? 0;

  res.json({
    products: enriched,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  });
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isFeatured, true))
    .limit(12);

  const enriched = await Promise.all(products.map(enrichProduct));
  res.json(enriched);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const enriched = await enrichProduct(product);
  res.json(enriched);
});

router.post(
  "/products",
  requireVendorOrAdmin,
  async (req, res): Promise<void> => {
    const parsed = CreateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const vendorId =
      (req as any).userRole === "vendor"
        ? (req as any).userId
        : (parsed.data.vendorId ?? null);

    const [product] = await db
      .insert(productsTable)
      .values({
        name: parsed.data.name,
        price: String(parsed.data.price),
        originalPrice: parsed.data.originalPrice
          ? String(parsed.data.originalPrice)
          : null,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        subcategory: parsed.data.subcategory,
        imageUrl: parsed.data.imageUrl,
        images: parsed.data.images ?? [],
        stock: parsed.data.stock,
        vendorId,
        isFeatured: parsed.data.isFeatured ?? false,
        discount: parsed.data.discount ? String(parsed.data.discount) : null,
      })
      .returning();

    const enriched = await enrichProduct(product);
    res.status(201).json(enriched);
  },
);

router.put(
  "/products/:id",
  requireVendorOrAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const updateData: Partial<typeof productsTable.$inferInsert> = {
      name: parsed.data.name,
      price: String(parsed.data.price),
      originalPrice: parsed.data.originalPrice
        ? String(parsed.data.originalPrice)
        : null,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      subcategory: parsed.data.subcategory,
      imageUrl: parsed.data.imageUrl,
      images: parsed.data.images ?? [],
      stock: parsed.data.stock,
      isFeatured: parsed.data.isFeatured ?? false,
      discount: parsed.data.discount ? String(parsed.data.discount) : null,
    };

    const [product] = await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, params.data.id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const enriched = await enrichProduct(product);
    res.json(enriched);
  },
);

router.delete(
  "/products/:id",
  requireVendorOrAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [product] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, params.data.id))
      .returning();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({ success: true, message: "Product deleted" });
  },
);

export default router;
