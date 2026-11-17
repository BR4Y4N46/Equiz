import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Verificar autenticación
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = params.id;

    // 2. Verificar que el usuario existe
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. No permitir eliminar a otro ADMIN
    if (userToDelete.role === 'ADMIN') {
      return NextResponse.json({ error: 'No se puede eliminar un administrador' }, { status: 400 });
    }

    // 4. Eliminar el usuario
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Usuario eliminado correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
