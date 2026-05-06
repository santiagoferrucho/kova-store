"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContainer = getContainer;
exports.resetContainer = resetContainer;
// ══════════════════════════════════════════════════════════════════════
// Contenedor de Dependencias — Composition Root
// Aquí se ensamblan los Puertos con los Adaptadores.
// Solo este archivo conoce las implementaciones concretas.
// ══════════════════════════════════════════════════════════════════════
const SQLiteDatabase_1 = require("./infrastructure/database/SQLiteDatabase");
const SQLiteRepositories_1 = require("./infrastructure/database/repositories/SQLiteRepositories");
const FileEmailAdapter_1 = require("./infrastructure/email/FileEmailAdapter");
let _container = null;
function getContainer() {
    if (!_container) {
        const db = (0, SQLiteDatabase_1.getDb)();
        (0, SQLiteDatabase_1.initSchema)(db);
        const email = new FileEmailAdapter_1.FileEmailAdapter();
        _container = {
            users: new SQLiteRepositories_1.UserSQLiteRepository(db),
            products: new SQLiteRepositories_1.ProductSQLiteRepository(db),
            categories: new SQLiteRepositories_1.CategorySQLiteRepository(db),
            cart: new SQLiteRepositories_1.CartSQLiteRepository(db),
            orders: new SQLiteRepositories_1.OrderSQLiteRepository(db, email),
            reviews: new SQLiteRepositories_1.ReviewSQLiteRepository(db),
            coupons: new SQLiteRepositories_1.CouponSQLiteRepository(db),
            email
        };
    }
    return _container;
}
function resetContainer() { _container = null; }
//# sourceMappingURL=container.js.map