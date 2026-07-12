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

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

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

/** Full breakdown. Tax applies to the discounted subtotal; shipping is free at/above the threshold. */
export function computeTotals(subtotal: number, coupon: PricingCoupon | null): OrderTotals {
  const roundedSubtotal = round2(subtotal);
  const discount = computeDiscount(roundedSubtotal, coupon);
  const discounted = roundedSubtotal - discount;
  const tax = round2(discounted * TAX_RATE);
  const shipping = roundedSubtotal === 0 || discounted >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = round2(discounted + tax + shipping);
  return { subtotal: roundedSubtotal, discount, tax, shipping, total };
}
