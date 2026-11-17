export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const gameId = params?.id;
    const body = await req?.json();
    const { questionId, respuesta, clientTimestamp } = body ?? {};

    // Check game is in progress
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game || game?.status !== 'in_progress') {
      return NextResponse.json({ error: 'El quiz no está en progreso' }, { status: 400 });
    }

    // Check participation
    const participation = await prisma.participation.findUnique({
      where: { userId_gameId: { userId: user?.userId, gameId } },
    });
    if (!participation || participation?.estadoPago !== 'approved') {
      return NextResponse.json({ error: 'No tienes acceso a este quiz' }, { status: 403 });
    }

    // Guest: no DB persistence
    if (participation?.esInvitado) {
      // Validate answer server-side but don't persist
      const question = await prisma.question.findUnique({ where: { id: questionId } });
      const isCorrect = question?.respuestaCorrecta === Number(respuesta);
      return NextResponse.json({ correct: isCorrect, guest: true });
    }

    // Check not already answered
    const existingAnswer = await prisma.answer.findUnique({
      where: { userId_gameId_questionId: { userId: user?.userId, gameId, questionId } },
    });
    if (existingAnswer) {
      return NextResponse.json({ error: 'Ya respondiste esta pregunta', correct: existingAnswer?.correcta });
    }

    // Validate answer
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });

    const isCorrect = question?.respuestaCorrecta === Number(respuesta);
    const now = Date.now();
    const tiempoRespuesta = clientTimestamp ? Math.max(0, now - clientTimestamp) : 0;

    // Rate limit: check last answer time
    const lastAnswer = await prisma.answer.findFirst({
      where: { userId: user?.userId, gameId },
      orderBy: { createdAt: 'desc' },
    });
    if (lastAnswer && (now - new Date(lastAnswer?.createdAt).getTime()) < 300) {
      await prisma.suspiciousFlag.create({
        data: { userId: user?.userId, gameId, reason: 'too_fast_answer' },
      });
    }

    const answer = await prisma.answer.create({
      data: {
        userId: user?.userId,
        gameId,
        questionId,
        respuesta: Number(respuesta),
        correcta: isCorrect,
        tiempoRespuesta: Math.min(tiempoRespuesta, 90000),
      },
    });

    const ip = req?.headers?.get?.('x-forwarded-for') ?? '';
    await logActivity({ userId: user?.userId, gameId, action: 'submit_answer', meta: { questionId, correct: isCorrect }, ip });

    return NextResponse.json({ correct: isCorrect, answer });
  } catch (e: any) {
    console.error('Answer submit error:', e);
    return NextResponse.json({ error: 'Error al enviar respuesta' }, { status: 500 });
  }
}
