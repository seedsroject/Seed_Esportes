'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, User, Phone, Calendar, MapPin, Search, LogOut, Plus, RefreshCw, Send, Copy, Check, X, MessageCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAdminSession, logoutAdmin } from '@/lib/auth';

interface Aluno {
  id: string;
  codigo: string;
  nome_aluno: string;
  data_nascimento: string;
  rg_cpf: string;
  nome_responsavel: string;
  cpf_responsavel: string;
  telefone: string;
  local: string;
  assinatura: string;
  pdf_url: string | null;
  link_enviado: boolean;
  created_at: string;
}

function generateCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getLinkFormulario(codigo: string) {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/form/${codigo}`;
}

function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.startsWith('55')) return numeros;
  if (numeros.startsWith('0')) return numeros.substring(1);
  return `55${numeros}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verificando, setVerificando] = useState(true);
  const [gerandoLink, setGerandoLink] = useState(false);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [codigoGerado, setCodigoGerado] = useState('');
  const [telefone, setTelefone] = useState('');
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function fetchAlunos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('created_at', { ascending: false });
      
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

  const handleGerarLink = async () => {
    setGerandoLink(true);
    try {
      const codigo = generateCodigo();
      const { error, data } = await supabase.from('alunos').insert({
        codigo,
      }).select();

      if (error) {
        console.error('Erro ao criar código:', error);
        alert('Erro ao criar código: ' + error.message);
      } else {
        setCodigoGerado(codigo);
        setModalAberto(true);
        setMensagem('Preencha o formulário de autorização do Seed Esportes');
        await fetchAlunos();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGerandoLink(false);
    }
  };

  const handleCopiarLink = async () => {
    const link = getLinkFormulario(codigoGerado);
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopiado(true);
    } catch {
      setLinkCopiado(false);
    }
  };

  const handleWhatsApp = () => {
    const link = getLinkFormulario(codigoGerado);
    const texto = encodeURIComponent(`${mensagem}: ${link}`);
    const tel = formatarTelefone(telefone);
    
    let url = 'https://web.whatsapp.com/send?text=' + texto;
    if (tel.length > 8) {
      url = `https://wa.me/${tel}?text=${texto}`;
    }
    
    window.open(url, '_blank');
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setCodigoGerado('');
    setTelefone('');
    setLinkCopiado(false);
  };

  const filteredAlunos = alunos.filter(
    (a) =>
      (a.nome_aluno || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.nome_responsavel || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.codigo || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const countPendentes = alunos.filter(a => !a.nome_aluno || a.nome_aluno === null).length;
  const countCompletos = alunos.filter(a => !!a.nome_aluno && a.nome_aluno !== null).length;

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
              <h2 className="text-lg font-bold text-gray-900">Enviar Link para Pais</h2>
              <button onClick={handleFecharModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="input-label">Código gerado</label>
                <div className="bg-gray-100 px-4 py-3 rounded-lg font-mono font-bold text-primary text-center text-lg">
                  {codigoGerado}
                </div>
              </div>

              <div>
                <label className="input-label">Telefone (opicional)</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="input-field"
                  placeholder="(11) 99999-9999"
                />
                <p className="text-xs text-gray-500 mt-1">Se preenchido, abre WhatsApp direto</p>
              </div>

              <div>
                <label className="input-label">Mensagem</label>
                <input
                  type="text"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCopiarLink}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  {linkCopiado ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar Link
                    </>
                  )}
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </button>
              </div>
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
                onClick={handleGerarLink}
                disabled={gerandoLink}
                className="btn-primary flex items-center gap-2"
              >
                {gerandoLink ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar Link para Pais
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
            <div className="text-sm text-gray-500">Total de Registros</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-yellow-600">{countPendentes}</div>
            <div className="text-sm text-gray-500">Aguardando Preenchimento</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{countCompletos}</div>
            <div className="text-sm text-gray-500">Formulários Completos</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar aluno, responsável ou código..."
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
            <p className="text-gray-500">Nenhum registro encontrado</p>
            <button onClick={handleGerarLink} className="btn-primary mt-4">
              Gerar primeiro código
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
                      <h3 className="font-semibold text-gray-900">{aluno.nome_aluno || 'Aguardando...'}</h3>
                      <p className="text-sm text-gray-500">Código: {aluno.codigo}</p>
                    </div>
                  </div>
                </div>

                {aluno.nome_aluno && aluno.nome_aluno !== null ? (
                  <>
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
                        <span>{aluno.telefone}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDate(aluno.created_at)}
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
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      Aguardando pais preencherem
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}