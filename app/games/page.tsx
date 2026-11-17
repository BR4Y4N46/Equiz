"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Gamepad2, Users, DollarSign, Tag, Clock, ArrowRight, UserCheck, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameItem {
  id: string;
  categoria: string;
  costo: number;
  maxPlayers: number;
  maxWinners: number;
  status: string;
  createdAt: string;
}

export default function GamesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<GameItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [joinModal, setJoinModal] = useState<{ gameId: string; show: boolean } | null>(null);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res?.json?.();
      setGames(data?.games ?? []);
    } catch {} finally { setLoadingGames(false); }
  };

  const handleJoin = async (gameId: string, esInvitado: boolean) => {
    setJoining(gameId);
    setJoinError('');
    try {
      // Get fingerprint
      let fingerprintId = null;
      try {
        const FingerprintJS = await import('@fingerprintjs/fingerprintjs-pro');
        const fp = await FingerprintJS?.load?.({ apiKey: process.env.NEXT_PUBLIC_FINGERPRINT_PUBLIC_KEY ?? '' });
        const result = await fp?.get?.();
        fingerprintId = result?.visitorId ?? null;
      } catch {}

      const res = await fetch('/api/participations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
	credentials: 'include',
        body: JSON.stringify({ gameId, esInvitado, fingerprintId }),
      });
      const data = await res?.json?.();
      if (res?.ok || data?.participation) {
        router.push(`/game/${gameId}/waiting`);
      } else {
        setJoinError(data?.error ?? 'Error al unirse');
      }
    } catch {
      setJoinError('Error de conexión');
    } finally {
      setJoining(null);
      setJoinModal(null);
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; color: string }> = {
      waiting: { label: 'Esperando', color: 'bg-yellow-500/10 text-yellow-500' },
      countdown: { label: 'Cuenta regresiva', color: 'bg-orange-500/10 text-orange-500' },
      in_progress: { label: 'En progreso', color: 'bg-green-500/10 text-green-500' },
      finished: { label: 'Finalizado', color: 'bg-muted text-muted-foreground' },
    };
    return map?.[s] ?? { label: s, color: 'bg-muted text-muted-foreground' };
  };

  if (loading || (!user && loading)) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Quiz disponibles</h1>
            <p className="text-muted-foreground text-sm mt-1">Elige un quiz y compite</p>
          </div>
        </div>

        {loadingGames ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : (games?.length ?? 0) === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay quiz disponibles por ahora</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {(games ?? []).map((game: GameItem, idx: number) => {
              const st = statusLabel(game?.status ?? '');
              return (
                <motion.div
                  key={game?.id ?? idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 rounded-xl bg-card shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-semibold capitalize">{game?.categoria ?? 'General'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st?.color}`}>{st?.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Máx {game?.maxPlayers ?? 0}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {game?.maxWinners ?? 0} ganadores</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {game?.status === 'waiting' && (
                        <button
                          onClick={() => setJoinModal({ gameId: game?.id, show: true })}
                          disabled={!!joining}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <ArrowRight className="w-4 h-4" /> Solicitar ingreso
                        </button>
                      )}
                      {(game?.status === 'countdown' || game?.status === 'in_progress') && (
                        <button
                          onClick={() => router.push(`/game/${game?.id}/play`)}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-1.5"
                        >
                          <Gamepad2 className="w-4 h-4" /> Empezar
                        </button>
                      )}
                      {game?.status === 'finished' && (
                        <button
                          onClick={() => router.push(`/game/${game?.id}/results`)}
                          className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-all flex items-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" /> Ver resultados
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {joinError && <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{joinError}</div>}

        {/* Join Modal */}
        {joinModal?.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card p-6 rounded-xl shadow-xl max-w-sm w-full space-y-4">
              <h2 className="text-lg font-display font-bold">¿Cómo quieres participar?</h2>
              <p className="text-sm text-muted-foreground">Como <strong>Participante</strong> compites por premios (requiere aprobación). Como <strong>Invitado</strong> juegas gratis sin persistencia.</p>
              <div className="grid gap-3">
                <button
                  onClick={() => handleJoin(joinModal?.gameId, false)}
                  disabled={!!joining}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" /> Participante
                </button>
                <button
                  onClick={() => handleJoin(joinModal?.gameId, true)}
                  disabled={!!joining}
                  className="w-full py-3 rounded-lg border border-border hover:bg-accent transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" /> Invitado
                </button>
              </div>
              <button onClick={() => { setJoinModal(null); setJoinError(''); }} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
