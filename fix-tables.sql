-- Corrigir tabela alunos para aceitar dados parciais
-- Execute este SQL no Supabase SQL Editor

-- Se a tabela existir, dropar e recriar:
DROP TABLE IF EXISTS public.alunos CASCADE;

-- Criar nova tabela com campos opcionais
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nome_aluno TEXT,
    data_nascimento DATE,
    rg_cpf TEXT,
    nome_responsavel TEXT,
    cpf_responsavel TEXT,
    telefone TEXT,
    local TEXT,
    assinatura TEXT,
    pdf_url TEXT,
    link_enviado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.alunos
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.alunos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.alunos
    FOR UPDATE USING (true);