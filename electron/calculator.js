// electron/calculator.js
// ------------------------------------------------------------
// CENTRAL POS CALCULATION ENGINE (VAT + Discounts + Line Items)
// ------------------------------------------------------------

function round(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

/**
 * Compute line totals for each product
 */
function computeLineTotals(items) {
  let subtotal = 0;
  let vatSales = 0;
  let vatAmount = 0;
  let vatExempt = 0;
  let zeroRated = 0;

  const processed = items.map(item => {
    const qty = Number(item.quantity || 0);
    const unit = Number(item.unitPrice ?? item.price ?? 0);

    const lineTotal = round(qty * unit);

    subtotal += lineTotal;
    vatSales += Number(item.vatSales || 0) * qty;
    vatAmount += Number(item.vatAmount || 0) * qty;
    vatExempt += Number(item.vatExempt || 0) * qty;
    zeroRated += Number(item.zeroRated || 0) * qty;

    return {
      ...item,
      total: lineTotal
    };
  });

  return {
    processed,
    subtotal: round(subtotal),
    vatSales: round(vatSales),
    vatAmount: round(vatAmount),
    vatExempt: round(vatExempt),
    zeroRated: round(zeroRated)
  };
}

/**
 * Calculate discount amount.
 * Supports:
 * - SC (20%)
 * - PWD (20%)
 * - Percent discount (0–100)
 * - Fixed amount
 */
function computeDiscount(subtotal, vatSales, discountType, discountValue) {
  let discountAmount = 0;

  if (!discountType) return 0;

  // SC/PWD — 20% on VATABLE SALES ONLY
  if (discountType === 'SC' || discountType === 'PWD') {
    discountAmount = round(vatSales * 0.20);
    return discountAmount;
  }

  // Percentage discount
  if (discountType === 'PERCENT') {
    const pct = Number(discountValue || 0);
    discountAmount = round(subtotal * (pct / 100));
    return discountAmount;
  }

  // Fixed discount
  if (discountType === 'AMOUNT') {
    return round(Number(discountValue || 0));
  }

  return 0;
}

/**
 * Main POS calculation entry point
 */
export function calculatePOS(cartItems, discountType, discountValue, tendered) {
  const {
    processed,
    subtotal,
    vatSales,
    vatAmount,
    vatExempt,
    zeroRated
  } = computeLineTotals(cartItems);

  // ---- DISCOUNT ----
  let discountAmount = computeDiscount(
    subtotal,
    vatSales,
    discountType,
    discountValue
  );

  if (discountAmount < 0) discountAmount = 0;
  if (discountAmount > subtotal) discountAmount = subtotal;

  // Apply proportional reduction to VAT-related fields
  const totalAfterDiscount = round(subtotal - discountAmount);
  const discountRatio =
    subtotal > 0 ? totalAfterDiscount / subtotal : 1;

  const vatSalesAdj = round(vatSales * discountRatio);
  const vatAmountAdj = round(vatAmount * discountRatio);
  const vatExemptAdj = round(vatExempt * discountRatio);
  const zeroRatedAdj = round(zeroRated * discountRatio);

  const total = totalAfterDiscount;

  const change = round((Number(tendered) || 0) - total);

  return {
    items: processed,

    // Base totals
    subtotal,
    discountAmount,
    total,

    // VAT breakdown
    vatSales: vatSalesAdj,
    vatAmount: vatAmountAdj,
    vatExempt: vatExemptAdj,
    zeroRated: zeroRatedAdj,

    // Payments
    change: change >= 0 ? change : 0
  };
}
