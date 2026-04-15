-- seed-termos/supabase-setup.sql
-- Execute este SQL no SQL Editor do Supabase para configurar o banco de dados

-- 1. Criar tabela de alunos (atualizada com link_enviado)
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nome_aluno TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    rg_cpf TEXT NOT NULL,
    nome_responsavel TEXT NOT NULL,
    cpf_responsavel TEXT NOT NULL,
    telefone TEXT NOT NULL,
    local TEXT NOT NULL,
    assinatura TEXT,
    pdf_url TEXT,
    link_enviado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (opcional)
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

-- 3. Política de acesso público para leitura
CREATE POLICY "Allow public read" ON public.alunos
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.alunos
    FOR INSERT WITH CHECK (true);

-- 4. Criar bucket para armazenamento de PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('termos', 'termos', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 5. Políticas de acesso ao storage
CREATE POLICY "Allow public upload to termos"
ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'termos');

CREATE POLICY "Allow public read from termos"
ON storage.objects
FOR SELECT USING (bucket_id = 'termos');

-- 6. Criar tabela de admins
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Política de acesso para admins
CREATE POLICY "Allow public read admins" ON public.admins
    FOR SELECT USING (true);

-- 8. Inserir seu acesso admin
INSERT INTO public.admins (email, password_hash, nome) 
VALUES ('marciocampiaoinmetro@gmail.com', '53540404Lpo', 'Marcio');

-- Verificar se foi criado
SELECT * FROM public.admins;