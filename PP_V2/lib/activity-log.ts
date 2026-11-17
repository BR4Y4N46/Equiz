import { prisma } from '@/lib/prisma';

export async function logActivity(params: {
  userId?: string | null;
  gameId?: string | null;
  action: string;
  meta?: any;
  ip?: string | null;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params?.userId ?? null,
        gameId: params?.gameId ?? null,
        action: params?.action ?? 'unknown',
        meta: params?.meta ?? {},
        ip: params?.ip ?? null,
      },
    });
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}
