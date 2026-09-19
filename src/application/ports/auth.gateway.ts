import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { User } from '@/domain/entities/user';
import type { UserRole } from '@/domain/value-objects/user-role';

export type SignInCredentials = {
  readonly email: string;
  readonly password: string;
};

/** RB01 — sign-up requires valid name, e-mail, phone and city. */
export type SignUpData = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone: string;
  readonly city: string;
  readonly role: UserRole;
};

/**
 * Authentication port.
 *
 * The specification defines Firebase Authentication + JWT as the mechanism (section 8.1).
 * The application depends only on this contract — swapping Firebase for the
 * API's own authentication touches no use-case or screen.
 */
export interface AuthGateway {
  /** Session restored from secure storage, if any. */
  currentSession(): Promise<Result<User | null, AppError>>;

  signIn(credentials: SignInCredentials): Promise<Result<User, AppError>>;

  signUp(data: SignUpData): Promise<Result<User, AppError>>;

  signOut(): Promise<Result<void, AppError>>;

  /** JWT token for the `Authorization` header of API calls. */
  getToken(): Promise<string | null>;
}
