// ══════════════════════════════════════════════════════════════════════
// Contenedor de Dependencias — Composition Root
// Aquí se ensamblan los Puertos con los Adaptadores.
// Solo este archivo conoce las implementaciones concretas.
// ══════════════════════════════════════════════════════════════════════
import { getDb, initSchema } from './infrastructure/database/SQLiteDatabase';
import {
  UserSQLiteRepository, ProductSQLiteRepository, CategorySQLiteRepository,
  CartSQLiteRepository, OrderSQLiteRepository, ReviewSQLiteRepository,
  CouponSQLiteRepository
} from './infrastructure/database/repositories/SQLiteRepositories';
import { FileEmailAdapter } from './infrastructure/email/FileEmailAdapter';

export interface Container {
  users: UserSQLiteRepository;
  products: ProductSQLiteRepository;
  categories: CategorySQLiteRepository;
  cart: CartSQLiteRepository;
  orders: OrderSQLiteRepository;
  reviews: ReviewSQLiteRepository;
  coupons: CouponSQLiteRepository;
  email: FileEmailAdapter;
}

let _container: Container | null = null;

export function getContainer(): Container {
  if (!_container) {
    const db = getDb();
    initSchema(db);
    const email = new FileEmailAdapter();
    _container = {
      users:      new UserSQLiteRepository(db),
      products:   new ProductSQLiteRepository(db),
      categories: new CategorySQLiteRepository(db),
      cart:       new CartSQLiteRepository(db),
      orders:     new OrderSQLiteRepository(db, email),
      reviews:    new ReviewSQLiteRepository(db),
      coupons:    new CouponSQLiteRepository(db),
      email
    };
  }
  return _container;
}

export function resetContainer(): void { _container = null; }
