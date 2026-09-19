import { BusinessRuleError, type AppError } from '@/core/errors';
import { err, type Result } from '@/core/result';
import type { CollectionPoint } from '@/domain/entities/collection-point';

import type { ExternalNavigationGateway } from '../ports/external-navigation.gateway';
import type { UseCase } from './use-case';

export type ContactPointWhatsAppInput = {
  readonly point: CollectionPoint;
  readonly message?: string;
};

/**
 * RB08 — Direct WhatsApp contact channel.
 * "...as long as the collector/cooperative has provided **and authorized**
 * displaying the number."
 *
 * Authorization is checked here, not just by hiding the button on screen:
 * the rule applies to any path that reaches this use case.
 */
export class ContactPointWhatsAppUseCase implements UseCase<ContactPointWhatsAppInput, void> {
  constructor(private readonly navigation: ExternalNavigationGateway) {}

  async execute(input: ContactPointWhatsAppInput): Promise<Result<void, AppError>> {
    const { point, message } = input;

    if (!point.isWhatsAppAvailable || !point.whatsAppContact) {
      return err(
        new BusinessRuleError(
          'RB08',
          'Este ponto de coleta não disponibilizou contato por WhatsApp.',
        ),
      );
    }

    return this.navigation.openWhatsApp({
      phone: point.whatsAppContact.forWhatsApp,
      message:
        message ??
        `Olá! Encontrei o ponto "${point.name}" no EcoPonto Digital e gostaria de tirar uma dúvida sobre o descarte.`,
    });
  }
}
