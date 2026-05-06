// ══════════════════════════════════════════════════════════════════════
// Patrón Strategy — Descuentos (RF Arquitectura 6.13.5)
// Servicio de dominio puro: sin dependencias externas
// ══════════════════════════════════════════════════════════════════════
import { Coupon } from '../entities/index';

export interface DiscountResult {
  subtotal: number; discountAmount: number; total: number; description: string;
}

// ── Puerto de la estrategia ────────────────────────────────────────────────────
export interface IDiscountStrategy {
  calculate(subtotal: number): number;
  describe(): string;
}

// ── Estrategias concretas ──────────────────────────────────────────────────────
export class NoDiscountStrategy implements IDiscountStrategy {
  calculate(_subtotal: number): number { return 0; }
  describe(): string { return 'Sin descuento'; }
}

export class CouponDiscountStrategy implements IDiscountStrategy {
  constructor(private readonly value: number) {}
  calculate(subtotal: number): number { return Math.min(this.value, subtotal); }
  describe(): string { return `Cupón fijo de $${this.value}`; }
}

export class PercentDiscountStrategy implements IDiscountStrategy {
  constructor(private readonly percent: number) {}
  calculate(subtotal: number): number {
    return Math.round(subtotal * (this.percent / 100) * 100) / 100;
  }
  describe(): string { return `Descuento del ${this.percent}%`; }
}

export class VolumeDiscountStrategy implements IDiscountStrategy {
  constructor(private readonly threshold: number, private readonly percent: number) {}
  calculate(subtotal: number): number {
    if (subtotal < this.threshold) return 0;
    return Math.round(subtotal * (this.percent / 100) * 100) / 100;
  }
  describe(): string { return `Descuento por volumen (≥$${this.threshold} → ${this.percent}%)`; }
}

// ── Contexto ───────────────────────────────────────────────────────────────────
export class DiscountContext {
  constructor(private strategy: IDiscountStrategy = new NoDiscountStrategy()) {}

  setStrategy(s: IDiscountStrategy): void { this.strategy = s; }

  applyDiscount(subtotal: number): DiscountResult {
    const amount = this.strategy.calculate(subtotal);
    return {
      subtotal,
      discountAmount: amount,
      total: Math.max(0, +(subtotal - amount).toFixed(2)),
      description: this.strategy.describe()
    };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────────
export function createStrategy(coupon?: Coupon): IDiscountStrategy {
  if (!coupon) return new NoDiscountStrategy();
  switch (coupon.type) {
    case 'percent': return new PercentDiscountStrategy(coupon.value);
    case 'fixed':   return new CouponDiscountStrategy(coupon.value);
    case 'volume':  return new VolumeDiscountStrategy(coupon.min_amount, coupon.value);
    default:        return new NoDiscountStrategy();
  }
}
