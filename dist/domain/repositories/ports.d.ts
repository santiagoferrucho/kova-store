import { User, PublicUser } from '../entities/User';
import { Product, ProductWithMeta, Category } from '../entities/Product';
import { Order, OrderItem, OrderStatus, Cart, CartItemWithProduct, Review, Coupon } from '../entities/index';
export interface IUserRepository {
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
export interface ProductFilter {
    q?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    page: number;
    limit: number;
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
export interface IProductRepository {
    findAll(filter: ProductFilter): PaginatedResult<ProductWithMeta>;
    findById(id: number): ProductWithMeta | undefined;
    create(data: Partial<Product>, categoryIds?: number[]): ProductWithMeta;
    update(id: number, data: Partial<Product>, categoryIds?: number[]): ProductWithMeta;
    softDelete(id: number): void;
}
export interface ICategoryRepository {
    findAll(): Category[];
    create(data: Pick<Category, 'name' | 'slug' | 'description'>): Category;
    update(id: number, data: Partial<Pick<Category, 'name' | 'description'>>): Category;
    delete(id: number): void;
}
export interface CartSummary {
    cart_id: number;
    items: CartItemWithProduct[];
    total: number;
    item_count: number;
}
export interface ICartRepository {
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
export interface CheckoutData {
    userId: number;
    shipping_address: string;
    payment_method?: string;
    coupon_code?: string;
}
export interface IOrderRepository {
    checkout(data: CheckoutData, coupon: Coupon | undefined): {
        order: Order;
        items: OrderItem[];
    };
    findByUser(userId: number): (Order & {
        items: OrderItem[];
    })[];
    findAll(status?: string, page?: number, limit?: number): PaginatedResult<Order & {
        user_name: string;
        user_email: string;
    }>;
    findById(id: number): (Order & {
        user_name: string;
        user_email: string;
        items: OrderItem[];
    }) | undefined;
    updateStatus(id: number, status: OrderStatus): Order;
}
export interface IReviewRepository {
    findByProduct(productId: number): Review[];
    create(productId: number, userId: number, rating: number, comment?: string): Review;
    verifyPurchase(productId: number, userId: number): boolean;
    delete(id: number): void;
    findById(id: number): Review | undefined;
}
export interface ICouponRepository {
    findByCode(code: string): Coupon | undefined;
}
export interface IEmailService {
    sendRegistrationConfirmation(user: PublicUser): void;
    sendOrderConfirmation(order: Order, user: PublicUser): void;
    sendOrderStatusUpdate(order: Order, user: PublicUser): void;
    sendLowStockAlert(product: Product): void;
}
//# sourceMappingURL=ports.d.ts.map