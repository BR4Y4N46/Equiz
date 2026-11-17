"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Users, Clock, CheckCircle, XCircle, Hourglass, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WaitingRoomPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gameId = params?.id as string;
  const [game, setGame] = useState<any>(null);
  const [myParticipation, setMyParticipation] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}`);
      const data = await res?.json?.();
      const g = data?.game;
      setGame(g);
      const myP = (g?.participations ?? []).find((p: any) => p?.userId === user?.userId);
      setMyParticipation(myP ?? null);

      if (g?.status === 'in_progress') {
        router.replace(`/game/${gameId}/play`);
      } else if (g?.status === 'finished') {
        router.replace(`/game/${gameId}/results`);
      } else if (g?.status === 'countdown' && g?.startTimestamp) {
        const start = new Date(g?.startTimestamp).getTime();
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 10000 - elapsed);
        if (remaining <= 0) {
          router.replace(`/game/${gameId}/play`);
        } else {
          setCountdown(Math.ceil(remaining / 1000));
        }
      }
    } catch {}
  }, [gameId, user?.userId, router]);

  useEffect(() => {
    if (!user) return;
    fetchGame();
    const interval = setInterval(fetchGame, 2000);
    return () => clearInterval(interval);
  }, [fetchGame, user]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = (prev ?? 0) - 1;
        if (next <= 0) {
          clearInterval(timer);
          router.replace(`/game/${gameId}/play`);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, gameId, router]);

  if (loading || !game) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const approvedPlayers = (game?.participations ?? []).filter((p: any) => p?.estadoPago === 'approved' && !p?.esInvitado);
  const pendingPlayers = (game?.participations ?? []).filter((p: any) => p?.estadoPago === 'pending' && !p?.esInvitado);
  const guests = (game?.participations ?? []).filter((p: any) => p?.esInvitado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {countdown !== null && countdown > 0 ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-16 space-y-4">
            <div className="text-8xl font-display font-bold text-primary">{countdown}</div>
            <p className="text-xl text-muted-foreground">¡El quiz está por comenzar!</p>
          </motion.div>
        ) : (
          <>
            <div className="p-6 rounded-xl bg-card shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-display font-bold">Sala de espera</h1>
                  <p className="text-sm text-muted-foreground capitalize">{game?.categoria ?? ''}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Esperando inicio...</span>
                </div>
              </div>

              {myParticipation && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  myParticipation?.estadoPago === 'approved'
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {myParticipation?.estadoPago === 'approved' ? <CheckCircle className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
                  {myParticipation?.esInvitado
                    ? 'Participando como invitado'
                    : myParticipation?.estadoPago === 'approved'
                    ? 'Pago aprobado - listo para jugar'
                    : 'Esperando aprobación de pago'}
                </div>
              )}

              {myParticipation?.estadoPago === 'pending' && !myParticipation?.esInvitado && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium"><AlertCircle className="w-4 h-4 text-primary" /> Instrucciones de Aceptacion</div>
                  <p className="text-xs text-muted-foreground">Realiza el pago de $ {game?.costo ?? 0} Espera aprobación de Admin</p>
                </div>
              )}
            </div>

            <div className="p-6 rounded-xl bg-card shadow-md space-y-3">
              <h2 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Participantes aprobados ({approvedPlayers?.length ?? 0})</h2>
              {(approvedPlayers?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay participantes aprobados</p>
              ) : (
                <div className="grid gap-2">
                  {(approvedPlayers ?? []).map((p: any) => (
                    <div key={p?.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-green-500/5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-sm">{p?.user?.username ?? 'Participante'}</span>
                    </div>
                  ))}
                </div>
              )}
              {(pendingPlayers?.length ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground mt-2">{pendingPlayers?.length} Participantes esperando aprobación</p>
              )}
              {(guests?.length ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground">{guests?.length} invitado(s)</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
