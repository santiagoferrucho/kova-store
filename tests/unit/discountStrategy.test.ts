import {
  DiscountContext, CouponDiscountStrategy, PercentDiscountStrategy,
  VolumeDiscountStrategy, NoDiscountStrategy, createStrategy
} from '../../src/domain/services/DiscountStrategy';

describe('Patrón Strategy — Descuentos (TypeScript Strict)', () => {
  describe('NoDiscountStrategy', () => {
    it('no aplica ningún descuento', () => {
      const ctx = new DiscountContext(new NoDiscountStrategy());
      expect(ctx.applyDiscount(50000).discountAmount).toBe(0);
    });
  });
  describe('CouponDiscountStrategy (fijo)', () => {
    it('aplica el valor exacto', () => {
      expect(new DiscountContext(new CouponDiscountStrategy(5000)).applyDiscount(30000).total).toBe(25000);
    });
    it('no puede superar el subtotal', () => {
      expect(new DiscountContext(new CouponDiscountStrategy(999999)).applyDiscount(10000).total).toBe(0);
    });
  });
  describe('PercentDiscountStrategy', () => {
    it('aplica 10% correctamente', () => {
      const r = new DiscountContext(new PercentDiscountStrategy(10)).applyDiscount(100000);
      expect(r.discountAmount).toBe(10000);
    });
  });
  describe('VolumeDiscountStrategy', () => {
    it('no aplica si subtotal < umbral', () => {
      expect(new DiscountContext(new VolumeDiscountStrategy(80000, 15)).applyDiscount(50000).discountAmount).toBe(0);
    });
    it('aplica si subtotal >= umbral', () => {
      expect(new DiscountContext(new VolumeDiscountStrategy(80000, 15)).applyDiscount(100000).discountAmount).toBe(15000);
    });
  });
  describe('createStrategy factory', () => {
    it('sin cupón → NoDiscount', () => expect(createStrategy(undefined)).toBeInstanceOf(NoDiscountStrategy));
    it('type percent → PercentDiscount', () => expect(createStrategy({ id:1,code:'X',type:'percent',value:10,min_amount:0,active:1 })).toBeInstanceOf(PercentDiscountStrategy));
    it('type fixed → CouponDiscount', () => expect(createStrategy({ id:1,code:'X',type:'fixed',value:5000,min_amount:0,active:1 })).toBeInstanceOf(CouponDiscountStrategy));
    it('type volume → VolumeDiscount', () => expect(createStrategy({ id:1,code:'X',type:'volume',value:15,min_amount:80000,active:1 })).toBeInstanceOf(VolumeDiscountStrategy));
  });
  describe('Cambio de estrategia en tiempo de ejecución', () => {
    it('puede intercambiar la estrategia dinámicamente', () => {
      const ctx = new DiscountContext();
      expect(ctx.applyDiscount(100000).discountAmount).toBe(0);
      ctx.setStrategy(new PercentDiscountStrategy(20));
      expect(ctx.applyDiscount(100000).discountAmount).toBe(20000);
    });
  });
});
