"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ 
    email: '', 
    username: '', 
    password: '' 
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/games');
  }, [user, loading, router]);

  const setField = (field: string, value: string) => 
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSubmitting(true);

    // Registrar sin reCAPTCHA
    const result = await register({ 
      email: form.email, 
      username: form.username, 
      password: form.password 
    });

    if (result?.ok) {
      router.replace('/games');
    } else {
      setError(result?.error ?? 'Error al registrarse');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="p-6 rounded-xl bg-card shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <UserPlus className="w-10 h-10 text-primary mx-auto" />
            <h1 className="text-2xl font-display font-bold tracking-tight">Crear cuenta</h1>
            <p className="text-sm text-muted-foreground">Regístrate para competir en quiz en vivo</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Signum / Zsignum</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="zusuario"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nombre de usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setField('username', e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="tunombre"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            ¿Ya tienes cuenta? <Link href="/login" className="text-primary hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
