'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { getAdminSession } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      router.push('/admin');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />

      <div className="text-center relative z-10 flex flex-col items-center">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-1 animate-float flex flex-col items-center justify-center">
          <Image
            src="/logo.png?v=4"
            alt="Instituto Seed Esportes"
            fill
            className="object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_25px_rgba(124,58,237,0.45)]"
            priority
          />
        </div>
        {/* Base shadow underneath */}
        <div className="w-20 h-2 bg-black/80 blur-md rounded-full mb-6" />

        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-medium">Carregando Instituto Seed Esportes...</span>
        </div>
      </div>
    </div>
  );
}