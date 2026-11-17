export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gameId = params?.id;
    // Get all non-guest, approved participations
    const participations = await prisma.participation.findMany({
      where: { gameId, esInvitado: false, estadoPago: 'approved' },
      include: { user: { select: { id: true, username: true } } },
    });

    const ranking = [];
    for (const p of participations ?? []) {
      const answers = await prisma.answer.findMany({
        where: { userId: p?.userId, gameId },
      });
      const correctCount = (answers ?? []).filter((a: any) => a?.correcta).length;
      const totalTime = (answers ?? []).reduce((sum: number, a: any) => sum + (a?.tiempoRespuesta ?? 0), 0);
      const lastAnswerTime = answers?.length > 0
        ? Math.max(...(answers ?? []).map((a: any) => new Date(a?.createdAt).getTime()))
        : 0;

      ranking.push({
        userId: p?.userId,
        username: p?.user?.username ?? 'Anónimo',
        correctas: correctCount,
        tiempoTotal: totalTime,
        respuestas: answers?.length ?? 0,
        lastAnswerTime,
      });
    }

    ranking.sort((a: any, b: any) => {
      if ((b?.correctas ?? 0) !== (a?.correctas ?? 0)) return (b?.correctas ?? 0) - (a?.correctas ?? 0);
      if ((a?.tiempoTotal ?? 0) !== (b?.tiempoTotal ?? 0)) return (a?.tiempoTotal ?? 0) - (b?.tiempoTotal ?? 0);
      return (a?.lastAnswerTime ?? 0) - (b?.lastAnswerTime ?? 0);
    });

    return NextResponse.json({ ranking: ranking ?? [] });
  } catch (e: any) {
    console.error('Ranking error:', e);
    return NextResponse.json({ ranking: [] });
  }
}
