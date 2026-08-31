'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  FileText, Download, User, Phone, Calendar, MapPin, Search, LogOut, RefreshCw, 
  Copy, Check, X, Trash2, MessageCircle, ExternalLink, Paperclip, Plus, Users, 
  Clock, CheckCircle2, XCircle, AlertCircle, Upload, BarChart3, UserPlus, UserMinus, ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAdminSession, logoutAdmin } from '@/lib/auth';
import { Aluno, Turma, Chamada, Presenca } from '@/types';

type ActiveTab = 'inscricoes' | 'turmas' | 'chamada' | 'relatorios';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('inscricoes');
  
  // Data states
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  
  // Loading & Filter states
  const [loading, setLoading] = useState(true);
  const [verificando, setVerificando] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [modalLinkAberto, setModalLinkAberto] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  
  // Turma Modals
  const [modalNovaTurma, setModalNovaTurma] = useState(false);
  const [modalEnturmacao, setModalEnturmacao] = useState<Turma | null>(null);
  const [turmaForm, setTurmaForm] = useState({
    nome_turma: '',
    modalidade: '',
    dias_semana: [] as string[],
    horario_inicio: '08:00',
    horario_fim: '09:30',
    local: '',
    professor: '',
    limite_vagas: 30,
  });
  
  // Chamada / Presença Digital states
  const [selectedTurmaChamada, setSelectedTurmaChamada] = useState<string>('');
  const [selectedDataChamada, setSelectedDataChamada] = useState<string>(new Date().toISOString().split('T')[0]);
  const [chamadaAtual, setChamadaAtual] = useState<Chamada | null>(null);
  const [chamadaState, setChamadaState] = useState<Record<string, {
    status: 'presente' | 'ausente' | 'justificado';
    atestado_url?: string;
    observacao_justificativa?: string;
  }>>({});
  const [modalAtestadoAlunoId, setModalAtestadoAlunoId] = useState<string | null>(null);
  const [uploadingAtestado, setUploadingAtestado] = useState(false);
  const [savingChamada, setSavingChamada] = useState(false);

  // Fetch all initial data
  async function fetchAllData() {
    setLoading(true);
    try {
      // 1. Alunos
      const { data: dataAlunos } = await supabase
        .from('alunos')
        .select('*, autorizacoes_viagem(*)')
        .order('id_inscricao', { ascending: false });
      if (dataAlunos) setAlunos(dataAlunos as Aluno[]);

      // 2. Turmas com turma_alunos e dados do aluno
      const { data: dataTurmas } = await supabase
        .from('turmas')
        .select('*, turma_alunos(*, aluno:alunos(*))')
        .order('created_at', { ascending: false });
      if (dataTurmas) setTurmas(dataTurmas as Turma[]);

      // 3. Chamadas
      const { data: dataChamadas } = await supabase
        .from('chamadas')
        .select('*, presencas(*, aluno:alunos(*))')
        .order('data', { ascending: false });
      if (dataChamadas) setChamadas(dataChamadas as Chamada[]);

      // 4. Presenças globais
      const { data: dataPresencas } = await supabase
        .from('presencas')
        .select('*, aluno:alunos(*), chamada:chamadas(*)');
      if (dataPresencas) setPresencas(dataPresencas as Presenca[]);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      router.push('/login');
    } else {
      setVerificando(false);
      fetchAllData();
    }
  }, [router]);

  const handleLogout = () => {
    logoutAdmin();
    router.push('/login');
  };

  // --- ALUNOS ACTIONS ---
  const handleDeleteAluno = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a inscrição de ${nome}? Esta ação não pode ser desfeita.`)) {
      try {
        const alunoParaExcluir = alunos.find(a => a.id === id);
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

        const { error, count } = await supabase
          .from('alunos')
          .delete({ count: 'exact' })
          .eq('id', id);
        
        if (error) throw error;
        if (count === 0) {
          alert('A exclusão foi bloqueada no banco de dados. Verifique as permissões de DELETE no Supabase.');
          return;
        }
        setAlunos(alunos.filter(a => a.id !== id));
      } catch (err) {
        console.error('Erro ao excluir aluno:', err);
        alert('Erro ao excluir a inscrição.');
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

  // --- TURMAS ACTIONS ---
  const handleSaveTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turmaForm.nome_turma || !turmaForm.modalidade) {
      alert('Preencha o nome e a modalidade da turma.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('turmas')
        .insert([turmaForm])
        .select('*, turma_alunos(*)');

      if (error) throw error;
      if (data) {
        setTurmas([data[0] as Turma, ...turmas]);
        setModalNovaTurma(false);
        setTurmaForm({
          nome_turma: '',
          modalidade: '',
          dias_semana: [],
          horario_inicio: '08:00',
          horario_fim: '09:30',
          local: '',
          professor: '',
          limite_vagas: 30,
        });
      }
    } catch (err) {
      console.error('Erro ao criar turma:', err);
      alert('Erro ao criar a turma no Supabase. Certifique-se que o script supabase-turmas.sql foi executado.');
    }
  };

  const handleDeleteTurma = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a turma "${nome}"?`)) {
      try {
        const { error } = await supabase.from('turmas').delete().eq('id', id);
        if (error) throw error;
        setTurmas(turmas.filter(t => t.id !== id));
      } catch (err) {
        console.error('Erro ao excluir turma:', err);
        alert('Erro ao excluir a turma.');
      }
    }
  };

  const handleToggleAlunoTurma = async (turmaId: string, alunoId: string) => {
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;

    const matriculado = turma.turma_alunos?.some(ta => ta.aluno_id === alunoId);

    try {
      if (matriculado) {
        // Remover aluno da turma
        const { error } = await supabase
          .from('turma_alunos')
          .delete()
          .eq('turma_id', turmaId)
          .eq('aluno_id', alunoId);

        if (error) throw error;

        // Atualizar state local
        const updatedTurmas = turmas.map(t => {
          if (t.id === turmaId) {
            return {
              ...t,
              turma_alunos: (t.turma_alunos || []).filter(ta => ta.aluno_id !== alunoId)
            };
          }
          return t;
        });
        setTurmas(updatedTurmas);
        if (modalEnturmacao?.id === turmaId) {
          setModalEnturmacao(updatedTurmas.find(t => t.id === turmaId) || null);
        }
      } else {
        // Adicionar aluno na turma
        const { data, error } = await supabase
          .from('turma_alunos')
          .insert([{ turma_id: turmaId, aluno_id: alunoId }])
          .select('*, aluno:alunos(*)');

        if (error) throw error;

        const updatedTurmas = turmas.map(t => {
          if (t.id === turmaId) {
            return {
              ...t,
              turma_alunos: [...(t.turma_alunos || []), data[0]]
            };
          }
          return t;
        });
        setTurmas(updatedTurmas);
        if (modalEnturmacao?.id === turmaId) {
          setModalEnturmacao(updatedTurmas.find(t => t.id === turmaId) || null);
        }
      }
    } catch (err) {
      console.error('Erro ao alternar matricula:', err);
      alert('Erro ao atualizar a lista de alunos da turma.');
    }
  };

  // --- CHAMADA / PRESENÇA DIGITAL ACTIONS ---
  const handleCarregarOuCriarChamada = async () => {
    if (!selectedTurmaChamada || !selectedDataChamada) return;

    const turma = turmas.find(t => t.id === selectedTurmaChamada);
    if (!turma || !turma.turma_alunos || turma.turma_alunos.length === 0) {
      alert('Esta turma ainda não possui alunos matriculados.');
      return;
    }

    try {
      // Buscar chamada existente para a data e turma
      let { data: chamadasExistentes, error } = await supabase
        .from('chamadas')
        .select('*, presencas(*, aluno:alunos(*))')
        .eq('turma_id', selectedTurmaChamada)
        .eq('data', selectedDataChamada);

      if (error) throw error;

      let chamada: Chamada;

      if (!chamadasExistentes || chamadasExistentes.length === 0) {
        // Criar chamada
        const { data: novaChamada, error: errCriar } = await supabase
          .from('chamadas')
          .insert([{ turma_id: selectedTurmaChamada, data: selectedDataChamada }])
          .select();

        if (errCriar) throw errCriar;
        chamada = novaChamada[0] as Chamada;
      } else {
        chamada = chamadasExistentes[0] as Chamada;
      }

      setChamadaAtual(chamada);

      // Preencher o estado local de presenças
      const initialState: Record<string, { status: 'presente' | 'ausente' | 'justificado'; atestado_url?: string; observacao_justificativa?: string }> = {};

      turma.turma_alunos.forEach(ta => {
        const presencaExistente = chamada.presencas?.find(p => p.aluno_id === ta.aluno_id);
        if (presencaExistente) {
          initialState[ta.aluno_id] = {
            status: presencaExistente.status,
            atestado_url: presencaExistente.atestado_url || undefined,
            observacao_justificativa: presencaExistente.observacao_justificativa || undefined,
          };
        } else {
          initialState[ta.aluno_id] = { status: 'presente' };
        }
      });

      setChamadaState(initialState);
    } catch (err) {
      console.error('Erro ao carregar chamada:', err);
      alert('Erro ao carregar a lista de presença. Verifique se o script supabase-turmas.sql foi executado.');
    }
  };

  const handleUploadAtestado = async (alunoId: string, file: File) => {
    setUploadingAtestado(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `atestados/${alunoId}_${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('termos')
        .upload(fileName, file);

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('termos')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      setChamadaState(prev => ({
        ...prev,
        [alunoId]: {
          ...prev[alunoId],
          status: 'justificado',
          atestado_url: publicUrl,
        }
      }));
      setModalAtestadoAlunoId(null);
    } catch (err) {
      console.error('Erro ao subir atestado:', err);
      alert('Erro ao realizar upload do atestado.');
    }
    setUploadingAtestado(false);
  };

  const handleSalvarChamada = async () => {
    if (!chamadaAtual) return;
    setSavingChamada(true);
    try {
      const upsertData = Object.entries(chamadaState).map(([alunoId, data]) => ({
        chamada_id: chamadaAtual.id,
        aluno_id: alunoId,
        status: data.status,
        atestado_url: data.atestado_url || null,
        observacao_justificativa: data.observacao_justificativa || null,
      }));

      const { error } = await supabase
        .from('presencas')
        .upsert(upsertData, { onConflict: 'chamada_id,aluno_id' });

      if (error) throw error;

      alert('Chamada e presença registradas com sucesso!');
      fetchAllData();
    } catch (err) {
      console.error('Erro ao salvar chamada:', err);
      alert('Erro ao salvar a chamada.');
    }
    setSavingChamada(false);
  };

  // --- FILTERS & UTILS ---
  const filteredAlunos = alunos.filter(
    (a) =>
      (a.nome_aluno || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.nome_responsavel || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  };

  const isImage = (url?: string | null) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
  };

  const toggleDiaSemana = (dia: string) => {
    setTurmaForm(prev => {
      const exists = prev.dias_semana.includes(dia);
      return {
        ...prev,
        dias_semana: exists 
          ? prev.dias_semana.filter(d => d !== dia)
          : [...prev.dias_semana, dia]
      };
    });
  };

  if (verificando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]" />

      {/* --- MODALS DA ABA INSCRIÇÕES --- */}
      {modalLinkAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-container max-w-xl w-full p-8 shadow-2xl relative border-primary/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Links de Acesso Rápido</h2>
              <button onClick={() => setModalLinkAberto(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <p className="text-sm text-slate-400 mb-2 font-medium">Termo de Inscrição:</p>
                <code className="block bg-black/40 px-4 py-3 rounded-xl font-mono text-primary text-sm break-all border border-primary/20 shadow-inner">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/inscricao
                </code>
                
                <p className="text-sm text-slate-400 mt-5 mb-2 font-medium">Autorização de Viagem:</p>
                <code className="block bg-black/40 px-4 py-3 rounded-xl font-mono text-emerald-400 text-sm break-all border border-emerald-500/20 shadow-inner">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/autorizacao-viagem
                </code>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleCopiarLink} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {linkCopiado ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {linkCopiado ? 'Copiado' : 'Copiar Link Inscrição'}
                </button>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/inscricao`;
                    const text = encodeURIComponent(`Olá! Faça sua inscrição no Instituto Seed Esportes aqui: ${link}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white px-5 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-5 h-5" /> WhatsApp Inscrição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes Aluno */}
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
                  <p className="text-primary font-mono text-sm">Registro #{alunoSelecionado.id_inscricao || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => setAlunoSelecionado(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary border-l-2 border-primary pl-3">Dados Cadastrais</h3>
                <div className="text-sm space-y-2">
                  <p className="text-slate-400">Nascimento: <span className="text-white font-medium">{formatDate(alunoSelecionado.data_nascimento)}</span></p>
                  <p className="text-slate-400">RG/CPF: <span className="text-white font-medium">{alunoSelecionado.rg_cpf || '-'}</span></p>
                  <p className="text-slate-400">Local/Polo: <span className="text-white font-medium">{alunoSelecionado.local || '-'}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 border-l-2 border-emerald-400 pl-3">Responsável</h3>
                <div className="text-sm space-y-2">
                  <p className="text-slate-400">Nome: <span className="text-white font-medium">{alunoSelecionado.nome_responsavel || '-'}</span></p>
                  <p className="text-slate-400">CPF: <span className="text-white font-medium">{alunoSelecionado.cpf_responsavel || '-'}</span></p>
                  <p className="text-slate-400">Telefone: <span className="text-white font-medium">{alunoSelecionado.telefone || '-'}</span></p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 border-l-2 border-amber-400 pl-3">Documentos Anexados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {alunoSelecionado.pdf_url && (
                  <a href={alunoSelecionado.pdf_url} target="_blank" rel="noreferrer" className="btn-secondary text-xs flex items-center justify-center gap-2 py-3">
                    <FileText className="w-4 h-4 text-primary" /> Visualizar Termo (PDF)
                  </a>
                )}
                {alunoSelecionado.documentos_url && (
                  <a href={alunoSelecionado.documentos_url} target="_blank" rel="noreferrer" className="btn-secondary text-xs flex items-center justify-center gap-2 py-3">
                    <Paperclip className="w-4 h-4 text-emerald-400" /> Documento de Identificação
                  </a>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <button onClick={() => setAlunoSelecionado(null)} className="btn-secondary px-6 py-2">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL NOVA TURMA --- */}
      {modalNovaTurma && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-container max-w-xl w-full p-8 shadow-2xl relative border-primary/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Nova Turma</h2>
              </div>
              <button onClick={() => setModalNovaTurma(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveTurma} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Nome da Turma *</label>
                <input
                  type="text"
                  placeholder="Ex: Futebol Manhã Sub-12"
                  value={turmaForm.nome_turma}
                  onChange={e => setTurmaForm({ ...turmaForm, nome_turma: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Modalidade / Esporte *</label>
                  <input
                    type="text"
                    placeholder="Ex: Futebol, Jiu-Jitsu, Basquete"
                    value={turmaForm.modalidade}
                    onChange={e => setTurmaForm({ ...turmaForm, modalidade: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Professor Responsável</label>
                  <input
                    type="text"
                    placeholder="Ex: Prof. Márcio"
                    value={turmaForm.professor}
                    onChange={e => setTurmaForm({ ...turmaForm, professor: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-2">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(dia => {
                    const active = turmaForm.dias_semana.includes(dia);
                    return (
                      <button
                        type="button"
                        key={dia}
                        onClick={() => toggleDiaSemana(dia)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          active 
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Horário Início</label>
                  <input
                    type="time"
                    value={turmaForm.horario_inicio}
                    onChange={e => setTurmaForm({ ...turmaForm, horario_inicio: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Horário Fim</label>
                  <input
                    type="time"
                    value={turmaForm.horario_fim}
                    onChange={e => setTurmaForm({ ...turmaForm, horario_fim: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Limite Vagas</label>
                  <input
                    type="number"
                    min="1"
                    value={turmaForm.limite_vagas}
                    onChange={e => setTurmaForm({ ...turmaForm, limite_vagas: parseInt(e.target.value) || 30 })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Local / Polo</label>
                <input
                  type="text"
                  placeholder="Ex: Polo Inmetro / Quadra Principal"
                  value={turmaForm.local}
                  onChange={e => setTurmaForm({ ...turmaForm, local: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button type="button" onClick={() => setModalNovaTurma(false)} className="btn-secondary py-2.5 px-5">Cancelar</button>
                <button type="submit" className="btn-primary py-2.5 px-6">Salvar Turma</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ENTURMAÇÃO (Matricular Alunos Cadastrados) --- */}
      {modalEnturmacao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-container max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative border-indigo-500/30">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs uppercase font-mono text-primary font-bold">Gerenciar Alunos</span>
                <h2 className="text-2xl font-bold text-white">{modalEnturmacao.nome_turma}</h2>
                <p className="text-xs text-slate-400">{modalEnturmacao.modalidade} • {modalEnturmacao.horario_inicio} às {modalEnturmacao.horario_fim}</p>
              </div>
              <button onClick={() => setModalEnturmacao(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-sm text-slate-300 mb-4">
              Selecione os alunos já cadastrados no sistema para adicionar ou remover desta turma:
            </p>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {alunos.map(aluno => {
                const isMatriculado = modalEnturmacao.turma_alunos?.some(ta => ta.aluno_id === aluno.id);

                return (
                  <div 
                    key={aluno.id}
                    className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isMatriculado 
                        ? 'bg-primary/15 border-primary/40' 
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isMatriculado ? 'bg-primary text-white' : 'bg-white/10 text-slate-400'}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{aluno.nome_aluno}</p>
                        <p className="text-xs text-slate-400">Resp: {aluno.nome_responsavel || 'Não informado'} • Polo: {aluno.local || '-'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleAlunoTurma(modalEnturmacao.id, aluno.id)}
                      className={`w-full sm:w-auto btn-secondary text-xs px-3 py-2 flex items-center justify-center gap-2 ${
                        isMatriculado 
                          ? 'border-red-500/40 text-red-400 hover:bg-red-500/10' 
                          : 'border-primary/40 text-primary hover:bg-primary/10'
                      }`}
                    >
                      {isMatriculado ? (
                        <>
                          <UserMinus className="w-4 h-4" /> Remover da Turma
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" /> Matricular
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs font-mono text-slate-400">
                Matriculados: <strong className="text-primary font-bold">{modalEnturmacao.turma_alunos?.length || 0}</strong> / {modalEnturmacao.limite_vagas} vagas
              </span>
              <button onClick={() => setModalEnturmacao(null)} className="btn-primary px-6 py-2">
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ATESTADO (Justificativa de Ausência) --- */}
      {modalAtestadoAlunoId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-container max-w-md w-full p-6 shadow-2xl relative border-amber-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Anexar Atestado / Justificativa</h3>
              </div>
              <button onClick={() => setModalAtestadoAlunoId(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Motivo / Observação</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Consulta médica, atestado médico de 2 dias..."
                  value={chamadaState[modalAtestadoAlunoId]?.observacao_justificativa || ''}
                  onChange={e => {
                    const text = e.target.value;
                    setChamadaState(prev => ({
                      ...prev,
                      [modalAtestadoAlunoId]: {
                        ...prev[modalAtestadoAlunoId],
                        observacao_justificativa: text,
                      }
                    }));
                  }}
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Upload da Foto/PDF do Atestado</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadAtestado(modalAtestadoAlunoId, e.target.files[0]);
                    }
                  }}
                  disabled={uploadingAtestado}
                  className="input-field text-xs cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30"
                />
                {uploadingAtestado && (
                  <p className="text-xs text-amber-400 flex items-center gap-2 mt-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enviando arquivo...
                  </p>
                )}
                {chamadaState[modalAtestadoAlunoId]?.atestado_url && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Atestado anexado com sucesso!
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button 
                  onClick={() => setModalAtestadoAlunoId(null)}
                  className="btn-primary text-xs py-2 px-5"
                >
                  Concluído
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER PRINCIPAL COM NAVEGAÇÃO POR ABAS --- */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                />
              </div>
              <div>
                <p className="text-slate-400 font-medium tracking-widest uppercase text-[10px]">Painel Administrativo</p>
                <h1 className="text-base sm:text-lg font-bold text-white">Seed Esportes</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <button onClick={() => setModalLinkAberto(true)} className="btn-primary flex items-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 text-xs">
                <Copy className="w-4 h-4" /> <span>Links</span>
              </button>
              <button onClick={fetchAllData} className="btn-secondary p-2" title="Atualizar dados">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={handleLogout} className="btn-secondary p-2 text-red-400 hover:bg-red-500/10" title="Sair">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BARRA DE NAVEGAÇÃO DE ABAS */}
          <nav className="flex items-center gap-2 overflow-x-auto border-t border-white/10 pt-3 no-scrollbar pb-1">
            <button
              onClick={() => setActiveTab('inscricoes')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                activeTab === 'inscricoes'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              Inscrições & Alunos
            </button>

            <button
              onClick={() => setActiveTab('turmas')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                activeTab === 'turmas'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              Gestão de Turmas
            </button>

            <button
              onClick={() => setActiveTab('chamada')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                activeTab === 'chamada'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Presença Digital (Chamada)
            </button>

            <button
              onClick={() => setActiveTab('relatorios')}
              className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
                activeTab === 'relatorios'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Relatório de Frequência
            </button>
          </nav>
        </div>
      </header>

      {/* --- CONTEÚDO PRINCIPAL (MUDANÇA DE ABA) --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">

        {/* 1. ABA DE INSCRIÇÕES / ALUNOS */}
        {activeTab === 'inscricoes' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center justify-between mb-2 text-slate-400 text-xs font-medium">
                  Total de Alunos
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="text-3xl font-black text-white">{alunos.length}</div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-2 text-slate-400 text-xs font-medium">
                  Termos em PDF
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400">{alunos.filter(a => a.pdf_url).length}</div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-2 text-slate-400 text-xs font-medium">
                  Turmas Ativas
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-black text-indigo-400">{turmas.length}</div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por aluno ou responsável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12 py-3 text-sm"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              </div>
            ) : filteredAlunos.length === 0 ? (
              <div className="text-center py-16 card border-dashed">
                <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum aluno cadastrado encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAlunos.map(aluno => (
                  <div
                    key={aluno.id}
                    onClick={() => setAlunoSelecionado(aluno)}
                    className="card hover:border-primary/50 cursor-pointer transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{aluno.nome_aluno}</h3>
                          <p className="text-xs text-slate-500 font-mono">#{aluno.id_inscricao || 'N/A'}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAluno(aluno.id, aluno.nome_aluno);
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs text-slate-400">
                      <p>Nascimento: <span className="text-slate-200">{formatDate(aluno.data_nascimento)}</span></p>
                      <p>Responsável: <span className="text-slate-200">{aluno.nome_responsavel}</span></p>
                      <p>Telefone: <span className="text-slate-200">{aluno.telefone || '-'}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. ABA DE GESTÃO DE TURMAS */}
        {activeTab === 'turmas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Turmas & Programação</h2>
                <p className="text-xs text-slate-400">Programe os horários, locais e aloque os alunos nas turmas</p>
              </div>
              <button
                onClick={() => setModalNovaTurma(true)}
                className="btn-primary flex items-center gap-2 py-2.5 px-5 text-sm"
              >
                <Plus className="w-4 h-4" /> Nova Turma
              </button>
            </div>

            {turmas.length === 0 ? (
              <div className="text-center py-16 card border-dashed">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-base mb-4">Nenhuma turma cadastrada ainda</p>
                <button onClick={() => setModalNovaTurma(true)} className="btn-primary">
                  Cadastrar Primeira Turma
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {turmas.map(turma => {
                  const numMatriculados = turma.turma_alunos?.length || 0;
                  return (
                    <div key={turma.id} className="card relative flex flex-col justify-between border-indigo-500/20 hover:border-indigo-500/50">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {turma.modalidade}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-2">{turma.nome_turma}</h3>
                          </div>
                          <button
                            onClick={() => handleDeleteTurma(turma.id, turma.nome_turma)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                            title="Excluir Turma"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs text-slate-300 mb-6">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <span>{turma.horario_inicio} às {turma.horario_fim}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            <span>{turma.dias_semana?.join(', ') || 'Dias a definir'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-400" />
                            <span>{turma.local || 'Local não definido'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-400" />
                            <span>Professor: {turma.professor || 'Não informado'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-slate-400">Alunos: </span>
                          <strong className="text-white font-bold">{numMatriculados} / {turma.limite_vagas}</strong>
                        </div>
                        <button
                          onClick={() => setModalEnturmacao(turma)}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Matricular
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. ABA DE PRESENÇA DIGITAL (CHAMADA) */}
        {activeTab === 'chamada' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="card border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Chamada Digital</h2>
                  <p className="text-xs text-slate-400">Selecione a turma e a data para realizar a chamada do dia</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Turma *</label>
                  <select
                    value={selectedTurmaChamada}
                    onChange={e => setSelectedTurmaChamada(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">Selecione a Turma...</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nome_turma} ({t.turma_alunos?.length || 0} alunos)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-slate-400 mb-1">Data da Aula *</label>
                  <input
                    type="date"
                    value={selectedDataChamada}
                    onChange={e => setSelectedDataChamada(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleCarregarOuCriarChamada}
                    disabled={!selectedTurmaChamada}
                    className="w-full btn-primary bg-emerald-600 hover:bg-emerald-500 py-3 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Iniciar / Carregar Chamada
                  </button>
                </div>
              </div>
            </div>

            {/* LISTA DE CHAMADA SELECIONADA */}
            {chamadaAtual && (
              <div className="card space-y-6 border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs text-emerald-400 font-mono font-bold">Registro de Frequência</span>
                    <h3 className="text-lg font-bold text-white">
                      {turmas.find(t => t.id === selectedTurmaChamada)?.nome_turma}
                    </h3>
                    <p className="text-xs text-slate-400">Data: {formatDate(selectedDataChamada)}</p>
                  </div>

                  <button
                    onClick={handleSalvarChamada}
                    disabled={savingChamada}
                    className="btn-primary bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                  >
                    {savingChamada ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Salvar Chamada
                  </button>
                </div>

                <div className="space-y-4">
                  {turmas.find(t => t.id === selectedTurmaChamada)?.turma_alunos?.map((ta, idx) => {
                    const aluno = ta.aluno;
                    if (!aluno) return null;

                    const currentStatus = chamadaState[aluno.id]?.status || 'presente';
                    const hasAtestado = chamadaState[aluno.id]?.atestado_url;

                    return (
                      <div
                        key={aluno.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          currentStatus === 'presente' 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : currentStatus === 'ausente' 
                            ? 'bg-rose-500/5 border-rose-500/20' 
                            : 'bg-amber-500/5 border-amber-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500 font-bold w-6">{idx + 1}.</span>
                          <div>
                            <p className="font-bold text-white text-sm">{aluno.nome_aluno}</p>
                            <p className="text-xs text-slate-400">Resp: {aluno.nome_responsavel || '-'}</p>
                          </div>
                        </div>

                        {/* BOTÕES DE STATUS PRESENÇA */}
                        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setChamadaState(prev => ({
                                ...prev,
                                [aluno.id]: { ...prev[aluno.id], status: 'presente' }
                              }));
                            }}
                            className={`px-1.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
                              currentStatus === 'presente'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> <span>Presente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setChamadaState(prev => ({
                                ...prev,
                                [aluno.id]: { ...prev[aluno.id], status: 'ausente' }
                              }));
                            }}
                            className={`px-1.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
                              currentStatus === 'ausente'
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> <span>Ausente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setChamadaState(prev => ({
                                ...prev,
                                [aluno.id]: { ...prev[aluno.id], status: 'justificado' }
                              }));
                              setModalAtestadoAlunoId(aluno.id);
                            }}
                            className={`px-1.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-center ${
                              currentStatus === 'justificado'
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">Justific.</span>
                          </button>

                          {currentStatus === 'justificado' && (
                            <button
                              type="button"
                              onClick={() => setModalAtestadoAlunoId(aluno.id)}
                              className={`col-span-3 sm:col-span-1 p-2 rounded-xl border text-xs flex items-center justify-center gap-1 ${hasAtestado ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/50 text-amber-400 bg-amber-500/10'}`}
                              title="Anexar ou ver atestado"
                            >
                              <Paperclip className="w-4 h-4" /> <span className="sm:hidden text-[10px]">Anexar Atestado</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. ABA DE RELATÓRIO DE FREQUÊNCIA */}
        {activeTab === 'relatorios' && (
          <div className="space-y-6">
            <div className="card border-amber-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Relatório de Assiduidade e Frequência</h2>
                  <p className="text-xs text-slate-400">Acompanhamento consolidado do percentual de presença dos alunos</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alunos.map(aluno => {
                // Calcular estatísticas do aluno
                const presencasDoAluno = presencas.filter(p => p.aluno_id === aluno.id);
                const totalChamadas = presencasDoAluno.length;
                const totalPresentes = presencasDoAluno.filter(p => p.status === 'presente').length;
                const totalAusentes = presencasDoAluno.filter(p => p.status === 'ausente').length;
                const totalJustificados = presencasDoAluno.filter(p => p.status === 'justificado').length;

                const percentual = totalChamadas > 0 
                  ? Math.round(((totalPresentes + totalJustificados) / totalChamadas) * 100) 
                  : 100;

                return (
                  <div key={aluno.id} className="card flex flex-col justify-between border-white/10">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold text-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-sm">{aluno.nome_aluno}</h3>
                            <p className="text-[10px] text-slate-400">Polo: {aluno.local || '-'}</p>
                          </div>
                        </div>

                        <span className={`text-base font-black px-2.5 py-1 rounded-xl font-mono ${
                          percentual >= 75 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {percentual}%
                        </span>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mb-4 border border-white/5">
                        <div
                          className={`h-full transition-all duration-500 ${
                            percentual >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <span className="text-[10px] text-slate-400 block uppercase">Presente</span>
                          <strong className="text-emerald-400 text-sm font-bold">{totalPresentes}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/10">
                          <span className="text-[10px] text-slate-400 block uppercase">Faltas</span>
                          <strong className="text-rose-400 text-sm font-bold">{totalAusentes}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                          <span className="text-[10px] text-slate-400 block uppercase">Justificativas</span>
                          <strong className="text-amber-400 text-sm font-bold">{totalJustificados}</strong>
                        </div>
                      </div>
                    </div>

                    {totalJustificados > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs text-amber-400">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Atestado(s) registrado(s)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}