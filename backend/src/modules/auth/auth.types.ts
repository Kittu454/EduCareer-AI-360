export type AuthRole = 'STUDENT' | 'FACULTY' | 'TPO' | 'ADMIN';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: AuthRole[];
}
