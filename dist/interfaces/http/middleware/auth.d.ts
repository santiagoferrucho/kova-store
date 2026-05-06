import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    id: number;
    email: string;
    role: string;
    name: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): void;
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function signToken(payload: JwtPayload): string;
//# sourceMappingURL=auth.d.ts.map