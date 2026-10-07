import { z } from 'zod';

export type SignInFormData = z.infer<typeof signInSchema>;

export const signInSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});
