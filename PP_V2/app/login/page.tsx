"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RecaptchaWrapper = dynamic(() => import('@/components/recaptcha-wrapper'), { ssr: false });

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<{ reset: () => void } | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace(user?.role === 'ADMIN' ? '/admin' : '/games');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setError('');
    setSubmitting(true);
    const result = await login(email, password ?? undefined);
    if (result?.ok) {
      router.replace('/games');
    } else {
      setError(result?.error ?? 'Error');
      recaptchaRef?.current?.reset?.();
      setRecaptchaToken(null);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-12">
        <div className="p-6 rounded-xl bg-card shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <LogIn className="w-10 h-10 text-primary mx-auto" />
            <h1 className="text-2xl font-display font-bold tracking-tight">Iniciar sesión</h1>
            <p className="text-sm text-muted-foreground">Ingresa a tu cuenta de LDAP</p>
          </div>
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Signum o Zsignum</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={email} onChange={(e) => setEmail(e?.target?.value ?? '')} className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none" placeholder="signum / zsignum" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e?.target?.value ?? '')} className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50">
              {submitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <p className="text-sm text-center text-muted-foreground">
            ¿No tienes cuenta? <Link href="/register" className="text-primary hover:underline">Regístrate</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
