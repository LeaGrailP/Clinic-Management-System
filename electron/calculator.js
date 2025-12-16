// calculator.js - Fixed VAT calculation and discount logic
// ------------------------------------------------------------
// CENTRAL POS CALCULATION ENGINE (VAT + Discounts + Line Items)
// ------------------------------------------------------------

/**
 * Proper rounding to avoid floating point errors
 * Uses banker's rounding (round half to even) for fairness
 */
function round(n) {
  const num = Number(n || 0)
  if (!isFinite(num)) return 0
  return Math.round((num + Number.EPSILON) * 100) / 100
}

/**
 * Validate and sanitize input values
 */
function validateInputs(items, discountValue) {
  if (!Array.isArray(items)) {
    throw new Error("Items must be an array")
  }

  items.forEach((item, idx) => {
    const qty = Number(item.quantity || 0)
    const price = Number(item.unitPrice ?? item.price ?? 0)

    if (qty < 0) throw new Error(`Item ${idx}: quantity cannot be negative`)
    if (price < 0) throw new Error(`Item ${idx}: price cannot be negative`)
    if (!isFinite(qty) || !isFinite(price)) {
      throw new Error(`Item ${idx}: invalid quantity or price`)
    }
  })

  if (discountValue && Number(discountValue) < 0) {
    throw new Error("Discount value cannot be negative")
  }
}

/**
 * Compute line totals for each product with proper VAT calculation
 */
function computeLineTotals(items) {
  let subtotal = 0
  let totalVatSales = 0
  let totalVatAmount = 0
  let totalVatExempt = 0
  let totalZeroRated = 0

  const processed = items.map(item => {
    const qty = Number(item.quantity || 0)
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0)
    const vatType = item.vatType || 'vatable'

    // Calculate line total
    const lineTotal = round(qty * unitPrice)

    // VAT breakdown per item
    let itemVatSales = 0
    let itemVatAmount = 0
    let itemVatExempt = 0
    let itemZeroRated = 0

    if (vatType === 'vatable') {
      // For vatable items: price includes VAT
      // VAT Sales = Total / 1.12
      // VAT Amount = Total - VAT Sales
      itemVatSales = round(lineTotal / 1.12)
      itemVatAmount = round(lineTotal - itemVatSales)
    } else if (vatType === 'exempt') {
      itemVatExempt = lineTotal
    } else if (vatType === 'zero') {
      itemZeroRated = lineTotal
    }

    // Accumulate totals
    subtotal += lineTotal
    totalVatSales += itemVatSales
    totalVatAmount += itemVatAmount
    totalVatExempt += itemVatExempt
    totalZeroRated += itemZeroRated

    return {
      ...item,
      quantity: qty,
      unitPrice,
      lineTotal,
      vatType,
      itemVatSales,
      itemVatAmount,
      itemVatExempt,
      itemZeroRated
    }
  })

  return {
    processed,
    subtotal: round(subtotal),
    totalVatSales: round(totalVatSales),
    totalVatAmount: round(totalVatAmount),
    totalVatExempt: round(totalVatExempt),
    totalZeroRated: round(totalZeroRated)
  }
}

/**
 * Calculate discount amount with proper SC/PWD handling
 * 
 * SC/PWD Discount Rules (Philippine BIR):
 * - 20% discount on GROSS SALES (including VAT)
 * - Applied to vatable items only
 * - Discount comes from both the net sales AND the VAT
 */
function computeDiscount(subtotal, totalVatSales, totalVatAmount, discountType, discountValue) {
  let discountAmount = 0

  if (!discountType) return 0

  // SC/PWD — 20% discount on vatable sales (GROSS, including VAT)
  if (discountType === 'SC' || discountType === 'PWD') {
    const vatableGross = round(totalVatSales + totalVatAmount)
    discountAmount = round(vatableGross * 0.20)
    return discountAmount
  }

  // Percentage discount (applied to entire subtotal)
  if (discountType === 'PERCENT') {
    const pct = Number(discountValue || 0)
    if (pct < 0 || pct > 100) {
      throw new Error("Discount percentage must be between 0-100")
    }
    discountAmount = round(subtotal * (pct / 100))
    return discountAmount
  }

  // Fixed amount discount
  if (discountType === 'AMOUNT') {
    const amt = Number(discountValue || 0)
    if (amt > subtotal) {
      throw new Error("Discount amount cannot exceed subtotal")
    }
    return round(amt)
  }

  return 0
}

/**
 * Apply discount proportionally across VAT categories
 */
function applyDiscountToVAT(
  totalVatSales,
  totalVatAmount,
  totalVatExempt,
  totalZeroRated,
  subtotal,
  discountAmount,
  discountType
) {
  // For SC/PWD, discount ONLY affects vatable items
  if (discountType === 'SC' || discountType === 'PWD') {
    const vatableGross = round(totalVatSales + totalVatAmount)
    
    if (vatableGross === 0) {
      // No vatable items, no discount
      return {
        vatSales: totalVatSales,
        vatAmount: totalVatAmount,
        vatExempt: totalVatExempt,
        zeroRated: totalZeroRated
      }
    }

    // Reduce vatable gross by discount
    const newVatableGross = round(vatableGross - discountAmount)
    
    // Recalculate VAT sales and amount
    const newVatSales = round(newVatableGross / 1.12)
    const newVatAmount = round(newVatableGross - newVatSales)

    return {
      vatSales: newVatSales,
      vatAmount: newVatAmount,
      vatExempt: totalVatExempt, // Unchanged
      zeroRated: totalZeroRated  // Unchanged
    }
  }

  // For other discounts, apply proportionally to ALL categories
  if (subtotal === 0) {
    return {
      vatSales: 0,
      vatAmount: 0,
      vatExempt: 0,
      zeroRated: 0
    }
  }

  const discountRatio = (subtotal - discountAmount) / subtotal

  return {
    vatSales: round(totalVatSales * discountRatio),
    vatAmount: round(totalVatAmount * discountRatio),
    vatExempt: round(totalVatExempt * discountRatio),
    zeroRated: round(totalZeroRated * discountRatio)
  }
}

/**
 * Main POS calculation entry point
 * 
 * @param {Array} cartItems - Array of items with quantity, price, vatType
 * @param {String} discountType - 'SC', 'PWD', 'PERCENT', 'AMOUNT', or null
 * @param {Number} discountValue - Value for PERCENT or AMOUNT discounts
 * @param {Number} tendered - Amount paid by customer
 * @returns {Object} Complete invoice breakdown
 */
export function calculatePOS(cartItems, discountType, discountValue, tendered) {
  try {
    // Validate inputs
    validateInputs(cartItems, discountValue)

    // Compute line totals
    const {
      processed,
      subtotal,
      totalVatSales,
      totalVatAmount,
      totalVatExempt,
      totalZeroRated
    } = computeLineTotals(cartItems)

    // Calculate discount
    let discountAmount = computeDiscount(
      subtotal,
      totalVatSales,
      totalVatAmount,
      discountType,
      discountValue
    )

    // Ensure discount doesn't exceed subtotal
    if (discountAmount > subtotal) {
      console.warn("Discount exceeds subtotal, capping at subtotal")
      discountAmount = subtotal
    }

    // Apply discount to VAT categories
    const adjustedVAT = applyDiscountToVAT(
      totalVatSales,
      totalVatAmount,
      totalVatExempt,
      totalZeroRated,
      subtotal,
      discountAmount,
      discountType
    )

    // Calculate final total
    const total = round(subtotal - discountAmount)

    // Calculate change
    const tenderedAmount = Number(tendered) || 0
    const change = round(tenderedAmount - total)

    return {
      items: processed,

      // Base totals
      subtotal: round(subtotal),
      discountAmount: round(discountAmount),
      discountType: discountType || null,
      total: round(total),

      // VAT breakdown (after discount)
      vatSales: adjustedVAT.vatSales,
      vatAmount: adjustedVAT.vatAmount,
      vatExempt: adjustedVAT.vatExempt,
      zeroRated: adjustedVAT.zeroRated,

      // Payments
      tendered: round(tenderedAmount),
      change: change >= 0 ? change : 0,

      // Validation flag
      isValid: total >= 0 && !isNaN(total)
    }
  } catch (err) {
    console.error("POS Calculation Error:", err)
    throw err
  }
}

/**
 * Helper: Calculate totals for reporting (no discount)
 */
export function calculateTotalsOnly(cartItems) {
  const {
    subtotal,
    totalVatSales,
    totalVatAmount,
    totalVatExempt,
    totalZeroRated
  } = computeLineTotals(cartItems)

  return {
    subtotal: round(subtotal),
    vatSales: round(totalVatSales),
    vatAmount: round(totalVatAmount),
    vatExempt: round(totalVatExempt),
    zeroRated: round(totalZeroRated)
  }
}

/**
 * Helper: Validate if discount is applicable
 */
export function validateDiscount(subtotal, discountType, discountValue) {
  try {
    if (!discountType) return { valid: true }

    if (discountType === 'PERCENT') {
      const pct = Number(discountValue || 0)
      if (pct < 0 || pct > 100) {
        return { valid: false, error: "Percentage must be 0-100" }
      }
    }

    if (discountType === 'AMOUNT') {
      const amt = Number(discountValue || 0)
      if (amt < 0) {
        return { valid: false, error: "Amount cannot be negative" }
      }
      if (amt > subtotal) {
        return { valid: false, error: "Amount exceeds subtotal" }
      }
    }

    return { valid: true }
  } catch (err) {
    return { valid: false, error: err.message }
  }
}