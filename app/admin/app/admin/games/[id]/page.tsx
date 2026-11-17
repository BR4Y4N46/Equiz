"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/navbar';
import { ArrowLeft, CheckCircle, Play, Trophy, Hourglass, UserCheck, Flag, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminGameDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gameId = params?.id as string;
  const [game, setGame] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user?.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (!gameId) return;
    
    setLoadingData(true);
    try {
      // Usar fetch directo con el ID en la URL
      const [gRes, rRes] = await Promise.all([
        fetch(`/api/games/${gameId}`),
        fetch(`/api/games/${gameId}/ranking`),
      ]);
      
      const gData = await gRes?.json?.();
      const rData = await rRes?.json?.();
      
      if (gRes.ok) {
        setGame(gData?.game ?? null);
      } else {
        setError(gData?.error || 'Error al cargar el quiz');
      }
      
      if (rRes.ok) {
        setRanking(rData?.ranking ?? []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error de conexión');
    } finally {
      setLoadingData(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (gameId) {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchData, gameId]);

  const approvePlayer = async (participationId: string) => {
    try {
      await fetch(`/api/participations/${participationId}/approve`, { method: 'POST' });
      fetchData();
    } catch {}
  };

  const startGame = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await fetch(`/api/games/${gameId}/start`, { method: 'POST' });
      const data = await res?.json?.();
      if (!res?.ok) setError(data?.error ?? 'Error');
      else {
        setTimeout(async () => {
          try {
            await fetch(`/api/games/${gameId}/activate`, { method: 'POST' });
          } catch {}
        }, 10500);
        fetchData();
      }
    } catch { 
      setError('Error de conexión'); 
    }
    setStarting(false);
  };

  const finishGame = async () => {
    if (!confirm('¿Estás seguro de finalizar este quiz? Los participantes no podrán enviar más respuestas.')) return;

    setFinishing(true);
    setError('');

    try {
      const res = await fetch(`/api/games/${gameId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res?.json?.();

      if (!res?.ok) {
        setError(data?.error ?? 'Error al finalizar el quiz');
      } else {
        fetchData();
      }
    } catch {
      setError('Error de conexión al finalizar');
    }

    setFinishing(false);
  };

  const deleteGame = async () => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este quiz? Esta acción no se puede deshacer.')) return;
    
    setDeleting(true);
    setError('');
    
    try {
      const res = await fetch(`/api/games/${gameId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res?.ok) {
        const data = await res?.json?.();
        setError(data?.error ?? 'Error al eliminar el quiz');
      } else {
        router.push('/admin');
      }
    } catch {
      setError('Error de conexión al eliminar');
    }
    
    setDeleting(false);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Quiz no encontrado</p>
          <button 
            onClick={() => router.push('/admin')}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-white"
          >
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  const pendingPlayers = (game?.participations ?? []).filter((p: any) => p?.estadoPago === 'pending' && !p?.esInvitado);
  const approvedPlayers = (game?.participations ?? []).filter((p: any) => p?.estadoPago === 'approved' && !p?.esInvitado);
  const guests = (game?.participations ?? []).filter((p: any) => p?.esInvitado);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      waiting: 'bg-yellow-500/10 text-yellow-500',
      countdown: 'bg-orange-500/10 text-orange-500',
      in_progress: 'bg-green-500/10 text-green-500',
      finished: 'bg-muted text-muted-foreground',
    };
    return map?.[s] ?? '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="p-6 rounded-xl bg-card shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold capitalize">{game?.categoria ?? 'Quiz'}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(game?.status ?? '')}`}>{game?.status ?? ''}</span>
            </div>
            <div className="flex gap-2">
              {game?.status === 'waiting' && (
                <>
                  <button onClick={startGame} disabled={starting || (approvedPlayers?.length ?? 0) < 1} className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50">
                    <Play className="w-4 h-4" /> Iniciar quiz
                  </button>
                  <button onClick={deleteGame} disabled={deleting} className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50">
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </>
              )}
              {game?.status === 'in_progress' && (
                <button onClick={finishGame} disabled={finishing} className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50">
                  <Flag className="w-4 h-4" /> Finalizar quiz
                </button>
              )}
            </div>
          </div>
          {error && <div className="mt-3 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        </div>

        {/* Pending payments */}
        {(pendingPlayers?.length ?? 0) > 0 && (
          <div className="p-6 rounded-xl bg-card shadow-md space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Hourglass className="w-4 h-4 text-yellow-500" /> Pago pendiente ({pendingPlayers?.length ?? 0})</h2>
            <div className="grid gap-2">
              {(pendingPlayers ?? []).map((p: any) => (
                <div key={p?.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-yellow-500/5">
                  <div>
                    <p className="text-sm font-medium">{p?.user?.username ?? 'Participante'}</p>
                    <p className="text-xs text-muted-foreground">{p?.user?.email ?? ''}</p>
                  </div>
                  <button onClick={() => approvePlayer(p?.id)} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-all flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Aprobar pago
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved */}
        <div className="p-6 rounded-xl bg-card shadow-md space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><UserCheck className="w-4 h-4 text-green-500" /> Participantes aprobados ({approvedPlayers?.length ?? 0})</h2>
          {(approvedPlayers?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Ningún participante aprobado aún</p>
          ) : (
            <div className="grid gap-2">
              {(approvedPlayers ?? []).map((p: any) => (
                <div key={p?.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-green-500/5">
                  <div>
                    <p className="text-sm font-medium">{p?.user?.username ?? 'participante'}</p>
                    <p className="text-xs text-muted-foreground">{p?.user?.email ?? ''}</p>
                  </div>
                  <button onClick={() => approvePlayer(p?.id)} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-accent transition-all">
                    Revocar
                  </button>
                </div>
              ))}
            </div>
          )}
          {(guests?.length ?? 0) > 0 && <p className="text-xs text-muted-foreground">{guests?.length} invitado(s) participando</p>}
        </div>

        {/* Live ranking */}
        {(game?.status === 'in_progress' || game?.status === 'finished') && (
          <div className="p-6 rounded-xl bg-card shadow-md space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Ranking en vivo</h2>
            {(ranking?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos aún</p>
            ) : (
              <div className="space-y-2">
                {(ranking ?? []).map((r: any, idx: number) => (
                  <div key={r?.userId ?? idx} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30">
                    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r?.username ?? 'Participante'}</p>
                      <p className="text-xs text-muted-foreground">{r?.correctas ?? 0} correctas • {((r?.tiempoTotal ?? 0) / 1000).toFixed(1)}s • {r?.respuestas ?? 0} respuestas</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
