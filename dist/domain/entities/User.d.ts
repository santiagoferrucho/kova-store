export type UserRole = 'client' | 'admin';
export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    created_at: string;
}
export type PublicUser = Omit<User, 'password'>;
export declare function toPublicUser(u: User): PublicUser;
//# sourceMappingURL=User.d.ts.map