import { describe, expect, test } from 'vite-plus/test';
import {
  calculateOrderTotalCents,
  canTransitionOrderStatus,
  shouldRestoreStockOnTransition,
} from './orders.domain.ts';

describe('orders.domain', () => {
  test('calculateOrderTotalCents sums quantity * unitPriceCents', () => {
    expect(
      calculateOrderTotalCents([
        { quantity: 2, unitPriceCents: 1500 },
        { quantity: 1, unitPriceCents: 2999 },
      ]),
    ).toBe(5999);
    expect(calculateOrderTotalCents([])).toBe(0);
  });

  test('canTransitionOrderStatus allows valid transitions and rejects invalid ones', () => {
    expect(canTransitionOrderStatus('pending_payment', 'paid')).toBe(true);
    expect(canTransitionOrderStatus('pending_payment', 'cancelled')).toBe(true);
    expect(canTransitionOrderStatus('pending_payment', 'fulfilled')).toBe(false);

    expect(canTransitionOrderStatus('paid', 'fulfilled')).toBe(true);
    expect(canTransitionOrderStatus('paid', 'cancelled')).toBe(true);
    expect(canTransitionOrderStatus('paid', 'refunded')).toBe(true);

    expect(canTransitionOrderStatus('fulfilled', 'refunded')).toBe(true);
    expect(canTransitionOrderStatus('fulfilled', 'cancelled')).toBe(false);

    expect(canTransitionOrderStatus('cancelled', 'paid')).toBe(false);
    expect(canTransitionOrderStatus('refunded', 'paid')).toBe(false);
  });

  test('shouldRestoreStockOnTransition restores stock only when cancelling pending_payment or paid orders', () => {
    expect(shouldRestoreStockOnTransition('pending_payment', 'cancelled')).toBe(true);
    expect(shouldRestoreStockOnTransition('paid', 'cancelled')).toBe(true);
    expect(shouldRestoreStockOnTransition('fulfilled', 'cancelled')).toBe(false);
    expect(shouldRestoreStockOnTransition('paid', 'fulfilled')).toBe(false);
  });
});
