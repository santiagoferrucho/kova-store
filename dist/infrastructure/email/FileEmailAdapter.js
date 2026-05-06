"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileEmailAdapter = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOG_PATH = process.env.LOG_PATH || path_1.default.join(__dirname, '../../../logs/email.log');
function log(type, to, subject, body) {
    const dir = path_1.default.dirname(LOG_PATH);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] [${type}] TO:${to} | ${subject}\n${body}\n${'─'.repeat(60)}\n`);
}
class FileEmailAdapter {
    sendRegistrationConfirmation(user) {
        log('REGISTRO', user.email, '¡Bienvenido a KOVA!', `Hola ${user.name}, tu cuenta en KOVA fue creada.`);
    }
    sendOrderConfirmation(order, user) {
        log('PEDIDO', user.email, `Pedido #${order.id} confirmado`, `Pedido #${order.id} por $${order.total} recibido.`);
    }
    sendOrderStatusUpdate(order, user) {
        log('ESTADO', user.email, `Pedido #${order.id} actualizado`, `Estado: ${order.status}`);
    }
    sendLowStockAlert(product) {
        log('INVENTARIO', 'admin@kova.co', `Stock bajo — ${product.name}`, `SKU: ${product.sku} — ${product.stock} unidades.`);
    }
}
exports.FileEmailAdapter = FileEmailAdapter;
//# sourceMappingURL=FileEmailAdapter.js.map