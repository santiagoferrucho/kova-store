import { UserSQLiteRepository, ProductSQLiteRepository, CategorySQLiteRepository, CartSQLiteRepository, OrderSQLiteRepository, ReviewSQLiteRepository, CouponSQLiteRepository } from './infrastructure/database/repositories/SQLiteRepositories';
import { FileEmailAdapter } from './infrastructure/email/FileEmailAdapter';
export interface Container {
    users: UserSQLiteRepository;
    products: ProductSQLiteRepository;
    categories: CategorySQLiteRepository;
    cart: CartSQLiteRepository;
    orders: OrderSQLiteRepository;
    reviews: ReviewSQLiteRepository;
    coupons: CouponSQLiteRepository;
    email: FileEmailAdapter;
}
export declare function getContainer(): Container;
export declare function resetContainer(): void;
//# sourceMappingURL=container.d.ts.map