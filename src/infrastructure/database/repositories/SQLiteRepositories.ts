// Adaptadores de Repositorio — better-sqlite3
import { Db, runTransaction } from '../SQLiteDatabase';
import { User, PublicUser, toPublicUser } from '../../../domain/entities/User';
import { Product, ProductWithMeta, Category } from '../../../domain/entities/Product';
import { Order, OrderItem, OrderStatus, Cart, CartItemWithProduct, Review, Coupon } from '../../../domain/entities/index';
import {
  IUserRepository, IProductRepository, ICategoryRepository,
  ICartRepository, IOrderRepository, IReviewRepository,
  ICouponRepository, ProductFilter, PaginatedResult,
  CartSummary, CheckoutData
} from '../../../domain/repositories/ports';
import { DiscountContext, createStrategy } from '../../../domain/services/DiscountStrategy';

const LOW_STOCK = 5;

function row<T>(r: unknown): T | undefined { return r as T | undefined; }
function rows<T>(rs: unknown[]): T[] { return rs as T[]; }

// ═══════════════════════════ USER ════════════════════════════════════
export class UserSQLiteRepository implements IUserRepository {
  constructor(private db: Db) {}
  findByEmail(email: string): User | undefined {
    return row<User>(this.db.prepare('SELECT * FROM users WHERE email=?').get(email));
  }
  findById(id: number): PublicUser | undefined {
    const u = row<User>(this.db.prepare('SELECT * FROM users WHERE id=?').get(id));
    return u ? toPublicUser(u) : undefined;
  }
  create(data: { name: string; email: string; password: string; role?: string }): PublicUser {
    const r = this.db.prepare("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)")
      .run(data.name, data.email.toLowerCase(), data.password, data.role ?? 'client');
    return this.findById(r.lastInsertRowid as number)!;
  }
  update(id: number, data: Partial<Pick<User, 'name' | 'password'>>): PublicUser {
    if (data.name) this.db.prepare('UPDATE users SET name=? WHERE id=?').run(data.name, id);
    if (data.password) this.db.prepare('UPDATE users SET password=? WHERE id=?').run(data.password, id);
    return this.findById(id)!;
  }
}

// ═══════════════════════════ PRODUCT ═════════════════════════════════
export class ProductSQLiteRepository implements IProductRepository {
  constructor(private db: Db) {}
  private enrich(p: Product): ProductWithMeta {
    const cats = rows<Category>(this.db.prepare('SELECT c.id,c.name,c.slug FROM categories c JOIN product_categories pc ON pc.category_id=c.id WHERE pc.product_id=?').all(p.id));
    const avg = row<{ avg: number | null; cnt: number }>(this.db.prepare('SELECT AVG(rating) as avg,COUNT(*) as cnt FROM reviews WHERE product_id=?').get(p.id));
    return { ...p, categories: cats, avg_rating: avg?.avg ? +avg.avg.toFixed(1) : null, review_count: avg?.cnt ?? 0 };
  }
  findAll(f: ProductFilter): PaginatedResult<ProductWithMeta> {
    const { page, limit } = f;
    const offset = (page - 1) * limit;
    const where: string[] = ['p.is_active=1'];
    const params: unknown[] = [];
    if (f.q) { where.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${f.q}%`, `%${f.q}%`); }
    if (f.min_price) { where.push('p.price>=?'); params.push(f.min_price); }
    if (f.max_price) { where.push('p.price<=?'); params.push(f.max_price); }
    let join = '';
    if (f.category) { join = 'JOIN product_categories pc ON pc.product_id=p.id JOIN categories c ON c.id=pc.category_id'; where.push('c.slug=?'); params.push(f.category); }
    const sql = `WHERE ${where.join(' AND ')}`;
    const total = (row<{ n: number }>(this.db.prepare(`SELECT COUNT(DISTINCT p.id) as n FROM products p ${join} ${sql}`).get(...params))?.n) ?? 0;
    const products = rows<Product>(this.db.prepare(`SELECT DISTINCT p.* FROM products p ${join} ${sql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset));
    return { data: products.map(p => this.enrich(p)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
  findById(id: number): ProductWithMeta | undefined {
    const p = row<Product>(this.db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(id));
    return p ? this.enrich(p) : undefined;
  }
  create(data: Partial<Product>, categoryIds?: number[]): ProductWithMeta {
    const r = this.db.prepare('INSERT INTO products (sku,name,description,price,stock,image_url) VALUES (?,?,?,?,?,?)')
      .run(data.sku!, data.name!, data.description ?? '', data.price!, data.stock ?? 0, data.image_url ?? '');
    const id = r.lastInsertRowid as number;
    if (categoryIds?.length) {
      const ins = this.db.prepare('INSERT OR IGNORE INTO product_categories (product_id,category_id) VALUES (?,?)');
      categoryIds.forEach(c => ins.run(id, c));
    }
    return this.findById(id)!;
  }
  update(id: number, data: Partial<Product>, categoryIds?: number[]): ProductWithMeta {
    runTransaction(this.db, () => {
      this.db.prepare(`UPDATE products SET name=COALESCE(?,name),description=COALESCE(?,description),price=COALESCE(?,price),stock=COALESCE(?,stock),image_url=COALESCE(?,image_url),is_active=COALESCE(?,is_active),updated_at=datetime('now') WHERE id=?`)
        .run(data.name??null,data.description??null,data.price??null,data.stock??null,data.image_url??null,data.is_active??null,id);
      if (categoryIds !== undefined) {
        this.db.prepare('DELETE FROM product_categories WHERE product_id=?').run(id);
        const ins = this.db.prepare('INSERT OR IGNORE INTO product_categories (product_id,category_id) VALUES (?,?)');
        categoryIds.forEach(c => ins.run(id, c));
      }
    });
    return this.findById(id)!;
  }
  softDelete(id: number): void { this.db.prepare('UPDATE products SET is_active=0 WHERE id=?').run(id); }
}

// ═══════════════════════════ CATEGORY ════════════════════════════════
export class CategorySQLiteRepository implements ICategoryRepository {
  constructor(private db: Db) {}
  findAll(): Category[] { return rows<Category>(this.db.prepare('SELECT * FROM categories ORDER BY name').all()); }
  create(data: Pick<Category,'name'|'slug'|'description'>): Category {
    const r = this.db.prepare('INSERT INTO categories (name,slug,description) VALUES (?,?,?)').run(data.name,data.slug,data.description??'');
    return row<Category>(this.db.prepare('SELECT * FROM categories WHERE id=?').get(r.lastInsertRowid as number))!;
  }
  update(id: number, data: Partial<Pick<Category,'name'|'description'>>): Category {
    this.db.prepare('UPDATE categories SET name=COALESCE(?,name),description=COALESCE(?,description) WHERE id=?').run(data.name??null,data.description??null,id);
    return row<Category>(this.db.prepare('SELECT * FROM categories WHERE id=?').get(id))!;
  }
  delete(id: number): void { this.db.prepare('DELETE FROM categories WHERE id=?').run(id); }
}

// ═══════════════════════════ CART ════════════════════════════════════
export class CartSQLiteRepository implements ICartRepository {
  constructor(private db: Db) {}
  private buildSummary(cartId: number): CartSummary {
    const items = rows<CartItemWithProduct>(this.db.prepare('SELECT ci.id,ci.quantity,p.id as product_id,p.name,p.price,p.image_url,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cartId));
    const total = +items.reduce((s,i)=>s+i.price*i.quantity,0).toFixed(2);
    return { cart_id: cartId, items, total, item_count: items.reduce((s,i)=>s+i.quantity,0) };
  }
  getOrCreate(userId: number): Cart {
    let cart = row<Cart>(this.db.prepare('SELECT * FROM carts WHERE user_id=?').get(userId));
    if (!cart) { const r = this.db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId); cart = row<Cart>(this.db.prepare('SELECT * FROM carts WHERE id=?').get(r.lastInsertRowid as number))!; }
    return cart;
  }
  getItems(cartId: number): CartItemWithProduct[] {
    return rows<CartItemWithProduct>(this.db.prepare('SELECT ci.id,ci.quantity,p.id as product_id,p.name,p.price,p.image_url,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cartId));
  }
  addItem(userId: number, productId: number, quantity: number): CartSummary {
    const p = row<Product>(this.db.prepare('SELECT id,stock FROM products WHERE id=? AND is_active=1').get(productId));
    if (!p) throw new Error('Producto no encontrado');
    const cart = this.getOrCreate(userId);
    const existing = row<{id:number;quantity:number}>(this.db.prepare('SELECT id,quantity FROM cart_items WHERE cart_id=? AND product_id=?').get(cart.id,productId));
    if (existing) { this.db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(Math.min(existing.quantity+quantity,p.stock),existing.id); }
    else { if (quantity>p.stock) throw new Error('Stock insuficiente'); this.db.prepare('INSERT INTO cart_items (cart_id,product_id,quantity) VALUES (?,?,?)').run(cart.id,productId,quantity); }
    return this.buildSummary(cart.id);
  }
  updateItem(userId: number, itemId: number, quantity: number): CartSummary {
    const cart = this.getOrCreate(userId);
    const item = row<{id:number;stock:number}>(this.db.prepare('SELECT ci.id,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.id=? AND ci.cart_id=?').get(itemId,cart.id));
    if (!item) throw new Error('Item no encontrado');
    if (quantity<=0) this.db.prepare('DELETE FROM cart_items WHERE id=?').run(item.id);
    else this.db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(Math.min(quantity,item.stock),item.id);
    return this.buildSummary(cart.id);
  }
  removeItem(userId: number, itemId: number): CartSummary {
    const cart = this.getOrCreate(userId);
    const r = this.db.prepare('DELETE FROM cart_items WHERE id=? AND cart_id=?').run(itemId,cart.id);
    if (!r.changes) throw new Error('Item no encontrado');
    return this.buildSummary(cart.id);
  }
  clear(userId: number): void {
    const cart = row<Cart>(this.db.prepare('SELECT * FROM carts WHERE user_id=?').get(userId));
    if (cart) this.db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(cart.id);
  }
  syncGuestItems(userId: number, items: {product_id:number;quantity:number}[]): CartSummary {
    const cart = this.getOrCreate(userId);
    runTransaction(this.db, () => {
      for (const {product_id,quantity} of items) {
        const p = row<Product>(this.db.prepare('SELECT id,stock FROM products WHERE id=? AND is_active=1').get(product_id));
        if (!p) continue;
        const qty = Math.min(quantity,p.stock); if (qty<=0) continue;
        const ex = row<{id:number;quantity:number}>(this.db.prepare('SELECT id,quantity FROM cart_items WHERE cart_id=? AND product_id=?').get(cart.id,product_id));
        if (ex) this.db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(Math.min(ex.quantity+qty,p.stock),ex.id);
        else this.db.prepare('INSERT INTO cart_items (cart_id,product_id,quantity) VALUES (?,?,?)').run(cart.id,product_id,qty);
      }
    });
    return this.buildSummary(cart.id);
  }
}

// ═══════════════════════════ ORDER ═══════════════════════════════════
export class OrderSQLiteRepository implements IOrderRepository {
  constructor(private db: Db, private emailService?: {sendLowStockAlert:(p:Product)=>void}) {}
  checkout(data: CheckoutData, coupon: Coupon | undefined): {order:Order;items:OrderItem[]} {
    const cart = row<Cart>(this.db.prepare('SELECT * FROM carts WHERE user_id=?').get(data.userId));
    if (!cart) throw new Error('Carrito vacío');
    type CartRow = {quantity:number;product_id:number;name:string;price:number;stock:number};
    const cartItems = rows<CartRow>(this.db.prepare('SELECT ci.quantity,p.id as product_id,p.name,p.price,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cart.id));
    if (!cartItems.length) throw new Error('Carrito vacío');
    for (const item of cartItems) { if (item.quantity>item.stock) throw new Error(`Stock insuficiente para "${item.name}"`); }
    const subtotal = cartItems.reduce((s,i)=>s+i.price*i.quantity,0);
    const ctx = new DiscountContext(createStrategy(coupon));
    const {total,discountAmount,description} = ctx.applyDiscount(+subtotal.toFixed(2));
    const orderId = runTransaction(this.db, (): number => {
      const r = this.db.prepare("INSERT INTO orders (user_id,status,total,shipping_address,payment_method,discount_type,discount_amount,notes) VALUES (?,?,?,?,?,?,?,?)")
        .run(data.userId,'pending',total,data.shipping_address,data.payment_method??'simulated',coupon?.type??null,discountAmount,description);
      const oid = r.lastInsertRowid as number;
      const insItem = this.db.prepare('INSERT INTO order_items (order_id,product_id,name,price,quantity) VALUES (?,?,?,?,?)');
      for (const item of cartItems) {
        insItem.run(oid,item.product_id,item.name,item.price,item.quantity);
        this.db.prepare("UPDATE products SET stock=stock-?,updated_at=datetime('now') WHERE id=?").run(item.quantity,item.product_id);
        const updated = row<Product>(this.db.prepare('SELECT * FROM products WHERE id=?').get(item.product_id));
        if (updated && updated.stock<=LOW_STOCK) this.emailService?.sendLowStockAlert(updated);
      }
      this.db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(cart.id);
      return oid;
    });
    return { order: row<Order>(this.db.prepare('SELECT * FROM orders WHERE id=?').get(orderId))!, items: rows<OrderItem>(this.db.prepare('SELECT * FROM order_items WHERE order_id=?').all(orderId)) };
  }
  findByUser(userId: number) {
    const orders = rows<Order>(this.db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(userId));
    return orders.map(o=>({...o,items:rows<OrderItem>(this.db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id))}));
  }
  findAll(status?: string, page=1, limit=20): PaginatedResult<Order&{user_name:string;user_email:string}> {
    const offset=(page-1)*limit;
    const where=status?'WHERE o.status=?':'';
    const params: unknown[]=status?[status]:[];
    const total=(row<{n:number}>(this.db.prepare(`SELECT COUNT(*) as n FROM orders o ${where}`).get(...params))?.n)??0;
    const data=rows<Order&{user_name:string;user_email:string}>(this.db.prepare(`SELECT o.*,u.name as user_name,u.email as user_email FROM orders o JOIN users u ON u.id=o.user_id ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).all(...params,limit,offset));
    return {data,pagination:{page,limit,total,pages:Math.ceil(total/limit)}};
  }
  findById(id: number) {
    const order=row<Order&{user_name:string;user_email:string}>(this.db.prepare('SELECT o.*,u.name as user_name,u.email as user_email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?').get(id));
    if (!order) return undefined;
    return {...order,items:rows<OrderItem>(this.db.prepare('SELECT * FROM order_items WHERE order_id=?').all(id))};
  }
  updateStatus(id: number, status: OrderStatus): Order {
    this.db.prepare("UPDATE orders SET status=?,updated_at=datetime('now') WHERE id=?").run(status,id);
    return row<Order>(this.db.prepare('SELECT * FROM orders WHERE id=?').get(id))!;
  }
}

// ═══════════════════════════ REVIEW ══════════════════════════════════
export class ReviewSQLiteRepository implements IReviewRepository {
  constructor(private db: Db) {}
  findByProduct(productId: number): Review[] { return rows<Review>(this.db.prepare('SELECT r.*,u.name as user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=? ORDER BY r.created_at DESC').all(productId)); }
  verifyPurchase(productId: number, userId: number): boolean { return !!row(this.db.prepare("SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.product_id=? AND o.user_id=? AND o.status IN ('delivered','shipped')").get(productId,userId)); }
  create(productId: number, userId: number, rating: number, comment?: string): Review {
    if (row(this.db.prepare('SELECT id FROM reviews WHERE product_id=? AND user_id=?').get(productId,userId))) throw new Error('Ya valoraste este producto');
    const r=this.db.prepare('INSERT INTO reviews (product_id,user_id,rating,comment) VALUES (?,?,?,?)').run(productId,userId,rating,comment??'');
    return row<Review>(this.db.prepare('SELECT r.*,u.name as user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.id=?').get(r.lastInsertRowid as number))!;
  }
  findById(id: number): Review | undefined { return row<Review>(this.db.prepare('SELECT * FROM reviews WHERE id=?').get(id)); }
  delete(id: number): void { this.db.prepare('DELETE FROM reviews WHERE id=?').run(id); }
}

// ═══════════════════════════ COUPON ══════════════════════════════════
export class CouponSQLiteRepository implements ICouponRepository {
  constructor(private db: Db) {}
  findByCode(code: string): Coupon | undefined { return row<Coupon>(this.db.prepare("SELECT * FROM coupons WHERE code=? AND active=1 AND (expires_at IS NULL OR expires_at>datetime('now'))").get(code)); }
}
