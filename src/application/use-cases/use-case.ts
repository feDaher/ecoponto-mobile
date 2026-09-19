import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

/**
 * Single contract for every use case.
 *
 * Application layer rules:
 *  - orchestrates domain + ports; knows nothing about React, Expo or HTTP;
 *  - returns `Result` — an expected error never becomes an exception;
 *  - one responsibility per class (one verb from the specification).
 */
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Result<Output, AppError>>;
}

/** Use case with no input parameters. */
export type NoInputUseCase<Output> = UseCase<void, Output>;
