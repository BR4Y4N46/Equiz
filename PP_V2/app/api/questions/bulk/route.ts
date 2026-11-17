import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener el archivo del FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // 3. Validar que sea CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Solo se permiten archivos CSV' }, { status: 400 });
    }

    // 4. Leer el contenido del archivo
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
      return NextResponse.json({ error: 'El archivo CSV está vacío o solo tiene encabezados' }, { status: 400 });
    }

    // 5. Parsear encabezados
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // 6. Verificar que los encabezados sean correctos
    const requiredHeaders = ['texto', 'opcion0', 'opcion1', 'opcion2', 'opcion3', 'respuestacorrecta'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({
        error: `Faltan columnas requeridas: ${missingHeaders.join(', ')}`
      }, { status: 400 });
    }

    // 7. Procesar cada línea
    const questions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const obj: any = {};
      
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });

      // Validar datos mínimos
      if (!obj.texto || !obj.opcion0 || !obj.opcion1 || !obj.opcion2 || !obj.opcion3) {
        errors.push(`Línea ${i + 1}: Faltan campos obligatorios`);
        continue;
      }

      // Validar respuestaCorrecta
      const respuestaCorrecta = Number(obj.respuestacorrecta);
      if (isNaN(respuestaCorrecta) || respuestaCorrecta < 0 || respuestaCorrecta > 3) {
        errors.push(`Línea ${i + 1}: respuestaCorrecta debe ser 0, 1, 2 o 3`);
        continue;
      }

      questions.push({
        texto: obj.texto,
        opciones: [obj.opcion0, obj.opcion1, obj.opcion2, obj.opcion3],
        respuestaCorrecta: respuestaCorrecta,
        dificultad: obj.dificultad || 'medium',
        categoria: obj.categoria || 'general',
      });
    }

    if (questions.length === 0) {
      return NextResponse.json({
        error: 'No se pudieron procesar preguntas. Verifica el formato del CSV.'
      }, { status: 400 });
    }

    // 8. Guardar en la base de datos
    let created = 0;

    for (const q of questions) {
      try {
        await prisma.question.create({
          data: {
            texto: q.texto,
            opciones: q.opciones,
            respuestaCorrecta: q.respuestaCorrecta,
            dificultad: q.dificultad,
            categoria: q.categoria,
          }
        });
        created++;
      } catch (error) {
        errors.push(`Error al guardar: "${q.texto.substring(0, 30)}..."`);
      }
    }

    // 9. Respuesta final
    return NextResponse.json({
      success: true,
      count: created,
      total: questions.length,
      message: `${created} preguntas importadas correctamente`
    });

  } catch (error) {
    console.error('Error en carga masiva:', error);
    return NextResponse.json(
      { error: 'Error al procesar el archivo' },
      { status: 500 }
    );
  }
}
