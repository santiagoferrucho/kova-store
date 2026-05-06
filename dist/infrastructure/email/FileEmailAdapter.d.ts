import { IEmailService } from '../../domain/repositories/ports';
import { PublicUser } from '../../domain/entities/User';
import { Order } from '../../domain/entities/index';
import { Product } from '../../domain/entities/Product';
export declare class FileEmailAdapter implements IEmailService {
    sendRegistrationConfirmation(user: PublicUser): void;
    sendOrderConfirmation(order: Order, user: PublicUser): void;
    sendOrderStatusUpdate(order: Order, user: PublicUser): void;
    sendLowStockAlert(product: Product): void;
}
//# sourceMappingURL=FileEmailAdapter.d.ts.map