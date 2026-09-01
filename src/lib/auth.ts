'use client';

import { supabase } from './supabase';

export interface Admin {
  id: string;
  email: string;
  nome: string;
  created_at: string;
}

export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();

  try {
    const { data: admins } = await supabase
      .from('admins')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (admins && password === admins.password_hash) {
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
  } catch (err) {
    console.warn('Erro ao consultar Supabase para login, tentando fallback...', err);
  }

  // Fallback de logins autorizados
  const fallbackAdmins = [
    { email: 'marciocampiaoinmetro@gmail.com', password_hash: '53540404Lpo', nome: 'Marcio', id: 'admin-1' },
    { email: 'admin2@seedesportes.com.br', password_hash: 'Seed@2026', nome: 'Admin 2', id: 'admin-2' }
  ];

  const foundFallback = fallbackAdmins.find(a => a.email === cleanEmail && a.password_hash === password);
  if (foundFallback) {
    localStorage.setItem('admin_session', JSON.stringify({
      id: foundFallback.id,
      email: foundFallback.email,
      nome: foundFallback.nome
    }));

    return {
      success: true,
      admin: {
        id: foundFallback.id,
        email: foundFallback.email,
        nome: foundFallback.nome,
        created_at: new Date().toISOString()
      }
    };
  }

  return { success: false, error: 'Email ou senha inválidos' };
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