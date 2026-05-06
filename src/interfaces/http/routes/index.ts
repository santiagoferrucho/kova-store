import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { authController, productController, categoryController, cartController, orderController, reviewController } from '../controllers/controllers';

const router = Router();

// ─── Auth ──────────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo cliente
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name,email,password]
 *             properties:
 *               name: {type: string, example: "María García"}
 *               email: {type: string, format: email, example: "maria@kova.co"}
 *               password: {type: string, minLength: 6, example: "mipass123"}
 *     responses:
 *       201: {description: Token JWT + datos del usuario}
 *       409: {description: Email ya registrado}
 */
router.post('/auth/register', authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email,password]
 *             properties:
 *               email: {type: string, example: "admin@kova.co"}
 *               password: {type: string, example: "Admin2026!"}
 *     responses:
 *       200: {description: Token JWT}
 *       401: {description: Credenciales inválidas}
 */
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.me);
router.put('/auth/me', authenticate, authController.updateProfile);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Recuperación de contraseña (simulada)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: {type: string, format: email}
 *     responses:
 *       200: {description: Mensaje de confirmación (simulado)}
 */
router.post('/auth/forgot-password', authController.forgotPassword);

// ─── Products ─────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Productos]
 *     summary: Listar productos con filtros y paginación
 *     security: []
 *     parameters:
 *       - {name: q, in: query, schema: {type: string}, description: Búsqueda por nombre/descripción}
 *       - {name: category, in: query, schema: {type: string}, description: "Slug de categoría (yogurt|galletas|cafe|combos)"}
 *       - {name: min_price, in: query, schema: {type: number}}
 *       - {name: max_price, in: query, schema: {type: number}}
 *       - {name: page, in: query, schema: {type: integer, default: 1}}
 *       - {name: limit, in: query, schema: {type: integer, default: 12, maximum: 50}}
 *     responses:
 *       200:
 *         description: Lista paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: {type: array}
 *                 pagination: {type: object}
 */
router.get('/products', productController.list);
router.get('/products/:id', productController.getById);
router.post('/products', authenticate, requireRole('admin'), productController.create);
router.put('/products/:id', authenticate, requireRole('admin'), productController.update);
router.delete('/products/:id', authenticate, requireRole('admin'), productController.remove);

// ─── Categories ───────────────────────────────────────────────────────────────
/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categorías]
 *     summary: Listar todas las categorías
 *     security: []
 *     responses:
 *       200: {description: Array de categorías}
 */
router.get('/categories', categoryController.list);
router.post('/categories', authenticate, requireRole('admin'), categoryController.create);
router.put('/categories/:id', authenticate, requireRole('admin'), categoryController.update);
router.delete('/categories/:id', authenticate, requireRole('admin'), categoryController.remove);

// ─── Cart ─────────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /cart:
 *   get:
 *     tags: [Carrito]
 *     summary: Ver carrito del usuario autenticado
 *     responses: {200: {description: Carrito con items y total}}
 */
router.get('/cart', authenticate, cartController.get);
router.post('/cart/sync', authenticate, cartController.sync);
router.post('/cart/items', authenticate, cartController.addItem);
router.put('/cart/items/:itemId', authenticate, cartController.updateItem);
router.delete('/cart/items/:itemId', authenticate, cartController.removeItem);
router.delete('/cart', authenticate, cartController.clear);

// ─── Orders ───────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /orders/checkout:
 *   post:
 *     tags: [Pedidos]
 *     summary: Checkout — Crear pedido (transaccional)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shipping_address]
 *             properties:
 *               shipping_address: {type: string}
 *               payment_method: {type: string, default: simulated}
 *               coupon_code: {type: string, example: "COSECHA10"}
 *     responses:
 *       201: {description: Pedido creado con items}
 */
router.post('/orders/checkout', authenticate, requireRole('client', 'admin'), orderController.checkout);
router.get('/orders/my', authenticate, orderController.myOrders);
router.get('/orders', authenticate, requireRole('admin'), orderController.adminList);
router.get('/orders/:id', authenticate, requireRole('admin'), orderController.adminGetOne);
router.put('/orders/:id/status', authenticate, requireRole('admin'), orderController.updateStatus);

// ─── Reviews ──────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /products/{productId}/reviews:
 *   get:
 *     tags: [Valoraciones]
 *     summary: Ver valoraciones de un producto
 *     security: []
 *     parameters:
 *       - {name: productId, in: path, required: true, schema: {type: integer}}
 *     responses: {200: {description: Lista de valoraciones}}
 */
router.get('/products/:productId/reviews', reviewController.getByProduct);
router.post('/products/:productId/reviews', authenticate, requireRole('client'), reviewController.create);
router.delete('/reviews/:id', authenticate, reviewController.remove);

export default router;
