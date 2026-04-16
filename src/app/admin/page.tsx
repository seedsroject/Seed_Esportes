'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FileText, Download, User, Phone, Calendar, MapPin, Search, LogOut, RefreshCw, Copy, Check, X, Trash2, MessageCircle, ExternalLink, Paperclip } from 'lucide-react';
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
  documentos_url: string | null;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verificando, setVerificando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
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

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a inscrição de ${nome}? Esta ação não pode ser desfeita.`)) {
      try {
        const alunoParaExcluir = alunos.find(a => a.id === id);
        
        // 1. Limpeza do Storage (Arquivos PDF e Documentos)
        const filesToDelete: string[] = [];
        if (alunoParaExcluir?.pdf_url) {
          const pdfFileName = alunoParaExcluir.pdf_url.split('/').pop();
          if (pdfFileName) filesToDelete.push(pdfFileName);
        }
        if (alunoParaExcluir?.documentos_url) {
          const docFileName = alunoParaExcluir.documentos_url.split('/').pop();
          if (docFileName) filesToDelete.push(docFileName);
        }

        if (filesToDelete.length > 0) {
          await supabase.storage.from('termos').remove(filesToDelete);
        }

        // 2. Exclusão no Banco de Dados com Validação de Contagem
        const { error, count } = await supabase
          .from('alunos')
          .delete({ count: 'exact' })
          .eq('id', id);
        
        if (error) throw error;

        if (count === 0) {
          alert('A exclusão foi bloqueada pelo banco de dados. Verifique se a política de DELETE no Supabase foi salva corretamente.');
          return;
        }
        
        // Sucesso real: Atualiza a lista localmente
        setAlunos(alunos.filter(a => a.id !== id));
      } catch (err) {
        console.error('Erro ao excluir:', err);
        alert('Erro ao excluir a inscrição. Tente novamente.');
      }
    }
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
    return new Date(date).toLocaleString('pt-BR');
  };

  const isImage = (url: string | null) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
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

      {/* --- MODALS --- */}
      
      {/* Modal de Link */}
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

               <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopiarLink}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {linkCopiado ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  {linkCopiado ? 'Copiado' : 'Copiar Link'}
                </button>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/inscricao`;
                    const text = encodeURIComponent(`Olá! Faça sua inscrição no Instituto Seed Esportes aqui: ${link}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Aluno */}
      {alunoSelecionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-container max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative border-primary/20">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{alunoSelecionado.nome_aluno}</h2>
                  <p className="text-primary font-mono text-sm">Registro #{alunoSelecionado.id_inscricao}</p>
                </div>
              </div>
              <button 
                onClick={() => setAlunoSelecionado(null)} 
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Dados do Aluno */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary/80 border-l-2 border-primary pl-3">Dados Cadastrais</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Data de Nascimento</span>
                    <div className="flex items-center gap-2 text-slate-200">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>{formatDate(alunoSelecionado.data_nascimento)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Documento (RG/CPF)</span>
                    <div className="flex items-center gap-2 text-slate-200">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>{alunoSelecionado.rg_cpf || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Local de Atuação</span>
                    <div className="flex items-center gap-2 text-slate-200">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{alunoSelecionado.local}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados do Responsável */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 border-l-2 border-emerald-500 pl-3">Responsável & Contato</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Nome do Responsável</span>
                    <div className="flex items-center gap-2 text-slate-200">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>{alunoSelecionado.nome_responsavel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">CPF do Responsável</span>
                    <div className="flex items-center gap-2 text-slate-200">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>{alunoSelecionado.cpf_responsavel || 'Não informado'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Telefone/WhatsApp</span>
                    <div className="flex items-center gap-2 text-slate-200">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{alunoSelecionado.telefone || 'Não informado'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos Enviados */}
            <div className="space-y-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 border-l-2 border-amber-500 pl-3">Documentação e Arquivos</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Termo de Autorização */}
                {alunoSelecionado.pdf_url && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-tighter">Termo de Autorização</p>
                        <p className="text-[10px] text-slate-500">PDF Assinado Digitalmente</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={alunoSelecionado.pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-3 h-3" /> Visualizar
                      </a>
                    </div>
                  </div>
                )}

                {/* Documento Anexo */}
                {alunoSelecionado.documentos_url ? (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-tighter">Anexo do Aluno</p>
                        <p className="text-[10px] text-slate-500">Documento de Identificação</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isImage(alunoSelecionado.documentos_url) ? (
                        <div className="w-full flex flex-col gap-3">
                           <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                              <Image 
                                src={alunoSelecionado.documentos_url} 
                                alt="Documento" 
                                fill 
                                className="object-cover"
                              />
                           </div>
                           <a 
                            href={alunoSelecionado.documentos_url} 
                            download
                            className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-2"
                          >
                            <Download className="w-3 h-3" /> Baixar Imagem
                          </a>
                        </div>
                      ) : (
                        <a 
                          href={alunoSelecionado.documentos_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-2"
                        >
                          <Download className="w-3 h-3" /> Baixar Documento
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-center border-dashed">
                    <p className="text-xs text-slate-500 italic">Nenhum anexo enviado</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 flex justify-end gap-4 border-t border-white/5 pt-6">
              <span className="text-[10px] text-slate-500 uppercase mr-auto flex items-center font-mono">
                Inscrito em: {formatDateTime(alunoSelecionado.created_at)}
              </span>
              <button 
                onClick={() => setAlunoSelecionado(null)}
                className="btn-secondary py-2.5 px-6 text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DASHBOARD BODY (Hidden if any modal is open) --- */}

      {!modalAberto && !alunoSelecionado && (
        <>
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
                  <div 
                    key={aluno.id} 
                    className="card group cursor-pointer hover:border-primary/50 transition-all duration-300"
                    onClick={() => setAlunoSelecionado(aluno)}
                  >
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(aluno.id, aluno.nome_aluno);
                        }}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300 relative z-20"
                        title="Excluir Inscrição"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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
                          onClick={(e) => e.stopPropagation()}
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
        </>
      )}
    </div>
  );
}