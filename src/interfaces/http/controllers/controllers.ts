import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import xss from 'xss';
import { getContainer } from '../../../container';
import { signToken } from '../middleware/auth';
import { ORDER_STATUSES, CartItemWithProduct } from '../../../domain/entities/index';

function clean(v: unknown): string { return xss(String(v ?? '')); }

// ═══════════════════════════════ AUTH ════════════════════════════════════════
export const authController = {
  register(req: Request, res: Response): void {
    const { name, email, password } = req.body;
    if (!name || !email || !password) { res.status(400).json({ error: 'name, email y password requeridos' }); return; }
    if (String(password).length < 6) { res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' }); return; }
    const { users, email: emailSvc } = getContainer();
    if (users.findByEmail(clean(email))) { res.status(409).json({ error: 'Email ya registrado' }); return; }
    const hash = bcrypt.hashSync(String(password), 10);
    const user = users.create({ name: clean(name), email: clean(email), password: hash });
    emailSvc.sendRegistrationConfirmation(user);
    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.status(201).json({ token, user });
  },

  login(req: Request, res: Response): void {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'email y password requeridos' }); return; }
    const { users } = getContainer();
    const user = users.findByEmail(clean(email));
    if (!user || !bcrypt.compareSync(String(password), user.password)) { res.status(401).json({ error: 'Credenciales inválidas' }); return; }
    const { password: _p, ...safe } = user;
    const token = signToken({ id: safe.id, email: safe.email, role: safe.role, name: safe.name });
    res.json({ token, user: safe });
  },

  me(req: Request, res: Response): void {
    const user = getContainer().users.findById(req.user!.id);
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    res.json(user);
  },

  updateProfile(req: Request, res: Response): void {
    const { name, password } = req.body;
    const data: { name?: string; password?: string } = {};
    if (name) data.name = clean(name);
    if (password) {
      if (String(password).length < 6) { res.status(400).json({ error: 'Contraseña muy corta' }); return; }
      data.password = bcrypt.hashSync(String(password), 10);
    }
    res.json(getContainer().users.update(req.user!.id, data));
  },

  forgotPassword(req: Request, res: Response): void {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'email requerido' }); return; }
    const { users, email: emailSvc } = getContainer();
    const user = users.findByEmail(clean(email));
    // Simulated — always responds OK (security: don't leak email existence)
    if (user) {
      const tempPwd = Math.random().toString(36).slice(-8);
      const hash = bcrypt.hashSync(tempPwd, 10);
      users.update(user.id, { password: hash });
      emailSvc.sendRegistrationConfirmation({ ...user, name: user.name });
    }
    res.json({ message: 'Si el email existe, recibirás instrucciones de recuperación (simulado — revisa logs/email.log)' });
  }
};

// ════════════════════════════ PRODUCTS ═══════════════════════════════════════
export const productController = {
  list(req: Request, res: Response): void {
    const { q, category, min_price, max_price, page = '1', limit = '12' } = req.query;
    const filter = {
      q: q ? clean(String(q)) : undefined,
      category: category ? clean(String(category)) : undefined,
      min_price: min_price ? parseFloat(String(min_price)) : undefined,
      max_price: max_price ? parseFloat(String(max_price)) : undefined,
      page: Math.max(1, parseInt(String(page)) || 1),
      limit: Math.min(50, Math.max(1, parseInt(String(limit)) || 12))
    };
    res.json(getContainer().products.findAll(filter));
  },

  getById(req: Request, res: Response): void {
    const p = getContainer().products.findById(parseInt(req.params.id));
    if (!p) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    res.json(p);
  },

  create(req: Request, res: Response): void {
    const { sku, name, description, price, stock, image_url, categories } = req.body;
    if (!sku || !name || !price) { res.status(400).json({ error: 'sku, name y price requeridos' }); return; }
    try {
      const p = getContainer().products.create(
        { sku: clean(sku), name: clean(name), description: description ? clean(description) : '', price: parseFloat(price), stock: parseInt(stock) || 0, image_url: image_url ? clean(image_url) : '' },
        Array.isArray(categories) ? categories.map(Number) : []
      );
      res.status(201).json(p);
    } catch (e: unknown) { res.status(400).json({ error: (e as Error).message }); }
  },

  update(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    if (!getContainer().products.findById(id)) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    const { name, description, price, stock, image_url, is_active, categories } = req.body;
    const data: Record<string, unknown> = {};
    if (name) data.name = clean(name);
    if (description !== undefined) data.description = clean(description);
    if (price !== undefined) data.price = parseFloat(price);
    if (stock !== undefined) data.stock = parseInt(stock);
    if (image_url !== undefined) data.image_url = clean(image_url);
    if (is_active !== undefined) data.is_active = is_active;
    res.json(getContainer().products.update(id, data as never, Array.isArray(categories) ? categories.map(Number) : undefined));
  },

  remove(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    if (!getContainer().products.findById(id)) { res.status(404).json({ error: 'Producto no encontrado' }); return; }
    getContainer().products.softDelete(id);
    res.json({ message: 'Producto eliminado' });
  }
};

// ═══════════════════════════ CATEGORIES ══════════════════════════════════════
export const categoryController = {
  list(_req: Request, res: Response): void { res.json(getContainer().categories.findAll()); },
  create(req: Request, res: Response): void {
    const { name, slug, description } = req.body;
    if (!name || !slug) { res.status(400).json({ error: 'name y slug requeridos' }); return; }
    try { res.status(201).json(getContainer().categories.create({ name: clean(name), slug: clean(slug), description: description ? clean(description) : '' })); }
    catch { res.status(409).json({ error: 'Nombre o slug duplicado' }); }
  },
  update(req: Request, res: Response): void {
    try { res.json(getContainer().categories.update(parseInt(req.params.id), req.body)); }
    catch { res.status(404).json({ error: 'Categoría no encontrada' }); }
  },
  remove(req: Request, res: Response): void {
    try { getContainer().categories.delete(parseInt(req.params.id)); res.json({ message: 'Categoría eliminada' }); }
    catch { res.status(404).json({ error: 'Categoría no encontrada' }); }
  }
};

// ════════════════════════════ CART ═══════════════════════════════════════════
export const cartController = {
  get(req: Request, res: Response): void {
    const { cart } = getContainer();
    const c = cart.getOrCreate(req.user!.id);
    const items = cart.getItems(c.id);
    const total = +items.reduce((s: number, i: CartItemWithProduct) => s + i.price * i.quantity, 0).toFixed(2);
    res.json({ cart_id: c.id, items, total, item_count: items.reduce((s: number, i: CartItemWithProduct) => s + i.quantity, 0) });
  },
  sync(req: Request, res: Response): void {
    const { items } = req.body;
    if (!Array.isArray(items)) { res.status(400).json({ error: 'items debe ser un arreglo' }); return; }
    res.json(getContainer().cart.syncGuestItems(req.user!.id, items));
  },
  addItem(req: Request, res: Response): void {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) { res.status(400).json({ error: 'product_id requerido' }); return; }
    try { res.json(getContainer().cart.addItem(req.user!.id, parseInt(product_id), parseInt(quantity) || 1)); }
    catch (e: unknown) { res.status(400).json({ error: (e as Error).message }); }
  },
  updateItem(req: Request, res: Response): void {
    try { res.json(getContainer().cart.updateItem(req.user!.id, parseInt(req.params.itemId), parseInt(req.body.quantity))); }
    catch (e: unknown) { res.status(400).json({ error: (e as Error).message }); }
  },
  removeItem(req: Request, res: Response): void {
    try { res.json(getContainer().cart.removeItem(req.user!.id, parseInt(req.params.itemId))); }
    catch (e: unknown) { res.status(404).json({ error: (e as Error).message }); }
  },
  clear(req: Request, res: Response): void {
    getContainer().cart.clear(req.user!.id); res.json({ message: 'Carrito vaciado' });
  }
};

// ═══════════════════════════ ORDERS ══════════════════════════════════════════
export const orderController = {
  checkout(req: Request, res: Response): void {
    const { shipping_address, payment_method, coupon_code } = req.body;
    if (!shipping_address) { res.status(400).json({ error: 'shipping_address requerido' }); return; }
    const { orders, coupons } = getContainer();
    let coupon = undefined;
    if (coupon_code) {
      coupon = coupons.findByCode(clean(coupon_code));
      if (!coupon) { res.status(400).json({ error: 'Cupón inválido o expirado' }); return; }
    }
    try {
      const result = orders.checkout({ userId: req.user!.id, shipping_address: clean(shipping_address), payment_method }, coupon);
      res.status(201).json(result);
    } catch (e: unknown) { res.status(400).json({ error: (e as Error).message }); }
  },
  myOrders(req: Request, res: Response): void { res.json(getContainer().orders.findByUser(req.user!.id)); },
  adminList(req: Request, res: Response): void {
    const { status, page, limit } = req.query;
    res.json(getContainer().orders.findAll(status ? String(status) : undefined, parseInt(String(page || 1)), parseInt(String(limit || 20))));
  },
  adminGetOne(req: Request, res: Response): void {
    const o = getContainer().orders.findById(parseInt(req.params.id));
    if (!o) { res.status(404).json({ error: 'Pedido no encontrado' }); return; }
    res.json(o);
  },
  updateStatus(req: Request, res: Response): void {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) { res.status(400).json({ error: 'Estado inválido' }); return; }
    const { orders, email } = getContainer();
    const order = orders.findById(parseInt(req.params.id));
    if (!order) { res.status(404).json({ error: 'Pedido no encontrado' }); return; }
    const updated = orders.updateStatus(order.id, status);
    const user = getContainer().users.findById(order.user_id);
    if (user) email.sendOrderStatusUpdate(updated, user);
    res.json(updated);
  }
};

// ═══════════════════════════ REVIEWS ═════════════════════════════════════════
export const reviewController = {
  getByProduct(req: Request, res: Response): void {
    res.json(getContainer().reviews.findByProduct(parseInt(req.params.productId)));
  },
  create(req: Request, res: Response): void {
    const { rating, comment } = req.body;
    const productId = parseInt(req.params.productId);
    if (!rating || rating < 1 || rating > 5) { res.status(400).json({ error: 'rating entre 1 y 5' }); return; }
    const { reviews } = getContainer();
    if (!reviews.verifyPurchase(productId, req.user!.id)) { res.status(403).json({ error: 'Solo puedes valorar productos que hayas comprado' }); return; }
    try { res.status(201).json(reviews.create(productId, req.user!.id, parseInt(rating), comment ? clean(comment) : undefined)); }
    catch (e: unknown) { res.status(409).json({ error: (e as Error).message }); }
  },
  remove(req: Request, res: Response): void {
    const { reviews } = getContainer();
    const review = reviews.findById(parseInt(req.params.id));
    if (!review) { res.status(404).json({ error: 'Valoración no encontrada' }); return; }
    if (req.user!.role !== 'admin' && review.user_id !== req.user!.id) { res.status(403).json({ error: 'Acceso denegado' }); return; }
    reviews.delete(review.id);
    res.json({ message: 'Valoración eliminada' });
  }
};
