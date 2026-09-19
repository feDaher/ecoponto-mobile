import { ValidationError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';

/**
 * RB02 — Differentiated access roles with specific permissions.
 * "Each role has exclusive, non-interchangeable features."
 *
 * Maps to `USUARIO.tipoPerfil enum{cidadao, coletor, admin}` in the ERD.
 */
export const USER_ROLES = ['citizen', 'collector', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Protected system actions. The UI and the use-cases query the same matrix. */
export type Permission =
  | 'point:view' // public (RB01)
  | 'point:register'
  | 'point:edit-own'
  | 'point:approve' // RB03 — admin only
  | 'pickup:request'
  | 'pickup:receive'
  | 'disposal:register' // RB01 — requires sign-up
  | 'review:publish' // RB12
  | 'review:moderate'
  | 'content:publish' // RB10
  | 'user:manage'
  | 'gamification:participate'; // RB09

const MATRIX: Record<UserRole, readonly Permission[]> = {
  citizen: [
    'point:view',
    'pickup:request',
    'disposal:register',
    'review:publish',
    'gamification:participate',
  ],
  collector: ['point:view', 'point:register', 'point:edit-own', 'pickup:receive'],
  admin: ['point:view', 'point:approve', 'review:moderate', 'content:publish', 'user:manage'],
};

/** Actions allowed without authentication — RB01 (public map lookup). */
const PUBLIC_PERMISSIONS: readonly Permission[] = ['point:view'];

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  citizen: 'Cidadão',
  collector: 'Coletor / Cooperativa',
  admin: 'Administrador',
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function parseRole(value: unknown): Result<UserRole, ValidationError> {
  if (!isUserRole(value)) {
    return err(
      new ValidationError(`Perfil de usuário inválido: ${String(value)}`, undefined, 'role'),
    );
  }
  return ok(value);
}

/** A `null` role represents an unauthenticated guest. */
export function canPerform(role: UserRole | null, permission: Permission): boolean {
  if (role === null) return PUBLIC_PERMISSIONS.includes(permission);
  return MATRIX[role].includes(permission);
}

export function permissionsOf(role: UserRole): readonly Permission[] {
  return MATRIX[role];
}
