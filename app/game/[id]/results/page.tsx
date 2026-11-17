"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Trophy, Medal, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gameId = params?.id as string;
  const [ranking, setRanking] = useState<any[]>([]);
  const [game, setGame] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gameRes, rankRes] = await Promise.all([
          fetch(`/api/games/${gameId}`),
          fetch(`/api/games/${gameId}/ranking`),
        ]);
        const gameData = await gameRes?.json?.();
        const rankData = await rankRes?.json?.();
        setGame(gameData?.game ?? null);
        setRanking(rankData?.ranking ?? []);
      } catch {} finally { setLoadingData(false); }
    };
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [gameId, user]);

  if (loading || loadingData) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const medalColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => router.push('/games')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a quiz
        </button>

        <div className="text-center space-y-2">
          <Trophy className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold tracking-tight">Ranking</h1>
          <p className="text-sm text-muted-foreground capitalize">{game?.categoria ?? ''} • {game?.status === 'finished' ? 'Finalizado' : 'En vivo'}</p>
        </div>

        <div className="space-y-3">
          {(ranking ?? []).map((entry: any, idx: number) => {
            const isMe = entry?.userId === user?.userId;
            return (
              <motion.div
                key={entry?.userId ?? idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-xl shadow-md flex items-center gap-4 ${isMe ? 'bg-primary/10 border border-primary/30' : 'bg-card'}`}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-display font-bold text-lg">
                  {idx < 3 ? <Medal className={`w-6 h-6 ${medalColors?.[idx] ?? ''}`} /> : <span>{idx + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry?.username ?? 'Participante'} {isMe && <span className="text-xs text-primary">(tú)</span>}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {entry?.correctas ?? 0} correctas</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {((entry?.tiempoTotal ?? 0) / 1000).toFixed(1)}s</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-display font-bold text-primary">{entry?.correctas ?? 0}</span>
                  <span className="text-xs text-muted-foreground block">/{entry?.respuestas ?? 0}</span>
                </div>
              </motion.div>
            );
          })}
          {(ranking?.length ?? 0) === 0 && (
            <p className="text-center text-muted-foreground py-8">Aún no hay resultados</p>
          )}
        </div>
      </main>
    </div>
  );
}
