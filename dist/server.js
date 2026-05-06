"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const SQLiteDatabase_1 = require("./infrastructure/database/SQLiteDatabase");
const index_1 = __importDefault(require("./interfaces/http/routes/index"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000');
// ─── Init DB + auto-seed ──────────────────────────────────────────────────────
function autoSeed(db) {
    // Semillar solo si la BD está vacía (primera ejecución en Vercel /tmp o local)
    const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
    if (userCount > 0)
        return;
    console.log('🌱 Auto-sembrando base de datos...');
    const bcrypt = require('bcryptjs');
    // Categorías
    const insC = db.prepare('INSERT OR IGNORE INTO categories (name,slug,description) VALUES (?,?,?)');
    [
        ['Yogurt Griego', 'yogurt', 'Yogurt artesanal fermentado 18h en finca propia'],
        ['Galletas', 'galletas', 'Galletas con ingredientes naturales sin atajos'],
        ['Café de Especialidad', 'cafe', 'Café de origen colombiano, tostado artesanal'],
        ['Combos', 'combos', 'Selecciones especiales KOVA'],
    ].forEach(([n, s, d]) => insC.run(n, s, d));
    // Usuarios
    db.prepare('INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)').run('Administrador KOVA', 'admin@kova.co', bcrypt.hashSync('Admin2026!', 10), 'admin');
    db.prepare('INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)').run('María García', 'maria@example.com', bcrypt.hashSync('Cliente123', 10), 'client');
    // Productos
    const insP = db.prepare('INSERT OR IGNORE INTO products (sku,name,description,price,stock,image_url) VALUES (?,?,?,?,?,?)');
    const insPC = db.prepare('INSERT OR IGNORE INTO product_categories (product_id,category_id) VALUES (?,?)');
    const getCat = (slug) => db.prepare('SELECT id FROM categories WHERE slug=?').get(slug)?.id;
    const products = [
        { sku: 'YG-NAT-250', name: 'Yogurt Griego Natural 250g', desc: 'Fermentado 18h, finca propia. Sin azúcares. Lote 014.', price: 12500, stock: 48, img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', cats: ['yogurt'] },
        { sku: 'YG-NAT-500', name: 'Yogurt Griego Natural 500g', desc: 'Tarro familiar. Textura densa y cremosa.', price: 22000, stock: 30, img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', cats: ['yogurt'] },
        { sku: 'YG-MIEL-250', name: 'Yogurt Griego con Miel 250g', desc: 'Con miel de abejas silvestres, sin aditivos artificiales.', price: 14500, stock: 35, img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', cats: ['yogurt'] },
        { sku: 'YG-FRESA-250', name: 'Yogurt Griego Fresa 250g', desc: 'Coulis de fresa artesanal, sin colorantes.', price: 13500, stock: 40, img: 'https://images.unsplash.com/photo-1565029938416-b4a2cc9d1f5b?w=400&q=80', cats: ['yogurt'] },
        { sku: 'GL-AVENA-120', name: 'Galletas de Avena y Pasas 120g', desc: 'Avena entera, pasas y canela. Sin harina refinada.', price: 9800, stock: 60, img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80', cats: ['galletas'] },
        { sku: 'GL-CHOCO-120', name: 'Galletas de Chocolate Oscuro 120g', desc: 'Chips de cacao 70%. Mantequilla real, sin margarina.', price: 10500, stock: 55, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', cats: ['galletas'] },
        { sku: 'GL-ALME-100', name: 'Galletas de Almendra 100g', desc: 'Almendra molida y vainilla natural de Madagascar.', price: 11800, stock: 45, img: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=80', cats: ['galletas'] },
        { sku: 'GL-LIMON-120', name: 'Galletas de Limón y Romero 120g', desc: 'Zeste de limón y romero fresco. Saladulces.', price: 9500, stock: 50, img: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400&q=80', cats: ['galletas'] },
        { sku: 'CF-HUILA-250', name: 'Café Especialidad Huila 250g', desc: '1700 msnm. Tueste medio. Caramelo y frutos rojos.', price: 28000, stock: 25, img: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80', cats: ['cafe'] },
        { sku: 'CF-NARI-250', name: 'Café Especialidad Nariño 250g', desc: '2200 msnm. Acidez brillante. Notas de panela y flores.', price: 30000, stock: 20, img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', cats: ['cafe'] },
        { sku: 'CF-ESPR-125', name: 'Café Huila Espresso 125g', desc: 'Molido fino. Perfecto para máquina o moka.', price: 16000, stock: 30, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', cats: ['cafe'] },
        { sku: 'CB-DES-01', name: 'Combo Desayuno KOVA', desc: 'Yogurt Natural + Galletas Avena + Café Huila.', price: 35000, stock: 20, img: 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400&q=80', cats: ['combos', 'yogurt', 'galletas', 'cafe'] },
        { sku: 'CB-REG-01', name: 'Caja Regalo Cosecha Buena', desc: 'Yogurt Miel + 2 galletas + Café Nariño. Para regalo.', price: 55000, stock: 15, img: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80', cats: ['combos'] },
        { sku: 'CB-MER-01', name: 'Combo Merienda', desc: 'Yogurt Fresa 250g + Galletas Chocolate 120g.', price: 22000, stock: 25, img: 'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?w=400&q=80', cats: ['combos', 'yogurt', 'galletas'] },
    ];
    products.forEach(p => {
        insP.run(p.sku, p.name, p.desc, p.price, p.stock, p.img);
        const prod = db.prepare('SELECT id FROM products WHERE sku=?').get(p.sku);
        p.cats.forEach(slug => { const cid = getCat(slug); if (cid)
            insPC.run(prod.id, cid); });
    });
    // Cupones
    [['COSECHA10', 'percent', 10, 0], ['BIENVENIDO5', 'fixed', 5000, 20000], ['VOLUMEN15', 'volume', 15, 80000]]
        .forEach(([c, t, v, m]) => db.prepare('INSERT OR IGNORE INTO coupons (code,type,value,min_amount) VALUES (?,?,?,?)').run(c, t, v, m));
    console.log('✅ Auto-seed completado. Admin: admin@kova.co / Admin2026!');
}
const db = (0, SQLiteDatabase_1.getDb)();
(0, SQLiteDatabase_1.initSchema)(db);
autoSeed(db);
// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerSpec = (0, swagger_jsdoc_1.default)({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'KOVA Store API',
            version: '1.0.0',
            description: '**Caso 6.13 — DAWeb 2026-10 · UPB Bucaramanga**\n\nArquitectura Hexagonal + TypeScript Strict.\n\n**Auth:** `Authorization: Bearer <token>`\n\n**Demo:** admin@kova.co / Admin2026!'
        },
        servers: [{ url: '/api' }],
        components: {
            securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: [path_1.default.join(__dirname, './interfaces/http/routes/*.js')]
});
// ─── Middleware ────────────────────────────────────────────────────────────────
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Static files ─────────────────────────────────────────────────────────────
const publicDir = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(publicDir));
// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { background:#2A4D69; }',
    customSiteTitle: 'KOVA API Docs'
}));
// ─── API ──────────────────────────────────────────────────────────────────────
app.use('/api', index_1.default);
// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path_1.default.join(publicDir, 'index.html'));
});
// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
});
if (require.main === module) {
    app.listen(PORT, () => {
        const isVercel = !!process.env.VERCEL;
        console.log(`\n🌱 KOVA Store → http://localhost:${PORT}${isVercel ? ' [Vercel]' : ''}`);
        console.log(`📖 Swagger   → http://localhost:${PORT}/api-docs\n`);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map