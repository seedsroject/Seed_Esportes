-- seed-termos/supabase-setup.sql
-- Execute este SQL no SQL Editor do Supabase

-- 1. Recriar tabela alunos com id_inscricao automático
DROP TABLE IF EXISTS public.alunos CASCADE;

CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_inscricao SERIAL,
    nome_aluno TEXT NOT NULL,
    data_nascimento DATE,
    rg_cpf TEXT,
    nome_responsavel TEXT,
    cpf_responsavel TEXT,
    telefone TEXT,
    local TEXT,
    assinatura TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow public read" ON public.alunos FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.alunos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.alunos FOR UPDATE USING (true);

-- 2. Criar bucket para PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('termos', 'termos', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Allow public upload to termos"
ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'termos');

CREATE POLICY "Allow public read from termos"
ON storage.objects
FOR SELECT USING (bucket_id = 'termos');

-- 3. Tabela admins (se não existir)
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE POLICY "Allow public read admins" ON public.admins FOR SELECT USING (true);

-- 4. Inserir admin
INSERT INTO public.admins (email, password_hash, nome) 
VALUES ('marciocampiaoinmetro@gmail.com', '53540404Lpo', 'Marcio')
ON CONFLICT (email) DO NOTHING;