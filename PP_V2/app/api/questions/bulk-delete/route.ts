import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const user = await getCurrentUser();
    console.log('BULK-DELETE user:', JSON.stringify(user, null, 2));
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado', user, role: user?.role  }, { status: 401 });
    }

    // 2. Obtener los IDs
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No se enviaron IDs válidos' }, { status: 400 });
    }

    // 3. Eliminar las preguntas
    const result = await prisma.question.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} preguntas eliminadas correctamente`
    });

  } catch (error) {
    console.error('Error al eliminar preguntas en masa:', error);
    return NextResponse.json(
      { error: 'Error al eliminar las preguntas' },
      { status: 500 }
    );
  }
}
