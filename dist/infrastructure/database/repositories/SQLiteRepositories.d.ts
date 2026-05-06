import { Db } from '../SQLiteDatabase';
import { User, PublicUser } from '../../../domain/entities/User';
import { Product, ProductWithMeta, Category } from '../../../domain/entities/Product';
import { Order, OrderItem, OrderStatus, Cart, CartItemWithProduct, Review, Coupon } from '../../../domain/entities/index';
import { IUserRepository, IProductRepository, ICategoryRepository, ICartRepository, IOrderRepository, IReviewRepository, ICouponRepository, ProductFilter, PaginatedResult, CartSummary, CheckoutData } from '../../../domain/repositories/ports';
export declare class UserSQLiteRepository implements IUserRepository {
    private db;
    constructor(db: Db);
    findByEmail(email: string): User | undefined;
    findById(id: number): PublicUser | undefined;
    create(data: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }): PublicUser;
    update(id: number, data: Partial<Pick<User, 'name' | 'password'>>): PublicUser;
}
export declare class ProductSQLiteRepository implements IProductRepository {
    private db;
    constructor(db: Db);
    private enrich;
    findAll(f: ProductFilter): PaginatedResult<ProductWithMeta>;
    findById(id: number): ProductWithMeta | undefined;
    create(data: Partial<Product>, categoryIds?: number[]): ProductWithMeta;
    update(id: number, data: Partial<Product>, categoryIds?: number[]): ProductWithMeta;
    softDelete(id: number): void;
}
export declare class CategorySQLiteRepository implements ICategoryRepository {
    private db;
    constructor(db: Db);
    findAll(): Category[];
    create(data: Pick<Category, 'name' | 'slug' | 'description'>): Category;
    update(id: number, data: Partial<Pick<Category, 'name' | 'description'>>): Category;
    delete(id: number): void;
}
export declare class CartSQLiteRepository implements ICartRepository {
    private db;
    constructor(db: Db);
    private buildSummary;
    getOrCreate(userId: number): Cart;
    getItems(cartId: number): CartItemWithProduct[];
    addItem(userId: number, productId: number, quantity: number): CartSummary;
    updateItem(userId: number, itemId: number, quantity: number): CartSummary;
    removeItem(userId: number, itemId: number): CartSummary;
    clear(userId: number): void;
    syncGuestItems(userId: number, items: {
        product_id: number;
        quantity: number;
    }[]): CartSummary;
}
export declare class OrderSQLiteRepository implements IOrderRepository {
    private db;
    private emailService?;
    constructor(db: Db, emailService?: {
        sendLowStockAlert: (p: Product) => void;
    } | undefined);
    checkout(data: CheckoutData, coupon: Coupon | undefined): {
        order: Order;
        items: OrderItem[];
    };
    findByUser(userId: number): {
        items: OrderItem[];
        id: number;
        user_id: number;
        status: OrderStatus;
        total: number;
        shipping_address: string;
        payment_method: string;
        discount_type?: string | null;
        discount_amount: number;
        notes?: string | null;
        created_at: string;
        updated_at: string;
    }[];
    findAll(status?: string, page?: number, limit?: number): PaginatedResult<Order & {
        user_name: string;
        user_email: string;
    }>;
    findById(id: number): {
        items: OrderItem[];
        id: number;
        user_id: number;
        status: OrderStatus;
        total: number;
        shipping_address: string;
        payment_method: string;
        discount_type?: string | null;
        discount_amount: number;
        notes?: string | null;
        created_at: string;
        updated_at: string;
        user_name: string;
        user_email: string;
    } | undefined;
    updateStatus(id: number, status: OrderStatus): Order;
}
export declare class ReviewSQLiteRepository implements IReviewRepository {
    private db;
    constructor(db: Db);
    findByProduct(productId: number): Review[];
    verifyPurchase(productId: number, userId: number): boolean;
    create(productId: number, userId: number, rating: number, comment?: string): Review;
    findById(id: number): Review | undefined;
    delete(id: number): void;
}
export declare class CouponSQLiteRepository implements ICouponRepository {
    private db;
    constructor(db: Db);
    findByCode(code: string): Coupon | undefined;
}
//# sourceMappingURL=SQLiteRepositories.d.ts.map