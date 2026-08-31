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

export interface AutorizacaoViagem {
  id: string;
  aluno_id: string;
  pdf_url: string;
  documento_foto_url: string;
  created_at: string;
}

export interface Aluno {
  id: string;
  id_inscricao?: number;
  codigo?: string;
  nome_aluno: string;
  nomeAluno?: string;
  data_nascimento?: string;
  dataNascimento?: string;
  rg_cpf?: string;
  rgCpf?: string;
  nome_responsavel?: string;
  nomeResponsavel?: string;
  cpf_responsavel?: string;
  cpfResponsavel?: string;
  telefone?: string;
  local?: string;
  assinatura?: string;
  pdf_url?: string | null;
  pdfUrl?: string;
  documentos_url?: string | null;
  created_at?: string;
  createdAt?: string;
  autorizacoes_viagem?: AutorizacaoViagem[];
}

export interface Turma {
  id: string;
  nome_turma: string;
  modalidade: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  local?: string;
  professor?: string;
  limite_vagas: number;
  created_at: string;
  turma_alunos?: TurmaAluno[];
  alunos_count?: number;
}

export interface TurmaAluno {
  id: string;
  turma_id: string;
  aluno_id: string;
  created_at: string;
  aluno?: Aluno;
}

export interface Chamada {
  id: string;
  turma_id: string;
  data: string;
  observacao?: string;
  created_at: string;
  presencas?: Presenca[];
}

export interface Presenca {
  id: string;
  chamada_id: string;
  aluno_id: string;
  status: 'presente' | 'ausente' | 'justificado';
  atestado_url?: string | null;
  observacao_justificativa?: string | null;
  created_at: string;
  aluno?: Aluno;
}