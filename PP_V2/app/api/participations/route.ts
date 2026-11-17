export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req?.json();
    const { gameId, esInvitado, fingerprintId } = body ?? {};

    if (!gameId) return NextResponse.json({ error: 'gameId requerido' }, { status: 400 });

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game || game?.status !== 'waiting') {
      return NextResponse.json({ error: 'El quiz no está disponible' }, { status: 400 });
    }

    // Check existing participation
    const existing = await prisma.participation.findUnique({
      where: { userId_gameId: { userId: user?.userId, gameId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ya tienes una participación en este quiz', participation: existing });
    }

    // Check fingerprint
    if (fingerprintId && !esInvitado) {
      const fpExists = await prisma.participation.findFirst({
        where: { gameId, fingerprintId, userId: { not: user?.userId }, eliminado: false },
      });
      if (fpExists) {
        await prisma.suspiciousFlag.create({
          data: { userId: user?.userId, gameId, reason: 'duplicate_fingerprint' },
        });
        return NextResponse.json({ error: 'Este dispositivo ya está registrado en el quiz' }, { status: 403 });
      }
    }

    // Check max players
    const playerCount = await prisma.participation.count({
      where: { gameId, esInvitado: false, eliminado: false },
    });
    if (!esInvitado && playerCount >= (game?.maxPlayers ?? 10)) {
      return NextResponse.json({ error: 'El quiz está lleno' }, { status: 400 });
    }

    const ip = req?.headers?.get?.('x-forwarded-for') ?? '';
    const participation = await prisma.participation.create({
      data: {
        userId: user?.userId,
        gameId,
        esInvitado: esInvitado ?? false,
        estadoPago: esInvitado ? 'approved' : 'pending',
        fingerprintId: fingerprintId ?? null,
        ipAddress: ip,
      },
    });

    await logActivity({ userId: user?.userId, gameId, action: 'join_game', meta: { esInvitado }, ip });

    return NextResponse.json({ participation });
  } catch (e: any) {
    console.error('Participation error:', e);
    return NextResponse.json({ error: 'Error al unirse' }, { status: 500 });
  }
}
