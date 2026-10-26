/**
 * Shared pricing formatting and calculation helpers
 * Handles currency formatting, profit rounding, margins, and health status
 */

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "₹0"
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100
  if (Number.isInteger(rounded)) {
    return `₹${rounded.toLocaleString("en-IN")}`
  }
  const str = rounded.toFixed(2)
  if (str.endsWith(".00")) return `₹${parseInt(str, 10).toLocaleString("en-IN")}`
  if (str.endsWith("0")) return `₹${rounded.toFixed(1)}`
  return `₹${rounded.toFixed(2)}`
}

export function formatProfitRange(min: number, max: number): string {
  const fMin = formatCurrency(min)
  const fMax = formatCurrency(max)
  if (min === max) return fMin
  return `${fMin} – ${fMax}`
}

export function formatMargin(margin: number | null | undefined): string {
  if (margin == null || isNaN(margin)) return "0.0%"
  return `${margin.toFixed(1)}%`
}
