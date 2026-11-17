export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const game = await prisma.game.findUnique({ where: { id: params?.id } });
    if (!game || game?.status !== 'waiting') {
      return NextResponse.json({ error: 'El quiz no está en espera' }, { status: 400 });
    }

    const approvedCount = await prisma.participation.count({
      where: { gameId: params?.id, estadoPago: 'approved', eliminado: false },
    });
    if (approvedCount < 1) {
      return NextResponse.json({ error: 'Se necesita al menos 1 participante aprobado' }, { status: 400 });
    }

    const now = new Date();
    await prisma.game.update({
      where: { id: params?.id },
      data: { status: 'countdown', startTimestamp: now },
    });

    await logActivity({ userId: user?.userId, gameId: params?.id, action: 'start_countdown' });

    return NextResponse.json({ ok: true, startTimestamp: now?.toISOString() });
  } catch (e: any) {
    console.error('Start game error:', e);
    return NextResponse.json({ error: 'Error al iniciar' }, { status: 500 });
  }
}
