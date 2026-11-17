export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const games = await prisma.game.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ games: games ?? [] });
  } catch (e: any) {
    console.error('Games GET error:', e);
    return NextResponse.json({ games: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const body = await req?.json();
    const { categoria, costo, maxPlayers, maxWinners } = body ?? {};

    if (!categoria) {
      return NextResponse.json({ error: 'Categoría requerida' }, { status: 400 });
    }

    // Select 10 questions: 3 easy, 3 medium, 4 hard
    const easy = await prisma.question.findMany({ where: { dificultad: 'easy' }, take: 100 });
    const medium = await prisma.question.findMany({ where: { dificultad: 'medium' }, take: 100 });
    const hard = await prisma.question.findMany({ where: { dificultad: 'hard' }, take: 100 });

    const shuffle = (arr: any[]) => {
      const a = [...(arr ?? [])];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const selected = [
      ...shuffle(easy).slice(0, 3),
      ...shuffle(medium).slice(0, 3),
      ...shuffle(hard).slice(0, 4),
    ];

    if ((selected?.length ?? 0) < 5) {
      return NextResponse.json({ error: 'No hay suficientes preguntas en la base de datos (se necesitan al menos 5)' }, { status: 400 });
    }

    const game = await prisma.game.create({
      data: {
        categoria: categoria ?? 'general',
        costo: Number(costo) || 0,
        maxPlayers: Number(maxPlayers) || 10,
        maxWinners: Number(maxWinners) || 3,
        status: 'waiting',
      },
    });

    // Link questions
    for (let i = 0; i < selected.length; i++) {
      await prisma.gameQuestion.create({
        data: { gameId: game?.id, questionId: selected[i]?.id, orden: i + 1 },
      });
    }

    return NextResponse.json({ game });
  } catch (e: any) {
    console.error('Game create error:', e);
    return NextResponse.json({ error: 'Error al crear quiz' }, { status: 500 });
  }
}
