export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    console.log('USER EN DELETE:', JSON.stringify(user, null, 2));
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado', user }, { status: 403 });
    const body = await req?.json();
    const question = await prisma.question.update({
      where: { id: params?.id },
      data: {
        texto: body?.texto,
        opciones: body?.opciones,
        respuestaCorrecta: Number(body?.respuestaCorrecta),
        dificultad: body?.dificultad,
        categoria: body?.categoria,
      },
    });
    return NextResponse.json({ question });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    await prisma.question.delete({ where: { id: params?.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
