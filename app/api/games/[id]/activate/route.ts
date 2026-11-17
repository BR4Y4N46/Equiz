export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const game = await prisma.game.findUnique({ where: { id: params?.id } });
    if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    if (game?.status === 'countdown') {
      await prisma.game.update({
        where: { id: params?.id },
        data: { status: 'in_progress' },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
