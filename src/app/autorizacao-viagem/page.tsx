'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import { Check, AlertCircle, Loader2, Camera, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLogoBase64 } from '@/lib/utils';

interface AutorizacaoViagem {
  id: string;
  aluno_id: string;
  pdf_url: string;
  documento_foto_url: string;
  created_at: string;
}

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
  documentos_url: string | null;
  created_at: string;
  autorizacoes_viagem?: AutorizacaoViagem[];
}

const INSTITUICAO = {
  razaoSocial: 'Instituto Seed Esportes',
  cnpj: '64.013.507/0001-62',
};

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function AutorizacaoViagemPage() {
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string>('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [busca, setBusca] = useState('');
  
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [documentoPreview, setDocumentoPreview] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function fetchAlunos() {
      try {
        const { data, error } = await supabase
          .from('alunos')
          .select('*')
          .order('nome_aluno');
        
        if (data) {
          setAlunos(data);
        }
      } catch (err) {
        console.error('Erro ao buscar alunos:', err);
      } finally {
        setLoadingAlunos(false);
      }
    }
    fetchAlunos();
  }, []);

  useEffect(() => {
    if (alunoSelecionadoId) {
      const aluno = alunos.find(a => a.id === alunoSelecionadoId) || null;
      setAlunoSelecionado(aluno);
    } else {
      setAlunoSelecionado(null);
    }
  }, [alunoSelecionadoId, alunos]);

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocumentoFile(file);
      setDocumentoPreview(URL.createObjectURL(file));
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const generatePDF = async (aluno: Aluno, documentoUrl: string) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const primaryColor: [number, number, number] = [124, 58, 237];

    try {
      const logoBase64 = await getLogoBase64();
      if (logoBase64) {
        pdf.addImage(logoBase64, 'PNG', centerX - 25, 10, 50, 50);
      }
    } catch (e) {
      console.error('Erro ao carregar logo para o PDF', e);
    }

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text(INSTITUICAO.razaoSocial.toUpperCase(), centerX, 65, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(`CNPJ: ${INSTITUICAO.cnpj}`, centerX, 70, { align: 'center' });

    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(1);
    pdf.line(15, 75, pageWidth - 15, 75);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('TERMO DE AUTORIZAÇÃO DE VIAGEM', centerX, 90, { align: 'center' });

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const nomeResp = aluno.nome_responsavel || '_________________________';
    const cpfResp = aluno.cpf_responsavel || '________________';
    const nomeAluno = aluno.nome_aluno;
    const rgAluno = aluno.rg_cpf || '________________';

    const textoParagrafo1 = `Eu, ${nomeResp}, portador(a) do CPF nº ${cpfResp}, na qualidade de responsável legal pelo(a) menor ${nomeAluno}, portador(a) do RG/CPF nº ${rgAluno}, AUTORIZO EXPRESSAMENTE a sua viagem para participação em qualquer competição esportiva, em qualquer localidade, sob a responsabilidade dos professores, treinadores ou monitores do INSTITUTO SEED ESPORTES (CNPJ: ${INSTITUICAO.cnpj}).`;
    
    const textoParagrafo2 = `Declaro estar ciente de que as viagens têm finalidade estritamente esportiva e socioeducativa, e que o(a) atleta deverá seguir as regras de conduta e horários estipulados pela comissão técnica do projeto.`;

    const textoParagrafo3 = `Autorizo ainda que as decisões cabíveis em casos de emergência médica ou necessidade de atendimento de pronto-socorro durante as viagens sejam tomadas pelos responsáveis do projeto que estiverem acompanhando a delegação, comprometendo-me a ser informado(a) o mais breve possível através dos contatos fornecidos neste documento.`;

    const textoParagrafo4 = `Validade: Esta autorização é válida para todas as competições e viagens realizadas no período de 1 (um) ano a contar da data de assinatura abaixo.`;

    pdf.text(pdf.splitTextToSize(textoParagrafo1, pageWidth - 30), 15, 110);
    
    // Obter Y atual para posicionar o próximo texto
    let currentY = 110 + (pdf.splitTextToSize(textoParagrafo1, pageWidth - 30).length * 5) + 5;
    pdf.text(pdf.splitTextToSize(textoParagrafo2, pageWidth - 30), 15, currentY);
    
    currentY += (pdf.splitTextToSize(textoParagrafo2, pageWidth - 30).length * 5) + 5;
    pdf.text(pdf.splitTextToSize(textoParagrafo3, pageWidth - 30), 15, currentY);

    currentY += (pdf.splitTextToSize(textoParagrafo3, pageWidth - 30).length * 5) + 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text(pdf.splitTextToSize(textoParagrafo4, pageWidth - 30), 15, currentY);

    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = meses[hoje.getMonth()];
    const ano = hoje.getFullYear();
    
    currentY += 20;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nova Iguaçu - RJ, ${dia} de ${mes} de ${ano}.`, centerX, currentY, { align: 'center' });

    currentY += 20;
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      pdf.addImage(sigCanvas.current.toDataURL(), 'PNG', centerX - 30, currentY, 60, 25);
    }
    
    currentY += 30;
    pdf.setFont('helvetica', 'bold');
    pdf.text('_________________________________________________', centerX, currentY, { align: 'center' });
    pdf.setFontSize(9);
    pdf.text(nomeResp, centerX, currentY + 5, { align: 'center' });
    pdf.text('Assinatura do Responsável Legal', centerX, currentY + 10, { align: 'center' });

    // Nova página com a imagem do documento anexa
    if (documentoPreview) {
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ANEXO: DOCUMENTO DO RESPONSÁVEL', centerX, 20, { align: 'center' });
      pdf.addImage(documentoPreview, 'JPEG', 15, 30, pageWidth - 30, 200, undefined, 'FAST');
    }

    return pdf;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!alunoSelecionado) {
      setErro('Selecione um aluno.');
      return;
    }
    if (!documentoFile) {
      setErro('Por favor, anexe ou tire uma foto do seu documento de identidade.');
      return;
    }
    if (sigCanvas.current?.isEmpty()) {
      setErro('A assinatura do responsável é obrigatória.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload do Documento do Pai
      const docName = `doc_viagem_${alunoSelecionado.id}_${Date.now()}.${documentoFile.name.split('.').pop() || 'jpg'}`;
      const { data: uploadDocData, error: uploadDocError } = await supabase.storage
        .from('termos')
        .upload(docName, documentoFile, { cacheControl: '3600', upsert: false });

      if (uploadDocError) throw uploadDocError;
      
      const { data: docUrlData } = supabase.storage.from('termos').getPublicUrl(uploadDocData.path);
      const documentoUrlFinal = docUrlData.publicUrl;

      // 2. Geração e Upload do PDF
      const pdf = await generatePDF(alunoSelecionado, documentoUrlFinal);
      const pdfBlob = pdf.output('blob');
      const pdfName = `viagem_${alunoSelecionado.codigo}_${Date.now()}.pdf`;

      const { data: uploadPdfData, error: uploadPdfError } = await supabase.storage
        .from('termos')
        .upload(pdfName, pdfBlob, { contentType: 'application/pdf' });

      if (uploadPdfError) throw uploadPdfError;

      const { data: pdfUrlData } = supabase.storage.from('termos').getPublicUrl(uploadPdfData.path);
      const pdfUrlFinal = pdfUrlData.publicUrl;

      // 3. Salvar no Banco
      const { error: insertError } = await supabase.from('autorizacoes_viagem').insert({
        aluno_id: alunoSelecionado.id,
        pdf_url: pdfUrlFinal,
        documento_foto_url: documentoUrlFinal,
      });

      if (insertError) throw insertError;

      setSucesso(true);
    } catch (err) {
      console.error(err);
      setErro('Erro ao processar formulário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const alunosFiltrados = alunos.filter(a => 
    a.nome_aluno.toLowerCase().includes(busca.toLowerCase()) || 
    (a.codigo && a.codigo.toLowerCase().includes(busca.toLowerCase()))
  );

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Autorização Concluída!</h1>
          <p className="text-gray-600 mb-6">A autorização de viagem foi salva com sucesso e já está vinculada ao cadastro do aluno.</p>
          <a href="/autorizacao-viagem" onClick={() => window.location.reload()} className="btn-primary inline-block">
            Nova Autorização
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden bg-slate-950">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <div className="relative w-32 h-32 mx-auto mb-2">
            <Image src="/logo.png" alt="Logo" fill className="object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.2)]" />
          </div>
          <h1 className="text-2xl font-bold text-white mt-4">Autorização de Viagem</h1>
          <p className="text-slate-400 text-sm mt-1">Preencha os dados abaixo para autorizar o menor a viajar para competições.</p>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-200">{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* PASSO 1: Seleção do Aluno */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">1. Selecione o Aluno</h2>
            {loadingAlunos ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Buscar pelo nome do aluno ou código..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="input-field"
                />
                
                <div className="max-h-60 overflow-y-auto bg-white/5 rounded-xl border border-white/10 p-2 space-y-1">
                  {alunosFiltrados.length === 0 ? (
                    <p className="text-sm text-slate-400 p-3 text-center">Nenhum aluno encontrado.</p>
                  ) : (
                    alunosFiltrados.slice(0, 50).map(aluno => (
                      <div 
                        key={aluno.id}
                        onClick={() => setAlunoSelecionadoId(aluno.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                          alunoSelecionadoId === aluno.id 
                            ? 'bg-primary/20 border-primary/50' 
                            : 'hover:bg-white/10 border-transparent'
                        }`}
                      >
                        <p className="text-slate-200 font-medium">{aluno.nome_aluno}</p>
                        <p className="text-xs text-slate-400">Responsável: {aluno.nome_responsavel || 'Não informado'} | Cód: {aluno.codigo}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {alunoSelecionado && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-sm text-emerald-400 font-medium mb-1">Aluno selecionado com sucesso.</p>
                <p className="text-xs text-slate-300">Responsável legal identificado: {alunoSelecionado.nome_responsavel}</p>
              </div>
            )}
          </div>

          {/* PASSO 2: Foto do Documento */}
          <div className={`card ${!alunoSelecionado && 'opacity-50 pointer-events-none'}`}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">2. Documento do Responsável</h2>
            <p className="text-sm text-slate-400 mb-4">
              Por favor, anexe ou tire uma foto do seu documento de identidade (RG ou CNH).
            </p>
            
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="doc-upload"
                className="hidden"
                onChange={handleDocumentoChange}
              />
              <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center">
                {documentoPreview ? (
                  <div className="relative w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden border border-white/20">
                     <Image src={documentoPreview} alt="Documento" fill className="object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium flex items-center gap-2">
                          <Camera className="w-5 h-5" /> Trocar Foto
                        </p>
                     </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-slate-200 font-medium mb-1">Tirar Foto do Documento</p>
                    <p className="text-slate-500 text-xs">Ou toque para escolher da galeria</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* PASSO 3: Assinatura */}
          <div className={`card ${!alunoSelecionado && 'opacity-50 pointer-events-none'}`}>
            <h2 className="text-lg font-semibold text-slate-100 mb-4">3. Assinatura do Responsável</h2>
            <p className="text-sm text-slate-400 mb-4">
              Ao assinar abaixo, você concorda expressamente com todos os termos da autorização, com validade de 1 (um) ano.
            </p>

            <div className="mt-4">
              <div className="border border-white/10 rounded-2xl p-2 bg-slate-200 shadow-inner">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    className: 'w-full h-40',
                  }}
                />
              </div>
              <button type="button" onClick={clearSignature} className="btn-secondary mt-3 text-sm">
                Limpar Assinatura
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !alunoSelecionado} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando e gerando PDF...
              </>
            ) : (
              <>
                <Check className="w-6 h-6" />
                Enviar Autorização
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
