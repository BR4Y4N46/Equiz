import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

const questions = [
  // EASY (10)
  { texto: '¿Cuál es la capital de Francia?', opciones: ['Madrid', 'París', 'Roma', 'Berlín'], respuestaCorrecta: 1, dificultad: 'easy', categoria: 'geografía' },
  { texto: '¿Cuántos continentes hay?', opciones: ['5', '6', '7', '8'], respuestaCorrecta: 2, dificultad: 'easy', categoria: 'geografía' },
  { texto: '¿Cuánto es 7 × 8?', opciones: ['54', '56', '58', '64'], respuestaCorrecta: 1, dificultad: 'easy', categoria: 'matemáticas' },
  { texto: '¿De qué color es el cielo en un día despejado?', opciones: ['Verde', 'Azul', 'Rojo', 'Amarillo'], respuestaCorrecta: 1, dificultad: 'easy', categoria: 'ciencia' },
  { texto: '¿Cuál es el océano más grande del mundo?', opciones: ['Atlántico', 'Índico', 'Pacífico', 'Ártico'], respuestaCorrecta: 2, dificultad: 'easy', categoria: 'geografía' },
  { texto: '¿Qué animal es conocido como el rey de la selva?', opciones: ['Tigre', 'León', 'Elefante', 'Oso'], respuestaCorrecta: 1, dificultad: 'easy', categoria: 'naturaleza' },
  { texto: '¿En qué año llegó el hombre a la Luna?', opciones: ['1965', '1969', '1972', '1975'], respuestaCorrecta: 1, dificultad: 'easy', categoria: 'historia' },
  { texto: '¿Cuántos lados tiene un triángulo?', opciones: ['2', '3', '4', '5'], respuestaCorrecta: 1, dificultad: 'easy', categoria: 'matemáticas' },
  { texto: '¿Cuál es el planeta más cercano al Sol?', opciones: ['Venus', 'Mercurio', 'Marte', 'Tierra'], respuestaCorrecta: 1, dificultad: 'easy', categoria: 'ciencia' },
  { texto: '¿Qué gas respiramos principalmente?', opciones: ['Hidrógeno', 'Oxígeno', 'Nitrógeno', 'CO2'], respuestaCorrecta: 1, dificultad: 'easy', categoria: 'ciencia' },
  // MEDIUM (10)
  { texto: '¿Quién pintó la Mona Lisa?', opciones: ['Van Gogh', 'Da Vinci', 'Picasso', 'Rembrandt'], respuestaCorrecta: 1, dificultad: 'medium', categoria: 'arte' },
  { texto: '¿Cuál es el hueso más largo del cuerpo humano?', opciones: ['Húmero', 'Tibia', 'Fémur', 'Radio'], respuestaCorrecta: 2, dificultad: 'medium', categoria: 'ciencia' },
  { texto: '¿Qué país tiene forma de bota?', opciones: ['España', 'Italia', 'Grecia', 'Portugal'], respuestaCorrecta: 1, dificultad: 'medium', categoria: 'geografía' },
  { texto: '¿Cuál es la moneda de Japón?', opciones: ['Yuan', 'Won', 'Yen', 'Rupia'], respuestaCorrecta: 2, dificultad: 'medium', categoria: 'cultura' },
  { texto: '¿Quién escribió "Cien años de soledad"?', opciones: ['Borges', 'García Márquez', 'Neruda', 'Cortázar'], respuestaCorrecta: 1, dificultad: 'medium', categoria: 'literatura' },
  { texto: '¿Cuál es el metal más abundante en la corteza terrestre?', opciones: ['Hierro', 'Aluminio', 'Cobre', 'Oro'], respuestaCorrecta: 1, dificultad: 'medium', categoria: 'ciencia' },
  { texto: '¿En qué año comenzó la Segunda Guerra Mundial?', opciones: ['1935', '1939', '1941', '1945'], respuestaCorrecta: 1, dificultad: 'medium', categoria: 'historia' },
  { texto: '¿Cuántos jugadores tiene un equipo de fútbol en cancha?', opciones: ['9', '10', '11', '12'], respuestaCorrecta: 2, dificultad: 'medium', categoria: 'deporte' },
  { texto: '¿Qué vitamina proporciona principalmente el Sol?', opciones: ['Vitamina A', 'Vitamina B', 'Vitamina C', 'Vitamina D'], respuestaCorrecta: 3, dificultad: 'medium', categoria: 'ciencia' },
  { texto: '¿Cuál es el río más largo del mundo?', opciones: ['Nilo', 'Amazonas', 'Misisipi', 'Yangtsé'], respuestaCorrecta: 1, dificultad: 'medium', categoria: 'geografía' },
  // HARD (10)
  { texto: '¿Cuál es el número atómico del Carbono?', opciones: ['4', '6', '8', '12'], respuestaCorrecta: 1, dificultad: 'hard', categoria: 'ciencia' },
  { texto: '¿En qué año se fundó la ONU?', opciones: ['1942', '1945', '1948', '1950'], respuestaCorrecta: 1, dificultad: 'hard', categoria: 'historia' },
  { texto: '¿Quién formuló la teoría de la relatividad?', opciones: ['Newton', 'Einstein', 'Hawking', 'Bohr'], respuestaCorrecta: 1, dificultad: 'hard', categoria: 'ciencia' },
  { texto: '¿Cuál es la capital de Mongolia?', opciones: ['Astaná', 'Ulán Bator', 'Biskek', 'Taskent'], respuestaCorrecta: 1, dificultad: 'hard', categoria: 'geografía' },
  { texto: '¿Qué civilización construyó Machu Picchu?', opciones: ['Maya', 'Azteca', 'Inca', 'Olmeca'], respuestaCorrecta: 2, dificultad: 'hard', categoria: 'historia' },
  { texto: '¿Cuántos elementos tiene la tabla periódica actualmente?', opciones: ['112', '118', '120', '126'], respuestaCorrecta: 1, dificultad: 'hard', categoria: 'ciencia' },
  { texto: '¿Quién compuso "Las cuatro estaciones"?', opciones: ['Bach', 'Mozart', 'Vivaldi', 'Beethoven'], respuestaCorrecta: 2, dificultad: 'hard', categoria: 'arte' },
  { texto: '¿Cuál es el país más pequeño del mundo?', opciones: ['Mónaco', 'Vaticano', 'San Marino', 'Liechtenstein'], respuestaCorrecta: 1, dificultad: 'hard', categoria: 'geografía' },
  { texto: '¿Qué protocolo de internet opera en la capa de transporte?', opciones: ['HTTP', 'TCP', 'DNS', 'FTP'], respuestaCorrecta: 1, dificultad: 'hard', categoria: 'tecnología' },
  { texto: '¿En qué año cayó el Muro de Berlín?', opciones: ['1987', '1989', '1991', '1993'], respuestaCorrecta: 1, dificultad: 'hard', categoria: 'historia' },
];

async function main() {
  // Seed admin
  const adminHash = await bcryptjs.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@quiz.com' },
    update: {},
    create: {
      email: 'admin@quiz.com',
      username: 'admin',
      phone: '',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  // Seed test user
  const testHash = await bcryptjs.hash('johndoe123', 10);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      username: 'johndoe',
      phone: '',
      passwordHash: testHash,
      role: 'ADMIN',
    },
  });

  // Seed questions
  for (const q of questions) {
    const existing = await prisma.question.findFirst({
      where: { texto: q.texto },
    });
    if (!existing) {
      await prisma.question.create({
        data: {
          texto: q.texto,
          opciones: q.opciones,
          respuestaCorrecta: q.respuestaCorrecta,
          dificultad: q.dificultad,
          tipo: 'multiple',
          categoria: q.categoria,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
