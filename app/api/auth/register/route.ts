export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { logActivity } from '@/lib/activity-log';

export async function POST(req: NextRequest) {
  try {
    const body = await req?.json();
    const { email, username, phone, password, recaptchaToken } = body ?? {};

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Campos requeridos: signum, username, password' }, { status: 400 });
    }

    // Verify recaptcha
    if (recaptchaToken) {
      const valid = await verifyRecaptcha(recaptchaToken);
      if (!valid) {
        return NextResponse.json({ error: 'Verificación reCAPTCHA fallida' }, { status: 400 });
      }
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: 'El signum ya está registrado' }, { status: 409 });
    }
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, username, phone: phone ?? '', passwordHash, role: 'USER' },
    });

    const token = signToken({ userId: user?.id, email: user?.email, role: user?.role, username: user?.username });

    const ip = req?.headers?.get?.('x-forwarded-for') ?? req?.headers?.get?.('x-real-ip') ?? '';
    await logActivity({ userId: user?.id, action: 'register', ip });

    const response = NextResponse.json({ user: { id: user?.id, email: user?.email, username: user?.username, role: user?.role } });
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (e: any) {
    console.error('Register error:', e);
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 });
  }
}
