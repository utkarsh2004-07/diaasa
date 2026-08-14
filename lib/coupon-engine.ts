import { prisma } from "@/lib/prisma";

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  discount: number;
  subtotal: number;
  shipping: number;
  total: number;
  error?: string;
  errorCode?: string;
}

interface RequiredProduct {
  productId: string;
  quantity: number;
}

// ── Shipping rule (single source of truth) ──────────────────
export function calcShipping(subtotal: number): number {
  return subtotal >= 500 ? 0 : 49;
}

// ── Main engine ──────────────────────────────────────────────
export async function validateCoupon(
  code: string,
  cartItems: CartItem[],
  userId?: string
): Promise<CouponValidationResult> {

  // 1. Basic input checks
  if (!code?.trim()) return fail("VALIDATION_ERROR", "Coupon code required");
  if (!cartItems?.length) return fail("EMPTY_CART", "Your cart is empty");

  // 2. Fetch coupon from DB
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase().trim(),
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!coupon) return fail("INVALID_COUPON", "Invalid or expired coupon code");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return fail("COUPON_EXHAUSTED", "This coupon has reached its usage limit");

  // 3. Fetch actual product prices from DB — NEVER trust frontend prices
  const productIds = [...new Set(cartItems.map((i) => i.productId))];
  const variantIds = [...new Set(cartItems.map((i) => i.variantId))];

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, gstPercent: true },
    }),
    prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      select: { id: true, productId: true, price: true, stock: true },
    }),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  // 4. Validate each cart item exists and has stock
  for (const item of cartItems) {
    const product = productMap.get(item.productId);
    const variant = variantMap.get(item.variantId);
    if (!product || !variant) return fail("INVALID_PRODUCT", "One or more products are invalid");
    if (variant.productId !== item.productId) return fail("INVALID_PRODUCT", "Product/variant mismatch");
    if (variant.stock < item.quantity) return fail("INSUFFICIENT_STOCK", `Insufficient stock for ${product.name}`);
  }

  // 5. Server-side subtotal calculation
  let subtotal = 0;
  for (const item of cartItems) {
    const variant = variantMap.get(item.variantId)!;
    subtotal += variant.price * item.quantity;
  }
  subtotal = Math.round(subtotal * 100) / 100;

  // 6. Min cart value check
  if (subtotal < coupon.minCartValue)
    return fail("COUPON_MIN_VALUE", `Minimum cart value of ₹${coupon.minCartValue} required`);

  // 7. Required products validation (product-specific coupons)
  if (coupon.requiredProducts) {
    const required = coupon.requiredProducts as unknown as RequiredProduct[];

    if (required.length > 0) {
      // Build a map of productId → total quantity in cart
      const cartProductQty = new Map<string, number>();
      for (const item of cartItems) {
        cartProductQty.set(item.productId, (cartProductQty.get(item.productId) || 0) + item.quantity);
      }

      // Check each required product has exact quantity
      for (const req of required) {
        const cartQty = cartProductQty.get(req.productId) || 0;
        if (cartQty !== req.quantity) {
          const product = productMap.get(req.productId);
          return fail(
            "CART_MISMATCH",
            `This coupon requires exactly ${req.quantity}x ${product?.name || "a specific product"}`
          );
        }
      }

      // If exact cart required — no extra products allowed
      if (!coupon.allowExtraProducts) {
        const requiredIds = new Set(required.map((r) => r.productId));
        for (const item of cartItems) {
          if (!requiredIds.has(item.productId)) {
            return fail("CART_MISMATCH", "This coupon only works with specific products. Remove other items.");
          }
        }
        // Also check no extra products beyond required
        if (cartProductQty.size !== required.length) {
          return fail("CART_MISMATCH", "This coupon only works with specific products. Remove other items.");
        }
      }
    }
  }

  // 8. Calculate discount server-side
  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    // FLAT
    discount = Math.min(coupon.value, subtotal);
  }
  discount = Math.round(discount * 100) / 100;

  const shipping = calcShipping(subtotal);
  const total = Math.max(subtotal + shipping - discount, 0);

  return {
    valid: true,
    code: coupon.code,
    discount,
    subtotal,
    shipping,
    total: Math.round(total * 100) / 100,
  };
}

function fail(errorCode: string, error: string): CouponValidationResult {
  return { valid: false, discount: 0, subtotal: 0, shipping: 0, total: 0, error, errorCode };
}
