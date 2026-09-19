/**
 * Application error hierarchy.
 *
 * Every error carries a stable `code` (used in logs/telemetry and to pick the
 * UI message) and a `message` already in pt-BR, ready for display.
 * Never leak `cause` (stack, HTTP body) to the screen — it exists for logging only.
 */

export type ErrorCode =
  // domain
  | 'VALIDATION_ERROR'
  | 'BUSINESS_RULE_VIOLATION'
  // authentication / authorization
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_IN_USE'
  // infrastructure
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'CONTRACT_MISMATCH'
  | 'PERMISSION_DENIED'
  | 'UNAVAILABLE'
  | 'UNEXPECTED';

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;

  /** Form field related to the error, when there is one. */
  readonly field?: string;

  constructor(
    message: string,
    readonly cause?: unknown,
    field?: string,
  ) {
    super(message);
    this.name = new.target.name;
    this.field = field;
  }

  toJSON() {
    return { name: this.name, code: this.code, message: this.message, field: this.field };
  }
}

/** Invalid input data (format, range, required). */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR' as const;
}

/** A business rule from the specification was violated (RB01..RB12). */
export class BusinessRuleError extends AppError {
  readonly code = 'BUSINESS_RULE_VIOLATION' as const;

  constructor(
    readonly rule: string,
    message: string,
  ) {
    super(message);
  }
}

export class UnauthenticatedError extends AppError {
  readonly code = 'UNAUTHENTICATED' as const;

  constructor(message = 'Você precisa entrar na sua conta para continuar.') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN' as const;

  constructor(message = 'Seu perfil não tem permissão para esta ação.') {
    super(message);
  }
}

export class InvalidCredentialsError extends AppError {
  readonly code = 'INVALID_CREDENTIALS' as const;

  constructor(message = 'E-mail ou senha incorretos.') {
    super(message);
  }
}

export class EmailAlreadyInUseError extends AppError {
  readonly code = 'EMAIL_ALREADY_IN_USE' as const;

  constructor(message = 'Este e-mail já está cadastrado.') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND' as const;

  constructor(resource: string) {
    super(`${resource} não encontrado.`);
  }
}

export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR' as const;

  constructor(cause?: unknown) {
    super('Sem conexão com o servidor. Verifique sua internet.', cause);
  }
}

export class TimeoutError extends AppError {
  readonly code = 'TIMEOUT' as const;

  constructor(cause?: unknown) {
    super('O servidor demorou para responder. Tente novamente.', cause);
  }
}

export class ServerError extends AppError {
  readonly code = 'SERVER_ERROR' as const;

  constructor(
    readonly status: number,
    cause?: unknown,
  ) {
    super('Não foi possível concluir a operação. Tente novamente em instantes.', cause);
  }
}

/** The API response did not match the expected schema (contract break). */
export class ContractMismatchError extends AppError {
  readonly code = 'CONTRACT_MISMATCH' as const;

  constructor(cause?: unknown) {
    super('Recebemos uma resposta inesperada do servidor.', cause);
  }
}

/** OS permission denied (location, notifications). */
export class PermissionDeniedError extends AppError {
  readonly code = 'PERMISSION_DENIED' as const;
}

/** Device resource unavailable (GPS off, external app missing). */
export class UnavailableError extends AppError {
  readonly code = 'UNAVAILABLE' as const;
}

export class UnexpectedError extends AppError {
  readonly code = 'UNEXPECTED' as const;

  constructor(cause?: unknown) {
    super('Algo deu errado. Tente novamente.', cause);
  }
}

/** Normalizes any caught value into an `AppError`. */
export function toAppError(cause: unknown): AppError {
  if (cause instanceof AppError) return cause;
  return new UnexpectedError(cause);
}
