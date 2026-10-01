import { z } from 'zod';

import { MIN_PASSWORD_LENGTH } from '@/application/use-cases/register-user.use-case';
import { USER_ROLE_LABEL, type UserRole } from '@/domain/value-objects/user-role';

const BRAZIL_COUNTRY_CODE = '55';

function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith(BRAZIL_COUNTRY_CODE)) {
    digits = digits.slice(BRAZIL_COUNTRY_CODE.length);
  }
  return digits;
}

function isPhoneValid(value: string): boolean {
  const digits = normalizePhone(value);
  if (digits.length !== 10 && digits.length !== 11) return false;

  const areaCode = Number(digits.slice(0, 2));
  if (areaCode < 11 || areaCode > 99) return false;

  if (digits.length === 11 && digits[2] !== '9') return false;
  return true;
}

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const AVAILABLE_ROLES: readonly {
  value: UserRole;
  label: string;
  icon: 'account' | 'recycle';
}[] = [
  { value: 'citizen', label: USER_ROLE_LABEL.citizen, icon: 'account' },
  { value: 'collector', label: USER_ROLE_LABEL.collector, icon: 'recycle' },
];

export const signUpSchema = z
  .object({
    name: z.string().min(3, 'Informe seu nome completo.'),
    email: z.string().min(1, 'Informe seu e-mail.').email('E-mail inválido.'),
    phone: z
      .string()
      .min(1, 'Informe seu telefone.')
      .refine(isPhoneValid, 'Telefone deve ter DDD + número (10 ou 11 dígitos).'),
    city: z.string().min(1, 'Informe sua cidade.'),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    role: z.enum(['citizen', 'collector'], {
      message: 'Selecione um perfil.',
    }),
    consent: z
      .boolean()
      .refine((value) => value === true, 'Você precisa concordar para continuar.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });
