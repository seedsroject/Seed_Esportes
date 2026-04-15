'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { getAdminSession } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      router.push('/admin');
    } else {
      router.push('/inscricao');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
        <p className="text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}