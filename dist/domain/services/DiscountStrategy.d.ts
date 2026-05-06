import { Coupon } from '../entities/index';
export interface DiscountResult {
    subtotal: number;
    discountAmount: number;
    total: number;
    description: string;
}
export interface IDiscountStrategy {
    calculate(subtotal: number): number;
    describe(): string;
}
export declare class NoDiscountStrategy implements IDiscountStrategy {
    calculate(_subtotal: number): number;
    describe(): string;
}
export declare class CouponDiscountStrategy implements IDiscountStrategy {
    private readonly value;
    constructor(value: number);
    calculate(subtotal: number): number;
    describe(): string;
}
export declare class PercentDiscountStrategy implements IDiscountStrategy {
    private readonly percent;
    constructor(percent: number);
    calculate(subtotal: number): number;
    describe(): string;
}
export declare class VolumeDiscountStrategy implements IDiscountStrategy {
    private readonly threshold;
    private readonly percent;
    constructor(threshold: number, percent: number);
    calculate(subtotal: number): number;
    describe(): string;
}
export declare class DiscountContext {
    private strategy;
    constructor(strategy?: IDiscountStrategy);
    setStrategy(s: IDiscountStrategy): void;
    applyDiscount(subtotal: number): DiscountResult;
}
export declare function createStrategy(coupon?: Coupon): IDiscountStrategy;
//# sourceMappingURL=DiscountStrategy.d.ts.map