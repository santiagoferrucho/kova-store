"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
exports.signToken = signToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'kova_secret_dev';
function authenticate(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
        res.status(401).json({ error: 'Token requerido' });
        return;
    }
    try {
        req.user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        next();
    }
    catch {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
}
function optionalAuth(req, _res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (token) {
        try {
            req.user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch { }
    }
    next();
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Acceso denegado' });
            return;
        }
        next();
    };
}
function signToken(payload) {
    const exp = (process.env.JWT_EXPIRES_IN || '7d');
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: exp });
}
//# sourceMappingURL=auth.js.map