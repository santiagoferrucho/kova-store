// Domain Entity — User (sin dependencias externas)
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

export function toPublicUser(u: User): PublicUser {
  const { password: _pwd, ...pub } = u;
  return pub;
}
