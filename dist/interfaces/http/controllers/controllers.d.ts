import { Request, Response } from 'express';
export declare const authController: {
    register(req: Request, res: Response): void;
    login(req: Request, res: Response): void;
    me(req: Request, res: Response): void;
    updateProfile(req: Request, res: Response): void;
    forgotPassword(req: Request, res: Response): void;
};
export declare const productController: {
    list(req: Request, res: Response): void;
    getById(req: Request, res: Response): void;
    create(req: Request, res: Response): void;
    update(req: Request, res: Response): void;
    remove(req: Request, res: Response): void;
};
export declare const categoryController: {
    list(_req: Request, res: Response): void;
    create(req: Request, res: Response): void;
    update(req: Request, res: Response): void;
    remove(req: Request, res: Response): void;
};
export declare const cartController: {
    get(req: Request, res: Response): void;
    sync(req: Request, res: Response): void;
    addItem(req: Request, res: Response): void;
    updateItem(req: Request, res: Response): void;
    removeItem(req: Request, res: Response): void;
    clear(req: Request, res: Response): void;
};
export declare const orderController: {
    checkout(req: Request, res: Response): void;
    myOrders(req: Request, res: Response): void;
    adminList(req: Request, res: Response): void;
    adminGetOne(req: Request, res: Response): void;
    updateStatus(req: Request, res: Response): void;
};
export declare const reviewController: {
    getByProduct(req: Request, res: Response): void;
    create(req: Request, res: Response): void;
    remove(req: Request, res: Response): void;
};
//# sourceMappingURL=controllers.d.ts.map