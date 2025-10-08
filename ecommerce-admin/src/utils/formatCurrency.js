// src/utils/formatCurrency.js
export default function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN", // ✅ Naira
    minimumFractionDigits: 0,
  }).format(amount);
}
