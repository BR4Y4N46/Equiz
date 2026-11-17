export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const participation = await prisma.participation.findUnique({ where: { id: params?.id } });
    if (!participation) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const newStatus = participation?.estadoPago === 'approved' ? 'pending' : 'approved';
    const updated = await prisma.participation.update({
      where: { id: params?.id },
      data: { estadoPago: newStatus },
    });

    await logActivity({ userId: user?.userId, gameId: participation?.gameId, action: 'approve_player', meta: { participationId: params?.id, newStatus } });

    return NextResponse.json({ participation: updated });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
