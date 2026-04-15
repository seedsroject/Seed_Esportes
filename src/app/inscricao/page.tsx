'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import { FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const INSTITUICAO = {
  razaoSocial: 'Instituto Seed Esportes',
  nomeFantasia: 'Seed Esportes',
  cnpj: '64.013.507/0001-62',
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
}

const initialFormData: FormData = {
  nomeAluno: '',
  dataNascimento: '',
  rgCpf: '',
  nomeResponsavel: '',
  cpfResponsavel: '',
  telefone: '',
  local: '',
  assinatura: '',
};

export default function InscricaoPage() {
  const router = useRouter();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setFormData({ ...formData, assinatura: '' });
  };

  const generatePDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Termo de Autorização para Atividade Física e', pageWidth / 2, 20, { align: 'center' });
    pdf.text('Cessão de Direitos de Imagem, Vídeo e Áudio', pageWidth / 2, 28, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Instituição responsável:', 15, 45);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Razão Social: ${INSTITUICAO.razaoSocial}`, 15, 52);
    pdf.text(`Nome Fantasia: ${INSTITUICAO.nomeFantasia}`, 15, 59);
    pdf.text(`CNPJ: ${INSTITUICAO.cnpj}`, 15, 66);

    pdf.setFont('helvetica', 'bold');
    pdf.text('1. Dados do Aluno(a) e Responsável', 15, 80);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nome do Aluno(a): ${formData.nomeAluno}`, 15, 90);
    pdf.text(`Data de Nascimento: ${formData.dataNascimento}`, 15, 100);
    pdf.text(`RG/CPF: ${formData.rgCpf}`, 15, 110);
    pdf.text(`Nome do Responsável: ${formData.nomeResponsavel}`, 15, 120);
    pdf.text(`CPF do Responsável: ${formData.cpfResponsavel}`, 15, 130);
    pdf.text(`Telefone: ${formData.telefone}`, 15, 140);

    pdf.setFont('helvetica', 'bold');
    pdf.text('2. Autorização para Prática de Atividade Física', 15, 155);
    pdf.setFont('helvetica', 'normal');
    pdf.text('AUTORIZO a participação do aluno nas atividades físicas, esportivas e', 15, 165);
    pdf.text('recreativas promovidas pelo Instituto Seed Esportes.', 15, 172);
    pdf.text('Declaro que o aluno goza de plena saúde física e mental.', 15, 185);

    pdf.setFont('helvetica', 'bold');
    pdf.text('3. Autorização de Uso de Imagem, Vídeo e Áudio', 15, 200);
    pdf.setFont('helvetica', 'normal');
    pdf.text('AUTORIZO livremente o Instituto Seed Esportes a utilizar a imagem, voz e', 15, 210);
    pdf.text('depoimentos do aluno(a) captados durante as atividades para:', 15, 217);
    pdf.text('- Divulgação Institucional: Redes sociais, sites e newsletters', 15, 227);
    pdf.text('- Materiais Publicitários: Folders, banners, vídeos promocionais', 15, 234);
    pdf.text('- Registros Históricos: Arquivo interno e relatórios', 15, 241);
    pdf.text('Esta autorização é gratuita, irrevocable e permanente.', 15, 255);

    if (formData.assinatura) {
      const imgData = formData.assinatura;
      pdf.addImage(imgData, 'PNG', 15, 270, 60, 25);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text(`Local: ${formData.local}`, 15, 305);
    pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 100, 305);

    return pdf;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!sigCanvas.current?.isEmpty()) {
      setFormData({ ...formData, assinatura: sigCanvas.current?.toDataURL() || '' });
    }

    if (!formData.nomeAluno || !formData.nomeResponsavel) {
      setErro('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const pdf = await generatePDF();
      const pdfBlob = pdf.output('blob');
      const pdfName = `termo_${Date.now()}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('termos')
        .upload(pdfName, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('termos').getPublicUrl(uploadData.path);

      const { error: insertError } = await supabase.from('alunos').insert({
        nome_aluno: formData.nomeAluno,
        data_nascimento: formData.dataNascimento || null,
        rg_cpf: formData.rgCpf || null,
        nome_responsavel: formData.nomeResponsavel,
        cpf_responsavel: formData.cpfResponsavel || null,
        telefone: formData.telefone || null,
        local: formData.local || null,
        assinatura: formData.assinatura || null,
        pdf_url: urlData.publicUrl,
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

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inscrição Realizada!</h1>
          <p className="text-gray-600 mb-6">O termo de autorização foi assinado com sucesso.</p>
          <p className="text-sm text-gray-500">O responsável receberá a confirmação.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-3">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Fazer Inscrição
          </h1>
          <p className="text-gray-600">Seed Esportes</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Dados do Aluno(a) e Responsável</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="input-label">Nome do Aluno(a) *</label>
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
                <label className="input-label">RG/CPF</label>
                <input
                  type="text"
                  name="rgCpf"
                  value={formData.rgCpf}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="123.456.789-00"
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">Nome do Responsável Legal *</label>
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
                <label className="input-label">CPF do Responsável</label>
                <input
                  type="text"
                  name="cpfResponsavel"
                  value={formData.cpfResponsavel}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="123.456.789-00"
                />
              </div>
              <div>
                <label className="input-label">Telefone</label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Autorização para Prática de Atividade Física</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                Pelo presente instrumento, eu, acima identificado(a), na qualidade de aluno(a) ou responsável legal,
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Autorização de Uso de Imagem, Vídeo e Áudio</h2>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Assinatura e Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Local</label>
                <input
                  type="text"
                  name="local"
                  value={formData.local}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Cidade - Estado"
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
              <label className="input-label">Assinatura do Responsável Legal</label>
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