'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FileText, Download, User, Phone, Calendar, MapPin, Search, LogOut, RefreshCw, Copy, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAdminSession, logoutAdmin } from '@/lib/auth';

interface Aluno {
  id: string;
  id_inscricao: number;
  nome_aluno: string;
  data_nascimento: string;
  rg_cpf: string;
  nome_responsavel: string;
  cpf_responsavel: string;
  telefone: string;
  local: string;
  assinatura: string;
  pdf_url: string | null;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verificando, setVerificando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  async function fetchAlunos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('id_inscricao', { ascending: false });
      
      if (!error && data) {
        setAlunos(data);
      }
    } catch (err) {
      console.error('Erro:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      router.push('/login');
    } else {
      setVerificando(false);
      fetchAlunos();
    }
  }, [router]);

  const handleLogout = () => {
    logoutAdmin();
    router.push('/login');
  };

  const handleCopiarLink = async () => {
    const link = `${window.location.origin}/inscricao`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 3000);
    } catch {
      setLinkCopiado(false);
    }
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setLinkCopiado(false);
  };

  const filteredAlunos = alunos.filter(
    (a) =>
      (a.nome_aluno || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.nome_responsavel || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (verificando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />

      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-container max-w-md w-full p-8 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Link de Acesso</h2>
              <button onClick={handleFecharModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <p className="text-sm text-slate-400 mb-3 text-center">Envie este link para os pais/responsáveis:</p>
                <code className="block bg-black/40 px-4 py-4 rounded-xl font-mono text-primary text-center text-sm break-all border border-primary/20 shadow-inner">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/inscricao
                </code>
              </div>

              <button
                onClick={handleCopiarLink}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {linkCopiado ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copiado para área de transferência
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Link de Inscrição
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-slate-950/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.3)]"
              />
            </div>
            <div className="hidden sm:block h-8 w-px bg-white/10 mx-2" />
            <div className="hidden sm:block">
              <p className="text-slate-400 font-medium tracking-widest uppercase text-[10px]">Dashboard</p>
              <h1 className="text-lg font-bold text-white leading-tight">Gestão de Autorizações</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalAberto(true)}
              className="btn-primary flex items-center gap-2 py-2.5 px-5 text-sm"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden md:inline">Gerar Link</span>
            </button>
            <button
              onClick={fetchAlunos}
              className="btn-secondary flex items-center gap-2 p-2.5"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2 p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card group">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400 font-medium">Inscritos</div>
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="text-4xl font-black text-white group-hover:text-primary transition-colors">{alunos.length}</div>
          </div>
          <div className="card group">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400 font-medium">Pendentes</div>
              <RefreshCw className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-4xl font-black text-slate-500">-</div>
          </div>
          <div className="card group">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-400 font-medium">Documentos</div>
              <FileText className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-4xl font-black text-white group-hover:text-emerald-500 transition-colors">{alunos.filter(a => a.pdf_url).length}</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar aluno ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-12 py-4 text-base"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          </div>
        ) : filteredAlunos.length === 0 ? (
          <div className="text-center py-20 card border-dashed">
            <User className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Nenhum aluno encontrado</p>
            <button onClick={() => setModalAberto(true)} className="btn-primary mt-6">
              Gerar Link de Inscrição
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlunos.map((aluno) => (
              <div key={aluno.id} className="card group">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-primary transition-colors">{aluno.nome_aluno}</h3>
                      <p className="text-xs text-slate-500 font-mono">#{aluno.id_inscricao || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{formatDate(aluno.data_nascimento)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="truncate">{aluno.nome_responsavel}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{aluno.telefone || '-'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {formatDateTime(aluno.created_at)}
                  </span>
                  {aluno.pdf_url && (
                    <a
                      href={aluno.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary py-1.5 px-3 flex items-center gap-2 text-xs"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}