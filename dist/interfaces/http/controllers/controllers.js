"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = exports.orderController = exports.cartController = exports.categoryController = exports.productController = exports.authController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const xss_1 = __importDefault(require("xss"));
const container_1 = require("../../../container");
const auth_1 = require("../middleware/auth");
const index_1 = require("../../../domain/entities/index");
function clean(v) { return (0, xss_1.default)(String(v ?? '')); }
// ═══════════════════════════════ AUTH ════════════════════════════════════════
exports.authController = {
    register(req, res) {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: 'name, email y password requeridos' });
            return;
        }
        if (String(password).length < 6) {
            res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });
            return;
        }
        const { users, email: emailSvc } = (0, container_1.getContainer)();
        if (users.findByEmail(clean(email))) {
            res.status(409).json({ error: 'Email ya registrado' });
            return;
        }
        const hash = bcryptjs_1.default.hashSync(String(password), 10);
        const user = users.create({ name: clean(name), email: clean(email), password: hash });
        emailSvc.sendRegistrationConfirmation(user);
        const token = (0, auth_1.signToken)({ id: user.id, email: user.email, role: user.role, name: user.name });
        res.status(201).json({ token, user });
    },
    login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'email y password requeridos' });
            return;
        }
        const { users } = (0, container_1.getContainer)();
        const user = users.findByEmail(clean(email));
        if (!user || !bcryptjs_1.default.compareSync(String(password), user.password)) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const { password: _p, ...safe } = user;
        const token = (0, auth_1.signToken)({ id: safe.id, email: safe.email, role: safe.role, name: safe.name });
        res.json({ token, user: safe });
    },
    me(req, res) {
        const user = (0, container_1.getContainer)().users.findById(req.user.id);
        if (!user) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        res.json(user);
    },
    updateProfile(req, res) {
        const { name, password } = req.body;
        const data = {};
        if (name)
            data.name = clean(name);
        if (password) {
            if (String(password).length < 6) {
                res.status(400).json({ error: 'Contraseña muy corta' });
                return;
            }
            data.password = bcryptjs_1.default.hashSync(String(password), 10);
        }
        res.json((0, container_1.getContainer)().users.update(req.user.id, data));
    },
    forgotPassword(req, res) {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'email requerido' });
            return;
        }
        const { users, email: emailSvc } = (0, container_1.getContainer)();
        const user = users.findByEmail(clean(email));
        // Simulated — always responds OK (security: don't leak email existence)
        if (user) {
            const tempPwd = Math.random().toString(36).slice(-8);
            const hash = bcryptjs_1.default.hashSync(tempPwd, 10);
            users.update(user.id, { password: hash });
            emailSvc.sendRegistrationConfirmation({ ...user, name: user.name });
        }
        res.json({ message: 'Si el email existe, recibirás instrucciones de recuperación (simulado — revisa logs/email.log)' });
    }
};
// ════════════════════════════ PRODUCTS ═══════════════════════════════════════
exports.productController = {
    list(req, res) {
        const { q, category, min_price, max_price, page = '1', limit = '12' } = req.query;
        const filter = {
            q: q ? clean(String(q)) : undefined,
            category: category ? clean(String(category)) : undefined,
            min_price: min_price ? parseFloat(String(min_price)) : undefined,
            max_price: max_price ? parseFloat(String(max_price)) : undefined,
            page: Math.max(1, parseInt(String(page)) || 1),
            limit: Math.min(50, Math.max(1, parseInt(String(limit)) || 12))
        };
        res.json((0, container_1.getContainer)().products.findAll(filter));
    },
    getById(req, res) {
        const p = (0, container_1.getContainer)().products.findById(parseInt(req.params.id));
        if (!p) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }
        res.json(p);
    },
    create(req, res) {
        const { sku, name, description, price, stock, image_url, categories } = req.body;
        if (!sku || !name || !price) {
            res.status(400).json({ error: 'sku, name y price requeridos' });
            return;
        }
        try {
            const p = (0, container_1.getContainer)().products.create({ sku: clean(sku), name: clean(name), description: description ? clean(description) : '', price: parseFloat(price), stock: parseInt(stock) || 0, image_url: image_url ? clean(image_url) : '' }, Array.isArray(categories) ? categories.map(Number) : []);
            res.status(201).json(p);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    },
    update(req, res) {
        const id = parseInt(req.params.id);
        if (!(0, container_1.getContainer)().products.findById(id)) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }
        const { name, description, price, stock, image_url, is_active, categories } = req.body;
        const data = {};
        if (name)
            data.name = clean(name);
        if (description !== undefined)
            data.description = clean(description);
        if (price !== undefined)
            data.price = parseFloat(price);
        if (stock !== undefined)
            data.stock = parseInt(stock);
        if (image_url !== undefined)
            data.image_url = clean(image_url);
        if (is_active !== undefined)
            data.is_active = is_active;
        res.json((0, container_1.getContainer)().products.update(id, data, Array.isArray(categories) ? categories.map(Number) : undefined));
    },
    remove(req, res) {
        const id = parseInt(req.params.id);
        if (!(0, container_1.getContainer)().products.findById(id)) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }
        (0, container_1.getContainer)().products.softDelete(id);
        res.json({ message: 'Producto eliminado' });
    }
};
// ═══════════════════════════ CATEGORIES ══════════════════════════════════════
exports.categoryController = {
    list(_req, res) { res.json((0, container_1.getContainer)().categories.findAll()); },
    create(req, res) {
        const { name, slug, description } = req.body;
        if (!name || !slug) {
            res.status(400).json({ error: 'name y slug requeridos' });
            return;
        }
        try {
            res.status(201).json((0, container_1.getContainer)().categories.create({ name: clean(name), slug: clean(slug), description: description ? clean(description) : '' }));
        }
        catch {
            res.status(409).json({ error: 'Nombre o slug duplicado' });
        }
    },
    update(req, res) {
        try {
            res.json((0, container_1.getContainer)().categories.update(parseInt(req.params.id), req.body));
        }
        catch {
            res.status(404).json({ error: 'Categoría no encontrada' });
        }
    },
    remove(req, res) {
        try {
            (0, container_1.getContainer)().categories.delete(parseInt(req.params.id));
            res.json({ message: 'Categoría eliminada' });
        }
        catch {
            res.status(404).json({ error: 'Categoría no encontrada' });
        }
    }
};
// ════════════════════════════ CART ═══════════════════════════════════════════
exports.cartController = {
    get(req, res) {
        const { cart } = (0, container_1.getContainer)();
        const c = cart.getOrCreate(req.user.id);
        const items = cart.getItems(c.id);
        const total = +items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2);
        res.json({ cart_id: c.id, items, total, item_count: items.reduce((s, i) => s + i.quantity, 0) });
    },
    sync(req, res) {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            res.status(400).json({ error: 'items debe ser un arreglo' });
            return;
        }
        res.json((0, container_1.getContainer)().cart.syncGuestItems(req.user.id, items));
    },
    addItem(req, res) {
        const { product_id, quantity = 1 } = req.body;
        if (!product_id) {
            res.status(400).json({ error: 'product_id requerido' });
            return;
        }
        try {
            res.json((0, container_1.getContainer)().cart.addItem(req.user.id, parseInt(product_id), parseInt(quantity) || 1));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    },
    updateItem(req, res) {
        try {
            res.json((0, container_1.getContainer)().cart.updateItem(req.user.id, parseInt(req.params.itemId), parseInt(req.body.quantity)));
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    },
    removeItem(req, res) {
        try {
            res.json((0, container_1.getContainer)().cart.removeItem(req.user.id, parseInt(req.params.itemId)));
        }
        catch (e) {
            res.status(404).json({ error: e.message });
        }
    },
    clear(req, res) {
        (0, container_1.getContainer)().cart.clear(req.user.id);
        res.json({ message: 'Carrito vaciado' });
    }
};
// ═══════════════════════════ ORDERS ══════════════════════════════════════════
exports.orderController = {
    checkout(req, res) {
        const { shipping_address, payment_method, coupon_code } = req.body;
        if (!shipping_address) {
            res.status(400).json({ error: 'shipping_address requerido' });
            return;
        }
        const { orders, coupons } = (0, container_1.getContainer)();
        let coupon = undefined;
        if (coupon_code) {
            coupon = coupons.findByCode(clean(coupon_code));
            if (!coupon) {
                res.status(400).json({ error: 'Cupón inválido o expirado' });
                return;
            }
        }
        try {
            const result = orders.checkout({ userId: req.user.id, shipping_address: clean(shipping_address), payment_method }, coupon);
            res.status(201).json(result);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    },
    myOrders(req, res) { res.json((0, container_1.getContainer)().orders.findByUser(req.user.id)); },
    adminList(req, res) {
        const { status, page, limit } = req.query;
        res.json((0, container_1.getContainer)().orders.findAll(status ? String(status) : undefined, parseInt(String(page || 1)), parseInt(String(limit || 20))));
    },
    adminGetOne(req, res) {
        const o = (0, container_1.getContainer)().orders.findById(parseInt(req.params.id));
        if (!o) {
            res.status(404).json({ error: 'Pedido no encontrado' });
            return;
        }
        res.json(o);
    },
    updateStatus(req, res) {
        const { status } = req.body;
        if (!index_1.ORDER_STATUSES.includes(status)) {
            res.status(400).json({ error: 'Estado inválido' });
            return;
        }
        const { orders, email } = (0, container_1.getContainer)();
        const order = orders.findById(parseInt(req.params.id));
        if (!order) {
            res.status(404).json({ error: 'Pedido no encontrado' });
            return;
        }
        const updated = orders.updateStatus(order.id, status);
        const user = (0, container_1.getContainer)().users.findById(order.user_id);
        if (user)
            email.sendOrderStatusUpdate(updated, user);
        res.json(updated);
    }
};
// ═══════════════════════════ REVIEWS ═════════════════════════════════════════
exports.reviewController = {
    getByProduct(req, res) {
        res.json((0, container_1.getContainer)().reviews.findByProduct(parseInt(req.params.productId)));
    },
    create(req, res) {
        const { rating, comment } = req.body;
        const productId = parseInt(req.params.productId);
        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({ error: 'rating entre 1 y 5' });
            return;
        }
        const { reviews } = (0, container_1.getContainer)();
        if (!reviews.verifyPurchase(productId, req.user.id)) {
            res.status(403).json({ error: 'Solo puedes valorar productos que hayas comprado' });
            return;
        }
        try {
            res.status(201).json(reviews.create(productId, req.user.id, parseInt(rating), comment ? clean(comment) : undefined));
        }
        catch (e) {
            res.status(409).json({ error: e.message });
        }
    },
    remove(req, res) {
        const { reviews } = (0, container_1.getContainer)();
        const review = reviews.findById(parseInt(req.params.id));
        if (!review) {
            res.status(404).json({ error: 'Valoración no encontrada' });
            return;
        }
        if (req.user.role !== 'admin' && review.user_id !== req.user.id) {
            res.status(403).json({ error: 'Acceso denegado' });
            return;
        }
        reviews.delete(review.id);
        res.json({ message: 'Valoración eliminada' });
    }
};
//# sourceMappingURL=controllers.js.map