'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen bg-gray-50">
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Link para Inscrição</h2>
              <button onClick={handleFecharModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Copie este link e envie para os pais/responsáveis:</p>
                <code className="block bg-white px-4 py-3 rounded-lg font-mono text-primary text-center text-lg break-all">
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
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Link
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Os pais preencherão o formulário e o aluno aparecerá automaticamente na lista
              </p>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Seed Esportes</h1>
              <p className="text-sm text-gray-500">Termos de Autorização</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalAberto(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Gerar Link
              </button>
              <button
                onClick={fetchAlunos}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-primary">{alunos.length}</div>
            <div className="text-sm text-gray-500">Total de Inscritos</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-gray-600">-</div>
            <div className="text-sm text-gray-500">Aguardando</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{alunos.filter(a => a.pdf_url).length}</div>
            <div className="text-sm text-gray-500">Formulários Completos</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar aluno ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          </div>
        ) : filteredAlunos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum aluno inscrito ainda</p>
            <button onClick={() => setModalAberto(true)} className="btn-primary mt-4">
              Gerar Link para Pais
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlunos.map((aluno) => (
              <div key={aluno.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{aluno.nome_aluno}</h3>
                      <p className="text-sm text-gray-500">#{aluno.id_inscricao || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(aluno.data_nascimento)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{aluno.nome_responsavel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{aluno.telefone || '-'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatDateTime(aluno.created_at)}
                  </span>
                  {aluno.pdf_url && (
                    <a
                      href={aluno.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center gap-2 text-sm"
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