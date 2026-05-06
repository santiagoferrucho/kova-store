import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getDb, initSchema } from './infrastructure/database/SQLiteDatabase';

const db = getDb();
initSchema(db);

console.log('🌱 Sembrando base de datos KOVA...');

const cats = [
  { name: 'Yogurt Griego', slug: 'yogurt', description: 'Yogurt artesanal 18h fermentado' },
  { name: 'Galletas', slug: 'galletas', description: 'Galletas con ingredientes naturales' },
  { name: 'Café de Especialidad', slug: 'cafe', description: 'Café de origen colombiano' },
  { name: 'Combos', slug: 'combos', description: 'Selecciones especiales KOVA' }
];
const ins = db.prepare('INSERT OR IGNORE INTO categories (name,slug,description) VALUES (?,?,?)');
cats.forEach(c => ins.run(c.name, c.slug, c.description));
console.log('✅ Categorías');

db.prepare('INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)').run('Administrador KOVA','admin@kova.co', bcrypt.hashSync('Admin2026!',10),'admin');
db.prepare('INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)').run('María García','maria@example.com', bcrypt.hashSync('Cliente123',10),'client');
db.prepare('INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)').run('Carlos Pérez','carlos@example.com', bcrypt.hashSync('Cliente123',10),'client');
console.log('✅ Usuarios');

const prods = [
  { sku:'YG-NAT-250', name:'Yogurt Griego Natural 250g', desc:'Fermentado 18h en finca propia. Sin azúcares. Lote 014.', price:12500, stock:48, img:'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', cats:['yogurt']},
  { sku:'YG-NAT-500', name:'Yogurt Griego Natural 500g', desc:'Tarro familiar, textura densa y cremosa.', price:22000, stock:30, img:'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', cats:['yogurt']},
  { sku:'YG-MIEL-250', name:'Yogurt Griego con Miel 250g', desc:'Con miel de abejas silvestres, sin aditivos.', price:14500, stock:35, img:'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', cats:['yogurt']},
  { sku:'YG-FRESA-250', name:'Yogurt Griego Fresa 250g', desc:'Con coulis de fresa artesanal, sin colorantes.', price:13500, stock:40, img:'https://images.unsplash.com/photo-1565029938416-b4a2cc9d1f5b?w=400&q=80', cats:['yogurt']},
  { sku:'GL-AVENA-120', name:'Galletas de Avena y Pasas 120g', desc:'Avena entera, pasas y canela. Sin harina refinada.', price:9800, stock:60, img:'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80', cats:['galletas']},
  { sku:'GL-CHOCO-120', name:'Galletas de Chocolate Oscuro 120g', desc:'Chips de chocolate 70% cacao. Mantequilla real.', price:10500, stock:55, img:'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', cats:['galletas']},
  { sku:'GL-ALMENDRA-100', name:'Galletas de Almendra y Vainilla 100g', desc:'Almendra molida y vainilla de Madagascar.', price:11800, stock:45, img:'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=80', cats:['galletas']},
  { sku:'GL-LIMON-120', name:'Galletas de Limón y Romero 120g', desc:'Zeste de limón y romero fresco, saladulces.', price:9500, stock:50, img:'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400&q=80', cats:['galletas']},
  { sku:'CF-HUILA-250', name:'Café Especialidad Huila 250g', desc:'1700 msnm. Tueste medio. Caramelo y frutos rojos.', price:28000, stock:25, img:'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80', cats:['cafe']},
  { sku:'CF-NARINO-250', name:'Café Especialidad Nariño 250g', desc:'2200 msnm. Acidez brillante. Panela y flores.', price:30000, stock:20, img:'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', cats:['cafe']},
  { sku:'CF-ESPRESSO-125', name:'Café Huila Espresso 125g', desc:'Molido fino para espresso y moka.', price:16000, stock:30, img:'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', cats:['cafe']},
  { sku:'CB-DESAYUNO-01', name:'Combo Desayuno KOVA', desc:'Yogurt Natural 250g + Galletas Avena + Café Huila.', price:35000, stock:20, img:'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400&q=80', cats:['combos','yogurt','galletas','cafe']},
  { sku:'CB-REGALO-01', name:'Caja Regalo Cosecha Buena', desc:'Yogurt Miel + 2 galletas + Café Nariño. Presentación especial.', price:55000, stock:15, img:'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80', cats:['combos']},
  { sku:'CB-MERIENDA-01', name:'Combo Merienda', desc:'Yogurt Fresa 250g + Galletas Chocolate 120g.', price:22000, stock:25, img:'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?w=400&q=80', cats:['combos','yogurt','galletas']},
];

const getCatId = (slug: string) => (db.prepare('SELECT id FROM categories WHERE slug=?').get(slug) as { id: number } | undefined)?.id;
const insProd = db.prepare('INSERT OR IGNORE INTO products (sku,name,description,price,stock,image_url) VALUES (?,?,?,?,?,?)');
const insPC = db.prepare('INSERT OR IGNORE INTO product_categories (product_id,category_id) VALUES (?,?)');

prods.forEach(p => {
  insProd.run(p.sku, p.name, p.desc, p.price, p.stock, p.img);
  const prod = db.prepare('SELECT id FROM products WHERE sku=?').get(p.sku) as { id: number };
  p.cats.forEach(s => { const cid = getCatId(s); if (cid) insPC.run(prod.id, cid); });
});
console.log('✅ Productos (14)');

[['COSECHA10','percent',10,0],['BIENVENIDO5','fixed',5000,20000],['VOLUMEN15','volume',15,80000]]
  .forEach(([code,type,value,min]) => db.prepare('INSERT OR IGNORE INTO coupons (code,type,value,min_amount) VALUES (?,?,?,?)').run(code,type,value,min));
console.log('✅ Cupones');

console.log('\n🎉 ¡Base de datos lista!');
console.log('👤 Admin:  admin@kova.co / Admin2026!');
console.log('👤 Client: maria@example.com / Cliente123');
console.log('🎟  Cupones: COSECHA10 · BIENVENIDO5 · VOLUMEN15\n');
