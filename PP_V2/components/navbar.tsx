"use client";
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Trophy, LogOut, Shield, User, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
  href="/"
  className="flex items-center gap-2 font-display font-bold text-lg text-primary"
>
  <Image
    src="/favicon.svg"
    alt="Ericsson Learning Quiz"
    width={28}
    height={28}
    className="w-7 h-7 brightness-0 invert"
  />

  <span>Ericsson Learning Quiz</span>
</Link>
	<div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              <Link href="/games" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-1">
                <Home className="w-4 h-4" /> Quiz's
              </Link>
              {user?.role === 'ADMIN' && (
                <Link href="/admin" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Admin
                </Link>
              )}
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.username}</span>
              <button onClick={handleLogout} className="px-3 py-1.5 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-1">
                <LogOut className="w-4 h-4" /> Salir
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/register" className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Registrarse
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
