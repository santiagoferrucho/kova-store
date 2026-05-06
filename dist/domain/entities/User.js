"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUser = toPublicUser;
function toPublicUser(u) {
    const { password: _pwd, ...pub } = u;
    return pub;
}
//# sourceMappingURL=User.js.map