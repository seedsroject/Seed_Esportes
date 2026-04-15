'use client';

import { supabase } from './supabase';

export interface Admin {
  id: string;
  email: string;
  nome: string;
  created_at: string;
}

export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
  const { data: admins, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error || !admins) {
    return { success: false, error: 'Email ou senha inválidos' };
  }

  if (password !== admins.password_hash) {
    return { success: false, error: 'Email ou senha inválidos' };
  }

  localStorage.setItem('admin_session', JSON.stringify({
    id: admins.id,
    email: admins.email,
    nome: admins.nome
  }));

  return {
    success: true,
    admin: {
      id: admins.id,
      email: admins.email,
      nome: admins.nome,
      created_at: admins.created_at
    }
  };
}

export function getAdminSession(): Admin | null {
  if (typeof window === 'undefined') return null;
  
  const session = localStorage.getItem('admin_session');
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export function logoutAdmin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_session');
}

export function requireAuth(): Admin | null {
  return getAdminSession();
}