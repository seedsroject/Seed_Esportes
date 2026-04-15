'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import { FileText, Check, AlertCircle, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const INSTITUICAO = {
  razaoSocial: 'Instituto Seed Esportes',
  nomeFantasia: 'Seed Esportes',
  cnpj: '64.013.507/0001-62',
  endereco: 'Nova Iguaçu - RJ',
};

interface FormData {
  nomeAluno: string;
  dataNascimento: string;
  rgCpf: string;
  nomeResponsavel: string;
  cpfResponsavel: string;
  telefone: string;
  local: string;
  assinatura: string;
  documentos: File | null;
}

const initialFormData: FormData = {
  nomeAluno: '',
  dataNascimento: '',
  rgCpf: '',
  nomeResponsavel: '',
  cpfResponsavel: '',
  telefone: '',
  local: INSTITUICAO.endereco,
  assinatura: '',
  documentos: null,
};

export default function InscricaoPage() {
  const router = useRouter();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [maiorIdade, setMaiorIdade] = useState(false);
  const [docNome, setDocNome] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'maiorIdade') {
      setMaiorIdade(checked);
      if (checked) {
        setFormData({ 
          ...formData, 
          telefone: formData.telefone,
          local: INSTITUICAO.endereco,
          documentos: formData.documentos
        });
      } else {
        setFormData({ 
          ...formData, 
          telefone: '',
          local: INSTITUICAO.endereco,
          documentos: null 
        });
        setDocNome('');
      }
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setErro('Apenas arquivos PDF são permitidos');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErro('O arquivo deve ter no máximo 5MB');
        return;
      }
      setFormData({ ...formData, documentos: file });
      setDocNome(file.name);
      setErro('');
    }
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setFormData({ ...formData, assinatura: '' });
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, documentos: null });
    setDocNome('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generatePDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    const primaryColor: [number, number, number] = [139, 92, 246]; // Roxo #8b5cf6

    // Divisor roxo no topo
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(2);
    pdf.line(15, 15, pageWidth - 15, 15);

    // Título centralizado
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('SEED ESPORTES', centerX, 28, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Termo de Autorização para Atividade Física e', centerX, 38, { align: 'center' });
    pdf.text('Cessão de Direitos de Imagem, Vídeo e Áudio', centerX, 45, { align: 'center' });

    // Divisor roxo
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(1);
    pdf.line(15, 52, pageWidth - 15, 52);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DA INSTITUIÇÃO', 15, 62);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Razão Social: ${INSTITUICAO.razaoSocial}`, 15, 70);
    pdf.text(`Nome Fantasia: ${INSTITUICAO.nomeFantasia}`, 15, 77);
    pdf.text(`CNPJ: ${INSTITUICAO.cnpj}`, 15, 84);

    // Divisor roxo
    pdf.line(15, 91, pageWidth - 15, 91);

    const tipoInscricao = maiorIdade ? 'MAIOR DE IDADE' : 'MENOR DE IDADE';
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Tipo de Inscrição: ${tipoInscricao}`, 15, 99);

    pdf.setFont('helvetica', 'bold');
    pdf.text('1. DADOS DO ALUNO(A)', 15, 112);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nome: ${formData.nomeAluno}`, 15, 120);
    pdf.text(`Data de Nascimento: ${formData.dataNascimento || 'Não informada'}`, 15, 127);
    pdf.text(`RG/CPF: ${formData.rgCpf || 'Não informado'}`, 15, 134);
    if (maiorIdade) {
      pdf.text(`Telefone: ${formData.telefone || 'Não informado'}`, 15, 141);
    }

    if (!maiorIdade) {
      pdf.setDrawColor(...primaryColor);
      pdf.line(15, 148, pageWidth - 15, 148);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. DADOS DO RESPONSÁVEL', 15, 156);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Nome: ${formData.nomeResponsavel}`, 15, 164);
      pdf.text(`CPF: ${formData.cpfResponsavel || 'Não informado'}`, 15, 171);
    }

    const auth1Y = maiorIdade ? 155 : 180;
    pdf.setDrawColor(...primaryColor);
    pdf.line(15, auth1Y - 3, pageWidth - 15, auth1Y - 3);
    pdf.setFont('helvetica', 'bold');
    pdf.text(maiorIdade ? '2. AUTORIZAÇÃO - ATIVIDADE FÍSICA' : '3. AUTORIZAÇÃO - ATIVIDADE FÍSICA', 15, auth1Y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('AUTORIZO a participação do aluno nas atividades físicas, esportivas e', 15, auth1Y + 8);
    pdf.text('recreativas promovidas pelo Instituto Seed Esportes.', 15, auth1Y + 15);
    pdf.text('Declaro que o aluno goza de plena saúde física e mental.', 15, auth1Y + 22);

    const auth2Y = maiorIdade ? 185 : 215;
    pdf.setDrawColor(...primaryColor);
    pdf.line(15, auth2Y - 3, pageWidth - 15, auth2Y - 3);
    pdf.setFont('helvetica', 'bold');
    pdf.text(maiorIdade ? '3. AUTORIZAÇÃO - USO DE IMAGEM' : '4. AUTORIZAÇÃO - USO DE IMAGEM', 15, auth2Y);
    pdf.setFont('helvetica', 'normal');
    pdf.text('AUTORIZO livremente o Instituto Seed Esportes a utilizar a imagem, voz e', 15, auth2Y + 8);
    pdf.text('depoimentos do aluno(a) captados durante as atividades para:', 15, auth2Y + 15);
    pdf.text('- Divulgação Institucional: Redes sociais, sites e newsletters', 15, auth2Y + 23);
    pdf.text('- Materiais Publicitários: Folders, banners, vídeos promocionais', 15, auth2Y + 30);
    pdf.text('- Registros Históricos: Arquivo interno e relatórios', 15, auth2Y + 37);
    pdf.text('Esta autorização é gratuita, irrevocable e permanente.', 15, auth2Y + 50);

    if (formData.assinatura) {
      pdf.addImage(formData.assinatura, 'PNG', 15, auth2Y + 65, 60, 25);
    }

    const assinaturaY = auth2Y + 100;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Local: ${formData.local}`, 15, assinaturaY);
    pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 100, assinaturaY);

    return pdf;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!formData.nomeAluno) {
      setErro('Preencha o nome do aluno');
      return;
    }

    if (!maiorIdade && (!formData.nomeResponsavel || !formData.cpfResponsavel)) {
      setErro('Preencha os dados do responsável');
      return;
    }

    if (maiorIdade && !formData.telefone) {
      setErro('Preencha o telefone');
      return;
    }

    if (maiorIdade && !formData.documentos) {
      setErro('Envie o documento (RG ou CPF) em PDF');
      return;
    }

    if (!sigCanvas.current?.isEmpty()) {
      setFormData({ ...formData, assinatura: sigCanvas.current?.toDataURL() || '' });
    }

    setLoading(true);
    try {
      let documentosUrl = null;

      if (formData.documentos) {
        const timestamp = Date.now();
        const docName = `seed_${timestamp}.pdf`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('termos')
          .upload(docName, formData.documentos, { contentType: 'application/pdf' });

        if (uploadError) {
          console.error('Erro upload documento:', uploadError);
          throw new Error('Erro ao enviar documento: ' + uploadError.message);
        }

        const docPath = uploadData.path;
        documentosUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/termos/${docPath}`;
      }

      const pdf = await generatePDF();
      const pdfBlob = pdf.output('blob');
      const pdfName = `termo_seed_${Date.now()}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('termos')
        .upload(pdfName, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) {
        console.error('Erro upload PDF:', uploadError);
        throw new Error('Erro ao gerar PDF: ' + uploadError.message);
      }

      const pdfPath = uploadData.path;
      const pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/termos/${pdfPath}`;

      const dadosInserir = {
        nome_aluno: formData.nomeAluno,
        data_nascimento: formData.dataNascimento || null,
        rg_cpf: formData.rgCpf || null,
        telefone: formData.telefone || null,
        local: formData.local,
        assinatura: formData.assinatura || null,
        pdf_url: pdfUrl,
        documentos_url: documentosUrl,
      };

      if (!maiorIdade) {
        Object.assign(dadosInserir, {
          nome_responsavel: formData.nomeResponsavel,
          cpf_responsavel: formData.cpfResponsavel || null,
        });
      }

      const { error: insertError } = await supabase.from('alunos').insert(dadosInserir);

      if (insertError) throw insertError;

      setSucesso(true);
    } catch (err) {
      console.error(err);
      setErro('Erro ao processar formulário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inscrição Realizada!</h1>
          <p className="text-gray-600 mb-6">O termo de autorização foi assinado com sucesso.</p>
          <p className="text-sm text-gray-500">
            {maiorIdade 
              ? 'Você receberá a confirmação por email.' 
              : 'O responsável receberá a confirmação.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src="/logo.png"
              alt="Seed Esportes"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Fazer Inscrição
          </h1>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados da Instituição</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Razão Social</p>
                <p className="font-medium">{INSTITUICAO.razaoSocial}</p>
              </div>
              <div>
                <p className="text-gray-500">Nome Fantasia</p>
                <p className="font-medium">{INSTITUICAO.nomeFantasia}</p>
              </div>
              <div>
                <p className="text-gray-500">CNPJ</p>
                <p className="font-medium">{INSTITUICAO.cnpj}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="maiorIdade"
                name="maiorIdade"
                checked={maiorIdade}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="maiorIdade" className="text-lg font-semibold text-gray-900">
                Sou maior de 18 anos
              </label>
            </div>
            <p className="text-sm text-gray-500">
              {maiorIdade 
                ? 'Você irá preencher seus próprios dados e enviar documentos.' 
                : 'Um responsável legal precisa assinar o termo.'}
            </p>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Dados do Aluno(a)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="input-label">Nome Completo *</label>
                <input
                  type="text"
                  name="nomeAluno"
                  value={formData.nomeAluno}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="input-label">Data de Nascimento</label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">RG ou CPF</label>
                <input
                  type="text"
                  name="rgCpf"
                  value={formData.rgCpf}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="123.456.789-00"
                />
              </div>
              
              {maiorIdade && (
                <>
                  <div className="md:col-span-2">
                    <label className="input-label">Telefone *</label>
                    <input
                      type="tel"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="(21) 99999-9999"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="input-label">Documento (RG ou CPF) em PDF *</label>
                    <div className="mt-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="documento"
                      />
                      {docNome ? (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <span className="text-sm text-gray-600 truncate">{docNome}</span>
                          <button type="button" onClick={handleRemoveFile} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label 
                          htmlFor="documento"
                          className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                        >
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-500">Clique para enviar PDF (máx 5MB)</span>
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {!maiorIdade && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Dados do Responsável Legal *</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="input-label">Nome do Responsável *</label>
                  <input
                    type="text"
                    name="nomeResponsavel"
                    value={formData.nomeResponsavel}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">CPF do Responsável *</label>
                  <input
                    type="text"
                    name="cpfResponsavel"
                    value={formData.cpfResponsavel}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="123.456.789-00"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {maiorIdade ? '2. Autorização para Prática de Atividade Física' : '3. Autorização para Prática de Atividade Física'}
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                Pelo presente instrumento, eu, acima identificado(a), na qualidade de aluno(a){!maiorIdade && ' ou responsável legal'},
                <strong> AUTORIZO </strong> a participação do referido aluno nas atividades físicas,
                esportivas e recreativas promovidas pelo Instituto Seed Esportes.
              </p>
              <p className="text-gray-700 text-sm leading-relaxed mt-3">
                Declaro estar ciente de que:
              </p>
              <ul className="text-gray-700 text-sm mt-2 space-y-1 list-disc list-inside">
                <li>O aluno goza de plena saúde física e mental</li>
                <li>Não tenho conhecimento de nenhuma contraindicação médica</li>
                <li>Comprometo-me a informar alterações no estado de saúde</li>
              </ul>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {maiorIdade ? '3. Autorização de Uso de Imagem, Vídeo e Áudio' : '4. Autorização de Uso de Imagem, Vídeo e Áudio'}
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong> AUTORIZO </strong> livre de qualquer ônus, em caráter definitivo e irrevogável,
                o Instituto Seed Esportes a utilizar a imagem, voz e depoimentos do aluno(a) captados
                durante as atividades do projeto para:
              </p>
              <ul className="text-gray-700 text-sm mt-3 space-y-1">
                <li><strong>1.</strong> Divulgação Institucional: Redes sociais (Instagram, Facebook, LinkedIn, YouTube, TikTok), sites e newsletters</li>
                <li><strong>2.</strong> Materiais Publicitários: Folders, banners, vídeos promocionais</li>
                <li><strong>3.</strong> Registros Históricos: Arquivo interno e relatórios</li>
              </ul>
              <p className="text-gray-700 text-sm mt-3">
                Esta autorização é gratuita, abrangendo todo o território nacional e exterior, por tempo indeterminado.
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assinatura</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Local</label>
                <input
                  type="text"
                  value={formData.local}
                  className="input-field bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="input-label">Data</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('pt-BR')}
                  className="input-field bg-gray-100"
                  disabled
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="input-label">
                {maiorIdade ? 'Assinatura do Aluno' : 'Assinatura do Responsável Legal'} *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    className: 'w-full h-40',
                  }}
                  onEnd={() => {
                    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
                      setFormData({ ...formData, assinatura: sigCanvas.current.toDataURL() });
                    }
                  }}
                />
              </div>
              <button type="button" onClick={clearSignature} className="btn-secondary mt-2 text-sm">
                Limpar Assinatura
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Assinar e Enviar Inscrição
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}