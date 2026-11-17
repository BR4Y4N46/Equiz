// app/api/games/[id]/finish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const gameId = params.id;
    
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    });

    if (!game) {
      return NextResponse.json({ error: 'Quiz no encontrado' }, { status: 404 });
    }

    if (game.status !== 'in_progress') {
      return NextResponse.json({ error: 'El quiz no está en progreso' }, { status: 400 });
    }

    // Ahora sí puedes usar endedAt
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: { 
        status: 'finished',
        endedAt: new Date()  
      }
    });

    return NextResponse.json({ 
      success: true, 
      game: updatedGame 
    });

  } catch (error) {
    console.error('Error al finalizar quiz:', error);
    return NextResponse.json(
      { error: 'Error al finalizar el quiz' },
      { status: 500 }
    );
  }
}
