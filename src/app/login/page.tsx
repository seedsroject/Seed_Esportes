'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { loginAdmin, getAdminSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      router.push('/admin');
    } else {
      setVerificando(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    const resultado = await loginAdmin(email, password);

    if (resultado.success) {
      router.push('/admin');
    } else {
      setErro(resultado.error || 'Erro ao fazer login');
      setLoading(false);
    }
  };

  if (verificando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-1 animate-float">
            <Image
              src="/logo.png?v=4"
              alt="Logo"
              fill
              className="object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_25px_rgba(124,58,237,0.45)]"
            />
          </div>
          <div className="w-20 h-2 bg-black/80 blur-md rounded-full mb-3" />
          <p className="text-slate-400 font-medium tracking-wide uppercase text-xs">Acesso Administrativo</p>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{erro}</span>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="input-label">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-primary">
            ← Voltar para página inicial
          </a>
        </div>
      </div>
    </div>
  );
}