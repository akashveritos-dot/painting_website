// Single source of truth for order pricing. Imported by the cart page, the
// checkout page, and the server order-creation route so all three always agree.
// The server is authoritative (it recomputes from DB prices + a re-validated
// coupon); the client screens use these same functions only for display.

export const TAX_RATE = 0.08;
export const FREE_SHIPPING_THRESHOLD = 25000; // ₹ — free shipping at/above this
export const SHIPPING_FEE = 2000; // ₹

export interface PricingCoupon {
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number | null;
}

// Admin-configurable tax/shipping rules (stored in website_settings). Both can be
// toggled off, which zeroes that line for every order.
export interface PricingConfig {
  taxEnabled: boolean;
  taxRate: number; // percent, e.g. 8
  shippingEnabled: boolean;
  shippingFee: number;
  freeShippingThreshold: number;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  taxEnabled: true,
  taxRate: TAX_RATE * 100,
  shippingEnabled: true,
  shippingFee: SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
};

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function clampNumber(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** Coerce untrusted stored/submitted config into a safe, complete PricingConfig. */
export function normalizePricingConfig(raw: unknown): PricingConfig {
  const r = (raw || {}) as Record<string, unknown>;
  return {
    taxEnabled: r.taxEnabled !== false,
    taxRate: clampNumber(r.taxRate, DEFAULT_PRICING_CONFIG.taxRate, 0, 100),
    shippingEnabled: r.shippingEnabled !== false,
    shippingFee: clampNumber(r.shippingFee, DEFAULT_PRICING_CONFIG.shippingFee, 0),
    freeShippingThreshold: clampNumber(r.freeShippingThreshold, DEFAULT_PRICING_CONFIG.freeShippingThreshold, 0),
  };
}

/** Discount the coupon yields for a subtotal, clamped to [0, subtotal]. */
export function computeDiscount(subtotal: number, coupon: PricingCoupon | null): number {
  if (!coupon) return 0;
  if (subtotal < (coupon.minOrderAmount ?? 0)) return 0; // min-order not met → no discount
  const raw =
    coupon.discountType === 'PERCENTAGE'
      ? subtotal * (coupon.discountValue / 100)
      : coupon.discountValue;
  return round2(Math.min(Math.max(raw, 0), subtotal));
}

/**
 * Full breakdown. Tax applies to the discounted subtotal; shipping is free at/above
 * the threshold. A disabled tax/shipping rule zeroes that line.
 */
export function computeTotals(
  subtotal: number,
  coupon: PricingCoupon | null,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): OrderTotals {
  const roundedSubtotal = round2(subtotal);
  const discount = computeDiscount(roundedSubtotal, coupon);
  const discounted = roundedSubtotal - discount;
  const tax = config.taxEnabled ? round2(discounted * (config.taxRate / 100)) : 0;
  const shipping =
    !config.shippingEnabled || roundedSubtotal === 0 || discounted >= config.freeShippingThreshold
      ? 0
      : config.shippingFee;
  const total = round2(discounted + tax + shipping);
  return { subtotal: roundedSubtotal, discount, tax, shipping, total };
}
