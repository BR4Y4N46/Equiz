export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: params?.id },
      include: {
        participations: { include: { user: { select: { id: true, username: true, email: true } } } },
        gameQuestions: { include: { question: true }, orderBy: { orden: 'asc' } },
        results: { include: { user: { select: { id: true, username: true } } }, orderBy: { posicion: 'asc' } },
      },
    });
    if (!game) return NextResponse.json({ error: 'Quiz no encontrado' }, { status: 404 });
    return NextResponse.json({ game });
  } catch (e: any) {
    console.error('Game GET error:', e);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    await prisma.game.delete({ where: { id: params?.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
