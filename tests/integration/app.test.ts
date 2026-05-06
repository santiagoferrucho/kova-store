process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test_secret_kova_2026';
process.env.LOG_PATH = '/tmp/kova_test_email.log';

import request from 'supertest';
import app from '../../src/server';
import { getDb, initSchema } from '../../src/infrastructure/database/SQLiteDatabase';
import { resetContainer, getContainer } from '../../src/container';
import bcrypt from 'bcryptjs';

let adminToken: string, clientToken: string, categoryId: number;

beforeAll(() => {
  resetContainer();
  const db = getDb();
  initSchema(db);
});

afterAll(() => { resetContainer(); });

// ─── Auth ──────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('registra nuevo cliente', async () => {
    const r = await request(app).post('/api/auth/register').send({ name:'Test User', email:'test@kova.co', password:'pass123' });
    expect(r.status).toBe(201);
    expect(r.body.token).toBeDefined();
    clientToken = r.body.token;
  });
  it('rechaza email duplicado', async () => {
    expect((await request(app).post('/api/auth/register').send({ name:'X', email:'test@kova.co', password:'pass123' })).status).toBe(409);
  });
  it('rechaza contraseña corta', async () => {
    expect((await request(app).post('/api/auth/register').send({ name:'X', email:'x@x.co', password:'123' })).status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(() => {
    const hash = bcrypt.hashSync('Admin2026!', 10);
    getDb().prepare('INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)').run('Admin','admin@kova.co',hash,'admin');
  });
  it('login correcto', async () => {
    const r = await request(app).post('/api/auth/login').send({ email:'admin@kova.co', password:'Admin2026!' });
    expect(r.status).toBe(200);
    adminToken = r.body.token;
  });
  it('rechaza credenciales incorrectas', async () => {
    expect((await request(app).post('/api/auth/login').send({ email:'admin@kova.co', password:'wrong' })).status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('responde OK aunque el email no exista (seguridad)', async () => {
    const r = await request(app).post('/api/auth/forgot-password').send({ email:'noexiste@kova.co' });
    expect(r.status).toBe(200);
    expect(r.body.message).toBeDefined();
  });
});

// ─── Categories ────────────────────────────────────────────────────────────
describe('Categories CRUD', () => {
  it('admin crea categoría', async () => {
    const r = await request(app).post('/api/categories').set('Authorization',`Bearer ${adminToken}`).send({ name:'Yogurt',slug:'yogurt-t',description:'Test' });
    expect(r.status).toBe(201);
    categoryId = r.body.id;
  });
  it('cliente NO puede crear categoría (403)', async () => {
    expect((await request(app).post('/api/categories').set('Authorization',`Bearer ${clientToken}`).send({ name:'X',slug:'x' })).status).toBe(403);
  });
  it('lista sin autenticación', async () => {
    expect((await request(app).get('/api/categories')).status).toBe(200);
  });
});

// ─── Products ──────────────────────────────────────────────────────────────
let productId: number;
describe('Products CRUD', () => {
  it('admin crea producto', async () => {
    const r = await request(app).post('/api/products').set('Authorization',`Bearer ${adminToken}`)
      .send({ sku:'YG-TEST',name:'Yogurt Test',price:12000,stock:10,categories:[categoryId] });
    expect(r.status).toBe(201);
    productId = r.body.id;
  });
  it('lista con paginación', async () => {
    const r = await request(app).get('/api/products?page=1&limit=10');
    expect(r.status).toBe(200);
    expect(r.body.pagination).toBeDefined();
  });
  it('filtra por categoría', async () => {
    const r = await request(app).get('/api/products?category=yogurt-t');
    expect(r.body.data.length).toBeGreaterThan(0);
  });
  it('busca por texto', async () => {
    const r = await request(app).get('/api/products?q=Yogurt');
    expect(r.body.data.some((p: {name:string}) => p.name.includes('Yogurt'))).toBe(true);
  });
  it('obtiene por ID', async () => {
    const r = await request(app).get(`/api/products/${productId}`);
    expect(r.body.id).toBe(productId);
  });
  it('admin actualiza stock', async () => {
    const r = await request(app).put(`/api/products/${productId}`).set('Authorization',`Bearer ${adminToken}`).send({ stock:25 });
    expect(r.body.stock).toBe(25);
  });
  it('admin elimina (soft delete)', async () => {
    expect((await request(app).delete(`/api/products/${productId}`).set('Authorization',`Bearer ${adminToken}`)).status).toBe(200);
  });
});

// ─── Cart ──────────────────────────────────────────────────────────────────
let cartProductId: number;
describe('Cart', () => {
  beforeAll(async () => {
    const r = await request(app).post('/api/products').set('Authorization',`Bearer ${adminToken}`)
      .send({ sku:'CART-PROD',name:'Cart Product',price:10000,stock:20 });
    cartProductId = r.body.id;
  });
  it('agrega item al carrito', async () => {
    const r = await request(app).post('/api/cart/items').set('Authorization',`Bearer ${clientToken}`)
      .send({ product_id:cartProductId,quantity:2 });
    expect(r.body.item_count).toBe(2);
  });
  it('ve el carrito', async () => {
    const r = await request(app).get('/api/cart').set('Authorization',`Bearer ${clientToken}`);
    expect(r.body.total).toBe(20000);
  });
});

// ─── Orders ────────────────────────────────────────────────────────────────
let orderId: number;
describe('Orders — Checkout', () => {
  let testProdId: number;
  beforeAll(async () => {
    await request(app).delete('/api/cart').set('Authorization',`Bearer ${clientToken}`);
    const r = await request(app).post('/api/products').set('Authorization',`Bearer ${adminToken}`)
      .send({ sku:'ORDER-PROD',name:'Order Product',price:15000,stock:50 });
    testProdId = r.body.id;
    await request(app).post('/api/cart/items').set('Authorization',`Bearer ${clientToken}`)
      .send({ product_id:testProdId,quantity:1 });
  });
  it('checkout exitoso', async () => {
    const r = await request(app).post('/api/orders/checkout').set('Authorization',`Bearer ${clientToken}`)
      .send({ shipping_address:'Calle 45 #12-34, Bucaramanga' });
    expect(r.status).toBe(201);
    expect(r.body.order.status).toBe('pending');
    expect(r.body.order.total).toBe(15000);
    orderId = r.body.order.id;
  });
  it('checkout con cupón %', async () => {
    getDb().prepare('INSERT OR IGNORE INTO coupons (code,type,value) VALUES (?,?,?)').run('TEST10','percent',10);
    await request(app).post('/api/cart/items').set('Authorization',`Bearer ${clientToken}`).send({ product_id:testProdId,quantity:2 });
    const r = await request(app).post('/api/orders/checkout').set('Authorization',`Bearer ${clientToken}`)
      .send({ shipping_address:'Calle 1, Bogotá',coupon_code:'TEST10' });
    expect(r.body.order.discount_amount).toBeGreaterThan(0);
  });
  it('carrito vacío tras checkout', async () => {
    const r = await request(app).get('/api/cart').set('Authorization',`Bearer ${clientToken}`);
    expect(r.body.items.length).toBe(0);
  });
  it('admin ve pedidos', async () => {
    const r = await request(app).get('/api/orders').set('Authorization',`Bearer ${adminToken}`);
    expect(r.body.data.length).toBeGreaterThan(0);
  });
  it('admin actualiza estado', async () => {
    const r = await request(app).put(`/api/orders/${orderId}/status`).set('Authorization',`Bearer ${adminToken}`).send({ status:'processing' });
    expect(r.body.status).toBe('processing');
  });
  it('cliente ve su historial', async () => {
    const r = await request(app).get('/api/orders/my').set('Authorization',`Bearer ${clientToken}`);
    expect(r.body.length).toBeGreaterThan(0);
  });
});
