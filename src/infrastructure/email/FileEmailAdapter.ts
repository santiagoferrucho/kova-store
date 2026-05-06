import fs from 'fs';
import path from 'path';
import { IEmailService } from '../../domain/repositories/ports';
import { PublicUser } from '../../domain/entities/User';
import { Order } from '../../domain/entities/index';
import { Product } from '../../domain/entities/Product';

const LOG_PATH = process.env.LOG_PATH || path.join(__dirname, '../../../logs/email.log');

function log(type: string, to: string, subject: string, body: string): void {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] [${type}] TO:${to} | ${subject}\n${body}\n${'─'.repeat(60)}\n`);
}

export class FileEmailAdapter implements IEmailService {
  sendRegistrationConfirmation(user: PublicUser): void {
    log('REGISTRO', user.email, '¡Bienvenido a KOVA!', `Hola ${user.name}, tu cuenta en KOVA fue creada.`);
  }
  sendOrderConfirmation(order: Order, user: PublicUser): void {
    log('PEDIDO', user.email, `Pedido #${order.id} confirmado`, `Pedido #${order.id} por $${order.total} recibido.`);
  }
  sendOrderStatusUpdate(order: Order, user: PublicUser): void {
    log('ESTADO', user.email, `Pedido #${order.id} actualizado`, `Estado: ${order.status}`);
  }
  sendLowStockAlert(product: Product): void {
    log('INVENTARIO', 'admin@kova.co', `Stock bajo — ${product.name}`, `SKU: ${product.sku} — ${product.stock} unidades.`);
  }
}
