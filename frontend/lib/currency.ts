// Simplified currency utility - only NPR
export function formatCurrency(amount: number): string {
  return `Rs${amount.toFixed(2)}`;
}
