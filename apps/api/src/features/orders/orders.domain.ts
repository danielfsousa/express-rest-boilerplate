import type { OrderStatus } from '@starter/contracts';

const ALLOWED_TRANSITIONS = new Map<OrderStatus, ReadonlySet<OrderStatus>>([
  ['pending_payment', new Set(['paid', 'cancelled'])],
  ['paid', new Set(['fulfilled', 'cancelled', 'refunded'])],
  ['fulfilled', new Set(['refunded'])],
  ['cancelled', new Set()],
  ['refunded', new Set()],
]);

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS.get(from)?.has(to) ?? false;
}

export function calculateOrderTotalCents(
  items: ReadonlyArray<{ quantity: number; unitPriceCents: number }>,
): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
}

export function shouldRestoreStockOnTransition(from: OrderStatus, to: OrderStatus): boolean {
  return to === 'cancelled' && (from === 'pending_payment' || from === 'paid');
}
