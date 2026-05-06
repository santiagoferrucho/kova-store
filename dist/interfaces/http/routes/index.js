"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const controllers_1 = require("../controllers/controllers");
const router = (0, express_1.Router)();
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
router.post('/auth/register', controllers_1.authController.register);
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
router.post('/auth/login', controllers_1.authController.login);
router.get('/auth/me', auth_1.authenticate, controllers_1.authController.me);
router.put('/auth/me', auth_1.authenticate, controllers_1.authController.updateProfile);
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
router.post('/auth/forgot-password', controllers_1.authController.forgotPassword);
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
router.get('/products', controllers_1.productController.list);
router.get('/products/:id', controllers_1.productController.getById);
router.post('/products', auth_1.authenticate, (0, auth_1.requireRole)('admin'), controllers_1.productController.create);
router.put('/products/:id', auth_1.authenticate, (0, auth_1.requireRole)('admin'), controllers_1.productController.update);
router.delete('/products/:id', auth_1.authenticate, (0, auth_1.requireRole)('admin'), controllers_1.productController.remove);
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
router.get('/categories', controllers_1.categoryController.list);
router.post('/categories', auth_1.authenticate, (0, auth_1.requireRole)('admin'), controllers_1.categoryController.create);
router.put('/categories/:id', auth_1.authenticate, (0, auth_1.requireRole)('admin'), controllers_1.categoryController.update);
router.delete('/categories/:id', auth_1.authenticate, (0, auth_1.requireRole)('admin'), controllers_1.categoryController.remove);
// ─── Cart ─────────────────────────────────────────────────────────────────────
/**
 * @openapi
 * /cart:
 *   get:
 *     tags: [Carrito]
 *     summary: Ver carrito del usuario autenticado
 *     responses: {200: {description: Carrito con items y total}}
 */
router.get('/cart', auth_1.authenticate, controllers_1.cartController.get);
router.post('/cart/sync', auth_1.authenticate, controllers_1.cartController.sync);
router.post('/cart/items', auth_1.authenticate, controllers_1.cartController.addItem);
router.put('/cart/items/:itemId', auth_1.authenticate, controllers_1.cartController.updateItem);
router.delete('/cart/items/:itemId', auth_1.authenticate, controllers_1.cartController.removeItem);
router.delete('/cart', auth_1.authenticate, controllers_1.cartController.clear);
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
router.post('/orders/checkout', auth_1.authenticate, (0, auth_1.requireRole)('client', 'admin'), controllers_1.orderController.checkout);
router.get('/orders/my', auth_1.authenticate, controllers_1.orderController.myOrders);
router.get('/orders', auth_1.authenticate, (0, auth_1.requireRole)('admin'), controllers_1.orderController.adminList);
router.get('/orders/:id', auth_1.authenticate, (0, auth_1.requireRole)('admin'), controllers_1.orderController.adminGetOne);
router.put('/orders/:id/status', auth_1.authenticate, (0, auth_1.requireRole)('admin'), controllers_1.orderController.updateStatus);
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
router.get('/products/:productId/reviews', controllers_1.reviewController.getByProduct);
router.post('/products/:productId/reviews', auth_1.authenticate, (0, auth_1.requireRole)('client'), controllers_1.reviewController.create);
router.delete('/reviews/:id', auth_1.authenticate, controllers_1.reviewController.remove);
exports.default = router;
//# sourceMappingURL=index.js.map