export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const questions = await prisma.question.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ questions: questions ?? [] });
  } catch (e: any) {
    return NextResponse.json({ questions: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await req?.json();
    const { texto, opciones, respuestaCorrecta, dificultad, categoria } = body ?? {};

    if (!texto || !opciones || respuestaCorrecta === undefined) {
      return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        texto,
        opciones: opciones ?? [],
        respuestaCorrecta: Number(respuestaCorrecta),
        dificultad: dificultad ?? 'medium',
        tipo: 'multiple',
        categoria: categoria ?? 'general',
      },
    });

    return NextResponse.json({ question });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error al crear pregunta' }, { status: 500 });
  }
}
