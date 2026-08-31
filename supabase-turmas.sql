-- seed-termos/supabase-turmas.sql
-- Execute este SQL no SQL Editor do Supabase para ativar o módulo de Turmas e Presença Digital

-- 1. Tabela de Turmas
CREATE TABLE IF NOT EXISTS public.turmas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_turma TEXT NOT NULL,
    modalidade TEXT NOT NULL,
    dias_semana TEXT[] NOT NULL DEFAULT '{}',
    horario_inicio TEXT NOT NULL,
    horario_fim TEXT NOT NULL,
    local TEXT,
    professor TEXT,
    limite_vagas INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read turmas" ON public.turmas;
DROP POLICY IF EXISTS "Allow public insert turmas" ON public.turmas;
DROP POLICY IF EXISTS "Allow public update turmas" ON public.turmas;
DROP POLICY IF EXISTS "Allow public delete turmas" ON public.turmas;

CREATE POLICY "Allow public read turmas" ON public.turmas FOR SELECT USING (true);
CREATE POLICY "Allow public insert turmas" ON public.turmas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update turmas" ON public.turmas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete turmas" ON public.turmas FOR DELETE USING (true);


-- 2. Tabela de Vinculação (Turma x Alunos)
CREATE TABLE IF NOT EXISTS public.turma_alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_turma_aluno UNIQUE (turma_id, aluno_id)
);

ALTER TABLE public.turma_alunos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read turma_alunos" ON public.turma_alunos;
DROP POLICY IF EXISTS "Allow public insert turma_alunos" ON public.turma_alunos;
DROP POLICY IF EXISTS "Allow public update turma_alunos" ON public.turma_alunos;
DROP POLICY IF EXISTS "Allow public delete turma_alunos" ON public.turma_alunos;

CREATE POLICY "Allow public read turma_alunos" ON public.turma_alunos FOR SELECT USING (true);
CREATE POLICY "Allow public insert turma_alunos" ON public.turma_alunos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update turma_alunos" ON public.turma_alunos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete turma_alunos" ON public.turma_alunos FOR DELETE USING (true);


-- 3. Tabela de Chamadas (Sessões diárias de chamada por turma)
CREATE TABLE IF NOT EXISTS public.chamadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_turma_data UNIQUE (turma_id, data)
);

ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Allow public insert chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Allow public update chamadas" ON public.chamadas;
DROP POLICY IF EXISTS "Allow public delete chamadas" ON public.chamadas;

CREATE POLICY "Allow public read chamadas" ON public.chamadas FOR SELECT USING (true);
CREATE POLICY "Allow public insert chamadas" ON public.chamadas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update chamadas" ON public.chamadas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete chamadas" ON public.chamadas FOR DELETE USING (true);


-- 4. Tabela de Presenças (Status individual de cada aluno na chamada)
CREATE TABLE IF NOT EXISTS public.presencas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chamada_id UUID REFERENCES public.chamadas(id) ON DELETE CASCADE NOT NULL,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('presente', 'ausente', 'justificado')),
    atestado_url TEXT,
    observacao_justificativa TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_chamada_aluno UNIQUE (chamada_id, aluno_id)
);

ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read presencas" ON public.presencas;
DROP POLICY IF EXISTS "Allow public insert presencas" ON public.presencas;
DROP POLICY IF EXISTS "Allow public update presencas" ON public.presencas;
DROP POLICY IF EXISTS "Allow public delete presencas" ON public.presencas;

CREATE POLICY "Allow public read presencas" ON public.presencas FOR SELECT USING (true);
CREATE POLICY "Allow public insert presencas" ON public.presencas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update presencas" ON public.presencas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete presencas" ON public.presencas FOR DELETE USING (true);
