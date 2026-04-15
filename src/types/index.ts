import { z } from 'zod';

export const termoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nomeAluno: z.string().min(1, 'Nome do aluno é obrigatório'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  rgCpf: z.string().min(1, 'RG/CPF é obrigatório'),
  nomeResponsavel: z.string().min(1, 'Nome do responsável é obrigatório'),
  cpfResponsavel: z.string().min(1, 'CPF do responsável é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  local: z.string().min(1, 'Local é obrigatório'),
  assinatura: z.string().min(1, 'Assinatura é obrigatória'),
});

export type TermoFormData = z.infer<typeof termoSchema>;

export interface Aluno {
  id: string;
  codigo: string;
  nomeAluno: string;
  dataNascimento: string;
  rgCpf: string;
  nomeResponsavel: string;
  cpfResponsavel: string;
  telefone: string;
  local: string;
  assinatura: string;
  pdfUrl?: string;
  createdAt: string;
}