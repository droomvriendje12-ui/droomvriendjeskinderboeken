/**
 * Printables bundel — progressieve bundelkorting op digitale PDF's.
 *
 * Bron van waarheid voor zowel de "Stel je eigen pakket samen"-calculator op /pro
 * als de winkelwagen (CartContext.getDiscount). Hierdoor toont de calculator exact
 * de prijs die de checkout ook rekent — de korting loopt op tot de geadverteerde 50%
 * voor het complete pakket.
 *
 * Pas je de tarieven aan? Dan passen calculator én winkelwagen zich automatisch aan.
 */
export const PRINTABLE_BUNDLE_TIERS = [
  { min: 8, pct: 0.50, label: 'Compleet pakket — 50% korting' },
  { min: 6, pct: 0.40, label: '40% bundelkorting' },
  { min: 4, pct: 0.30, label: '30% bundelkorting' },
  { min: 2, pct: 0.20, label: '20% bundelkorting' },
  { min: 1, pct: 0, label: '' },
];

export const isDigitalItem = (item) =>
  item?.productType === 'digital' ||
  (typeof item?.id === 'string' && item.id.startsWith('digital-'));

export const bundlePct = (count) =>
  PRINTABLE_BUNDLE_TIERS.find((t) => count >= t.min)?.pct || 0;

export const bundleLabel = (count) =>
  PRINTABLE_BUNDLE_TIERS.find((t) => count >= t.min)?.label || '';

export const bundleDiscount = (digitalSubtotal, count) =>
  Math.round(digitalSubtotal * bundlePct(count) * 100) / 100;
