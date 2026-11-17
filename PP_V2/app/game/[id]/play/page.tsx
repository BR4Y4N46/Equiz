"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Clock, CheckCircle, XCircle, ChevronRight, AlertTriangle, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gameId = params?.id as string;

  const [game, setGame] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [myParticipation, setMyParticipation] = useState<any>(null);
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}`);
      const data = await res?.json?.();
      const g = data?.game;
      setGame(g);

      if (g?.status === 'finished') {
        router.replace(`/game/${gameId}/results`);
        return;
      }
      if (g?.status === 'waiting') {
        router.replace(`/game/${gameId}/waiting`);
        return;
      }
      if (g?.status === 'countdown') {
        const start = new Date(g?.startTimestamp).getTime();
        const remaining = 10000 - (Date.now() - start);
        if (remaining > 0) {
          router.replace(`/game/${gameId}/waiting`);
          return;
        }
      }

      const myP = (g?.participations ?? []).find((p: any) => p?.userId === user?.userId);
      setMyParticipation(myP ?? null);

      const gqs = g?.gameQuestions ?? [];
      const qs = gqs?.map?.((gq: any) => ({
        id: gq?.question?.id,
        texto: gq?.question?.texto,
        opciones: gq?.question?.opciones,
        orden: gq?.orden,
      })) ?? [];
      setQuestions(qs?.sort?.((a: any, b: any) => (a?.orden ?? 0) - (b?.orden ?? 0)) ?? []);

      // Figure out which question we're on based on existing answers
      const answeredRes = await fetch(`/api/games/${gameId}/ranking`);
      const answeredData = await answeredRes?.json?.();
      const myRank = (answeredData?.ranking ?? []).find((r: any) => r?.userId === user?.userId);
      const answeredCount = myRank?.respuestas ?? 0;
      if (answeredCount >= (qs?.length ?? 10)) {
        setFinished(true);
      } else {
        setCurrentIdx(answeredCount);
      }
    } catch {}
  }, [gameId, user?.userId, router]);

  useEffect(() => {
    if (user) fetchGame();
  }, [fetchGame, user]);

  // Timer
  useEffect(() => {
    if (finished || answerResult !== null) return;
    questionStartRef.current = Date.now();
    setTimeLeft(90);
    if (timerRef?.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000);
      const remaining = Math.max(0, 90 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        // Auto-advance on timeout
        handleTimeout();
      }
    }, 200);
    return () => { if (timerRef?.current) clearInterval(timerRef.current); };
  }, [currentIdx, finished]);

  const handleTimeout = useCallback(() => {
    if (currentIdx >= (questions?.length ?? 0) - 1) {
      setFinished(true);
    } else {
      setCurrentIdx((p) => p + 1);
      setSelectedAnswer(null);
      setAnswerResult(null);
    }
  }, [currentIdx, questions?.length]);

  const submitAnswer = async (answerIdx: number) => {
    if (submitting || answerResult !== null) return;
    setSelectedAnswer(answerIdx);
    setSubmitting(true);

    try {
      const currentQ = questions?.[currentIdx];
      const res = await fetch(`/api/games/${gameId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ?.id,
          respuesta: answerIdx,
          clientTimestamp: questionStartRef.current,
        }),
      });
      const data = await res?.json?.();
      const isCorrect = data?.correct ?? false;
      setAnswerResult(isCorrect);
      if (isCorrect) setScore((s) => s + 1);

      // Auto advance after 1.5s
      setTimeout(() => {
        if (currentIdx >= (questions?.length ?? 0) - 1) {
          setFinished(true);
        } else {
          setCurrentIdx((p) => p + 1);
          setSelectedAnswer(null);
          setAnswerResult(null);
        }
      }, 1500);
    } catch {
      setAnswerResult(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !game) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  if (finished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-display font-bold">¡Quiz completado!</h1>
            <p className="text-muted-foreground mt-2">Acertaste {score} de {questions?.length ?? 10} preguntas</p>
            <button
              onClick={() => router.push(`/game/${gameId}/results`)}
              className="mt-6 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
            >
              Ver ranking
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  const currentQ = questions?.[currentIdx];
  const opciones = (currentQ?.opciones ?? []) as string[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pregunta {currentIdx + 1} de {questions?.length ?? 10}</span>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-mono font-bold ${timeLeft <= 10 ? 'text-destructive' : ''}`}>{timeLeft}s</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / (questions?.length ?? 10)) * 100}%` }} />
        </div>
        {/* Timer bar */}
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all ${timeLeft <= 10 ? 'bg-destructive' : 'bg-green-500'}`} style={{ width: `${(timeLeft / 90) * 100}%` }} />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-xl bg-card shadow-md">
              <h2 className="text-lg font-semibold leading-relaxed">{currentQ?.texto ?? 'Cargando...'}</h2>
            </div>

            <div className="grid gap-3">
              {(opciones ?? []).map((opt: string, idx: number) => {
                let btnClass = 'p-4 rounded-xl text-left transition-all border ';
                if (answerResult !== null && selectedAnswer === idx) {
                  btnClass += answerResult ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-destructive/10 border-destructive text-destructive';
                } else if (selectedAnswer === idx) {
                  btnClass += 'bg-primary/10 border-primary';
                } else {
                  btnClass += 'bg-card border-border hover:border-primary/50 hover:bg-primary/5';
                }
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: answerResult === null ? 1.01 : 1 }}
                    whileTap={{ scale: answerResult === null ? 0.98 : 1 }}
                    onClick={() => submitAnswer(idx)}
                    disabled={answerResult !== null || submitting}
                    className={`${btnClass} disabled:cursor-default flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-medium">{opt ?? ''}</span>
                    </div>
                    {answerResult !== null && selectedAnswer === idx && (
                      answerResult ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="text-center text-sm text-muted-foreground">
          Puntaje actual: <span className="font-bold text-primary">{score}</span>
        </div>
      </main>
    </div>
  );
}
