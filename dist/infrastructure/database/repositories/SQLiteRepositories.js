"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponSQLiteRepository = exports.ReviewSQLiteRepository = exports.OrderSQLiteRepository = exports.CartSQLiteRepository = exports.CategorySQLiteRepository = exports.ProductSQLiteRepository = exports.UserSQLiteRepository = void 0;
// Adaptadores de Repositorio — better-sqlite3
const SQLiteDatabase_1 = require("../SQLiteDatabase");
const User_1 = require("../../../domain/entities/User");
const DiscountStrategy_1 = require("../../../domain/services/DiscountStrategy");
const LOW_STOCK = 5;
function row(r) { return r; }
function rows(rs) { return rs; }
// ═══════════════════════════ USER ════════════════════════════════════
class UserSQLiteRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    findByEmail(email) {
        return row(this.db.prepare('SELECT * FROM users WHERE email=?').get(email));
    }
    findById(id) {
        const u = row(this.db.prepare('SELECT * FROM users WHERE id=?').get(id));
        return u ? (0, User_1.toPublicUser)(u) : undefined;
    }
    create(data) {
        const r = this.db.prepare("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)")
            .run(data.name, data.email.toLowerCase(), data.password, data.role ?? 'client');
        return this.findById(r.lastInsertRowid);
    }
    update(id, data) {
        if (data.name)
            this.db.prepare('UPDATE users SET name=? WHERE id=?').run(data.name, id);
        if (data.password)
            this.db.prepare('UPDATE users SET password=? WHERE id=?').run(data.password, id);
        return this.findById(id);
    }
}
exports.UserSQLiteRepository = UserSQLiteRepository;
// ═══════════════════════════ PRODUCT ═════════════════════════════════
class ProductSQLiteRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    enrich(p) {
        const cats = rows(this.db.prepare('SELECT c.id,c.name,c.slug FROM categories c JOIN product_categories pc ON pc.category_id=c.id WHERE pc.product_id=?').all(p.id));
        const avg = row(this.db.prepare('SELECT AVG(rating) as avg,COUNT(*) as cnt FROM reviews WHERE product_id=?').get(p.id));
        return { ...p, categories: cats, avg_rating: avg?.avg ? +avg.avg.toFixed(1) : null, review_count: avg?.cnt ?? 0 };
    }
    findAll(f) {
        const { page, limit } = f;
        const offset = (page - 1) * limit;
        const where = ['p.is_active=1'];
        const params = [];
        if (f.q) {
            where.push('(p.name LIKE ? OR p.description LIKE ?)');
            params.push(`%${f.q}%`, `%${f.q}%`);
        }
        if (f.min_price) {
            where.push('p.price>=?');
            params.push(f.min_price);
        }
        if (f.max_price) {
            where.push('p.price<=?');
            params.push(f.max_price);
        }
        let join = '';
        if (f.category) {
            join = 'JOIN product_categories pc ON pc.product_id=p.id JOIN categories c ON c.id=pc.category_id';
            where.push('c.slug=?');
            params.push(f.category);
        }
        const sql = `WHERE ${where.join(' AND ')}`;
        const total = (row(this.db.prepare(`SELECT COUNT(DISTINCT p.id) as n FROM products p ${join} ${sql}`).get(...params))?.n) ?? 0;
        const products = rows(this.db.prepare(`SELECT DISTINCT p.* FROM products p ${join} ${sql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset));
        return { data: products.map(p => this.enrich(p)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
    findById(id) {
        const p = row(this.db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(id));
        return p ? this.enrich(p) : undefined;
    }
    create(data, categoryIds) {
        const r = this.db.prepare('INSERT INTO products (sku,name,description,price,stock,image_url) VALUES (?,?,?,?,?,?)')
            .run(data.sku, data.name, data.description ?? '', data.price, data.stock ?? 0, data.image_url ?? '');
        const id = r.lastInsertRowid;
        if (categoryIds?.length) {
            const ins = this.db.prepare('INSERT OR IGNORE INTO product_categories (product_id,category_id) VALUES (?,?)');
            categoryIds.forEach(c => ins.run(id, c));
        }
        return this.findById(id);
    }
    update(id, data, categoryIds) {
        (0, SQLiteDatabase_1.runTransaction)(this.db, () => {
            this.db.prepare(`UPDATE products SET name=COALESCE(?,name),description=COALESCE(?,description),price=COALESCE(?,price),stock=COALESCE(?,stock),image_url=COALESCE(?,image_url),is_active=COALESCE(?,is_active),updated_at=datetime('now') WHERE id=?`)
                .run(data.name ?? null, data.description ?? null, data.price ?? null, data.stock ?? null, data.image_url ?? null, data.is_active ?? null, id);
            if (categoryIds !== undefined) {
                this.db.prepare('DELETE FROM product_categories WHERE product_id=?').run(id);
                const ins = this.db.prepare('INSERT OR IGNORE INTO product_categories (product_id,category_id) VALUES (?,?)');
                categoryIds.forEach(c => ins.run(id, c));
            }
        });
        return this.findById(id);
    }
    softDelete(id) { this.db.prepare('UPDATE products SET is_active=0 WHERE id=?').run(id); }
}
exports.ProductSQLiteRepository = ProductSQLiteRepository;
// ═══════════════════════════ CATEGORY ════════════════════════════════
class CategorySQLiteRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    findAll() { return rows(this.db.prepare('SELECT * FROM categories ORDER BY name').all()); }
    create(data) {
        const r = this.db.prepare('INSERT INTO categories (name,slug,description) VALUES (?,?,?)').run(data.name, data.slug, data.description ?? '');
        return row(this.db.prepare('SELECT * FROM categories WHERE id=?').get(r.lastInsertRowid));
    }
    update(id, data) {
        this.db.prepare('UPDATE categories SET name=COALESCE(?,name),description=COALESCE(?,description) WHERE id=?').run(data.name ?? null, data.description ?? null, id);
        return row(this.db.prepare('SELECT * FROM categories WHERE id=?').get(id));
    }
    delete(id) { this.db.prepare('DELETE FROM categories WHERE id=?').run(id); }
}
exports.CategorySQLiteRepository = CategorySQLiteRepository;
// ═══════════════════════════ CART ════════════════════════════════════
class CartSQLiteRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    buildSummary(cartId) {
        const items = rows(this.db.prepare('SELECT ci.id,ci.quantity,p.id as product_id,p.name,p.price,p.image_url,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cartId));
        const total = +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
        return { cart_id: cartId, items, total, item_count: items.reduce((s, i) => s + i.quantity, 0) };
    }
    getOrCreate(userId) {
        let cart = row(this.db.prepare('SELECT * FROM carts WHERE user_id=?').get(userId));
        if (!cart) {
            const r = this.db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
            cart = row(this.db.prepare('SELECT * FROM carts WHERE id=?').get(r.lastInsertRowid));
        }
        return cart;
    }
    getItems(cartId) {
        return rows(this.db.prepare('SELECT ci.id,ci.quantity,p.id as product_id,p.name,p.price,p.image_url,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cartId));
    }
    addItem(userId, productId, quantity) {
        const p = row(this.db.prepare('SELECT id,stock FROM products WHERE id=? AND is_active=1').get(productId));
        if (!p)
            throw new Error('Producto no encontrado');
        const cart = this.getOrCreate(userId);
        const existing = row(this.db.prepare('SELECT id,quantity FROM cart_items WHERE cart_id=? AND product_id=?').get(cart.id, productId));
        if (existing) {
            this.db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(Math.min(existing.quantity + quantity, p.stock), existing.id);
        }
        else {
            if (quantity > p.stock)
                throw new Error('Stock insuficiente');
            this.db.prepare('INSERT INTO cart_items (cart_id,product_id,quantity) VALUES (?,?,?)').run(cart.id, productId, quantity);
        }
        return this.buildSummary(cart.id);
    }
    updateItem(userId, itemId, quantity) {
        const cart = this.getOrCreate(userId);
        const item = row(this.db.prepare('SELECT ci.id,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.id=? AND ci.cart_id=?').get(itemId, cart.id));
        if (!item)
            throw new Error('Item no encontrado');
        if (quantity <= 0)
            this.db.prepare('DELETE FROM cart_items WHERE id=?').run(item.id);
        else
            this.db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(Math.min(quantity, item.stock), item.id);
        return this.buildSummary(cart.id);
    }
    removeItem(userId, itemId) {
        const cart = this.getOrCreate(userId);
        const r = this.db.prepare('DELETE FROM cart_items WHERE id=? AND cart_id=?').run(itemId, cart.id);
        if (!r.changes)
            throw new Error('Item no encontrado');
        return this.buildSummary(cart.id);
    }
    clear(userId) {
        const cart = row(this.db.prepare('SELECT * FROM carts WHERE user_id=?').get(userId));
        if (cart)
            this.db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(cart.id);
    }
    syncGuestItems(userId, items) {
        const cart = this.getOrCreate(userId);
        (0, SQLiteDatabase_1.runTransaction)(this.db, () => {
            for (const { product_id, quantity } of items) {
                const p = row(this.db.prepare('SELECT id,stock FROM products WHERE id=? AND is_active=1').get(product_id));
                if (!p)
                    continue;
                const qty = Math.min(quantity, p.stock);
                if (qty <= 0)
                    continue;
                const ex = row(this.db.prepare('SELECT id,quantity FROM cart_items WHERE cart_id=? AND product_id=?').get(cart.id, product_id));
                if (ex)
                    this.db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(Math.min(ex.quantity + qty, p.stock), ex.id);
                else
                    this.db.prepare('INSERT INTO cart_items (cart_id,product_id,quantity) VALUES (?,?,?)').run(cart.id, product_id, qty);
            }
        });
        return this.buildSummary(cart.id);
    }
}
exports.CartSQLiteRepository = CartSQLiteRepository;
// ═══════════════════════════ ORDER ═══════════════════════════════════
class OrderSQLiteRepository {
    db;
    emailService;
    constructor(db, emailService) {
        this.db = db;
        this.emailService = emailService;
    }
    checkout(data, coupon) {
        const cart = row(this.db.prepare('SELECT * FROM carts WHERE user_id=?').get(data.userId));
        if (!cart)
            throw new Error('Carrito vacío');
        const cartItems = rows(this.db.prepare('SELECT ci.quantity,p.id as product_id,p.name,p.price,p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cart.id));
        if (!cartItems.length)
            throw new Error('Carrito vacío');
        for (const item of cartItems) {
            if (item.quantity > item.stock)
                throw new Error(`Stock insuficiente para "${item.name}"`);
        }
        const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
        const ctx = new DiscountStrategy_1.DiscountContext((0, DiscountStrategy_1.createStrategy)(coupon));
        const { total, discountAmount, description } = ctx.applyDiscount(+subtotal.toFixed(2));
        const orderId = (0, SQLiteDatabase_1.runTransaction)(this.db, () => {
            const r = this.db.prepare("INSERT INTO orders (user_id,status,total,shipping_address,payment_method,discount_type,discount_amount,notes) VALUES (?,?,?,?,?,?,?,?)")
                .run(data.userId, 'pending', total, data.shipping_address, data.payment_method ?? 'simulated', coupon?.type ?? null, discountAmount, description);
            const oid = r.lastInsertRowid;
            const insItem = this.db.prepare('INSERT INTO order_items (order_id,product_id,name,price,quantity) VALUES (?,?,?,?,?)');
            for (const item of cartItems) {
                insItem.run(oid, item.product_id, item.name, item.price, item.quantity);
                this.db.prepare("UPDATE products SET stock=stock-?,updated_at=datetime('now') WHERE id=?").run(item.quantity, item.product_id);
                const updated = row(this.db.prepare('SELECT * FROM products WHERE id=?').get(item.product_id));
                if (updated && updated.stock <= LOW_STOCK)
                    this.emailService?.sendLowStockAlert(updated);
            }
            this.db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(cart.id);
            return oid;
        });
        return { order: row(this.db.prepare('SELECT * FROM orders WHERE id=?').get(orderId)), items: rows(this.db.prepare('SELECT * FROM order_items WHERE order_id=?').all(orderId)) };
    }
    findByUser(userId) {
        const orders = rows(this.db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(userId));
        return orders.map(o => ({ ...o, items: rows(this.db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id)) }));
    }
    findAll(status, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const where = status ? 'WHERE o.status=?' : '';
        const params = status ? [status] : [];
        const total = (row(this.db.prepare(`SELECT COUNT(*) as n FROM orders o ${where}`).get(...params))?.n) ?? 0;
        const data = rows(this.db.prepare(`SELECT o.*,u.name as user_name,u.email as user_email FROM orders o JOIN users u ON u.id=o.user_id ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset));
        return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
    findById(id) {
        const order = row(this.db.prepare('SELECT o.*,u.name as user_name,u.email as user_email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=?').get(id));
        if (!order)
            return undefined;
        return { ...order, items: rows(this.db.prepare('SELECT * FROM order_items WHERE order_id=?').all(id)) };
    }
    updateStatus(id, status) {
        this.db.prepare("UPDATE orders SET status=?,updated_at=datetime('now') WHERE id=?").run(status, id);
        return row(this.db.prepare('SELECT * FROM orders WHERE id=?').get(id));
    }
}
exports.OrderSQLiteRepository = OrderSQLiteRepository;
// ═══════════════════════════ REVIEW ══════════════════════════════════
class ReviewSQLiteRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    findByProduct(productId) { return rows(this.db.prepare('SELECT r.*,u.name as user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=? ORDER BY r.created_at DESC').all(productId)); }
    verifyPurchase(productId, userId) { return !!row(this.db.prepare("SELECT oi.id FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.product_id=? AND o.user_id=? AND o.status IN ('delivered','shipped')").get(productId, userId)); }
    create(productId, userId, rating, comment) {
        if (row(this.db.prepare('SELECT id FROM reviews WHERE product_id=? AND user_id=?').get(productId, userId)))
            throw new Error('Ya valoraste este producto');
        const r = this.db.prepare('INSERT INTO reviews (product_id,user_id,rating,comment) VALUES (?,?,?,?)').run(productId, userId, rating, comment ?? '');
        return row(this.db.prepare('SELECT r.*,u.name as user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.id=?').get(r.lastInsertRowid));
    }
    findById(id) { return row(this.db.prepare('SELECT * FROM reviews WHERE id=?').get(id)); }
    delete(id) { this.db.prepare('DELETE FROM reviews WHERE id=?').run(id); }
}
exports.ReviewSQLiteRepository = ReviewSQLiteRepository;
// ═══════════════════════════ COUPON ══════════════════════════════════
class CouponSQLiteRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    findByCode(code) { return row(this.db.prepare("SELECT * FROM coupons WHERE code=? AND active=1 AND (expires_at IS NULL OR expires_at>datetime('now'))").get(code)); }
}
exports.CouponSQLiteRepository = CouponSQLiteRepository;
//# sourceMappingURL=SQLiteRepositories.js.map