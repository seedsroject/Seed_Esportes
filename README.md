# Seed Esportes - Termo de Autorização

[![Netlify Deploy](https://img.shields.io/badge/Netlify-Deploy-blue)](https://institutoseed.netlify.app)

Web app React onde pais/responsáveis assinam termo de autorização para atividade física e cessão de direitos de imagem para o centro de treinamento Seed Esportes.

## Funcionalidades

- Formulário com todos os campos do termo de autorização
- Assinatura digital via canvas
- Geração automática de PDF após envio
- Armazenamento no Supabase (banco + storage)
- Área administrativa para visualização e download dos PDFs

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase (Auth, Storage, Database)
- jsPDF (geração de PDF)
- react-signature-canvas

## Configuração

### 1. Supabase

Crie um projeto no [Supabase](https://supabase.com) e execute:

```sql
-- Criar tabela de alunos
CREATE TABLE public.alunos (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar bucket para PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('termos', 'termos', true);

-- Configurar políticas de acesso (ajuste conforme necessidade)
```

### 2. Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 3. Instalação

```bash
npm install
npm run dev
```

## Deploy

### Vercel

1. Conecte o repositório ao Vercel
2. Adicione as variáveis de ambiente no dashboard Vercel
3. Deploy será automático

### GitHub

O projeto está pronto para push ao GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/seed-termos.git
git push -M main
```

## Uso

1. **Acesso**: A academia fornece um código único por aluno
2. **Formulário**: Pais acessam `/form/CODIGO` e preenchem os dados
3. **Assinatura**: Assinam digitalmente no campo apropriado
4. **PDF**: Gerado automaticamente após envio
5. **Admin**: Acesse `/admin` para visualizar registros e baixar PDFs