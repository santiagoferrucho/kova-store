"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountContext = exports.VolumeDiscountStrategy = exports.PercentDiscountStrategy = exports.CouponDiscountStrategy = exports.NoDiscountStrategy = void 0;
exports.createStrategy = createStrategy;
// ── Estrategias concretas ──────────────────────────────────────────────────────
class NoDiscountStrategy {
    calculate(_subtotal) { return 0; }
    describe() { return 'Sin descuento'; }
}
exports.NoDiscountStrategy = NoDiscountStrategy;
class CouponDiscountStrategy {
    value;
    constructor(value) {
        this.value = value;
    }
    calculate(subtotal) { return Math.min(this.value, subtotal); }
    describe() { return `Cupón fijo de $${this.value}`; }
}
exports.CouponDiscountStrategy = CouponDiscountStrategy;
class PercentDiscountStrategy {
    percent;
    constructor(percent) {
        this.percent = percent;
    }
    calculate(subtotal) {
        return Math.round(subtotal * (this.percent / 100) * 100) / 100;
    }
    describe() { return `Descuento del ${this.percent}%`; }
}
exports.PercentDiscountStrategy = PercentDiscountStrategy;
class VolumeDiscountStrategy {
    threshold;
    percent;
    constructor(threshold, percent) {
        this.threshold = threshold;
        this.percent = percent;
    }
    calculate(subtotal) {
        if (subtotal < this.threshold)
            return 0;
        return Math.round(subtotal * (this.percent / 100) * 100) / 100;
    }
    describe() { return `Descuento por volumen (≥$${this.threshold} → ${this.percent}%)`; }
}
exports.VolumeDiscountStrategy = VolumeDiscountStrategy;
// ── Contexto ───────────────────────────────────────────────────────────────────
class DiscountContext {
    strategy;
    constructor(strategy = new NoDiscountStrategy()) {
        this.strategy = strategy;
    }
    setStrategy(s) { this.strategy = s; }
    applyDiscount(subtotal) {
        const amount = this.strategy.calculate(subtotal);
        return {
            subtotal,
            discountAmount: amount,
            total: Math.max(0, +(subtotal - amount).toFixed(2)),
            description: this.strategy.describe()
        };
    }
}
exports.DiscountContext = DiscountContext;
// ── Factory ────────────────────────────────────────────────────────────────────
function createStrategy(coupon) {
    if (!coupon)
        return new NoDiscountStrategy();
    switch (coupon.type) {
        case 'percent': return new PercentDiscountStrategy(coupon.value);
        case 'fixed': return new CouponDiscountStrategy(coupon.value);
        case 'volume': return new VolumeDiscountStrategy(coupon.min_amount, coupon.value);
        default: return new NoDiscountStrategy();
    }
}
//# sourceMappingURL=DiscountStrategy.js.map