// lib/auth-service.ts

import { validateLDAPUser, checkLDAPAvailability } from '../lib/ldap';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  passwordHash: string; // ✅ Cambiado de password a passwordHash
}

export async function authenticateUser(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'> | null; error?: string }> {
  try {
    // 1. Buscar usuario en MySQL incluyendo passwordHash
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        passwordHash: true, // ✅ Cambiado de password a passwordHash
      },
    });

    if (!user) {
      return { user: null, error: 'Credenciales inválidas' };
    }

    // 2. Verificar disponibilidad de LDAP
    const isLDAPAvailable = await checkLDAPAvailability();

    let authSuccess = false;

    if (isLDAPAvailable) {
      // 3. Autenticar con LDAP usando el username
      const username = user.username;
      authSuccess = await validateLDAPUser(username, password);

      if (authSuccess) {
        console.log(`Usuario ${username} autenticado vía LDAP`);
        // Retornar usuario SIN passwordHash
        const { passwordHash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword };
      }
    }

    // 4. Si LDAP no está disponible o falla, usar MySQL
    console.log(`Validando credenciales en MySQL para ${email}`);

    // Verificar la contraseña almacenada en MySQL
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash); // ✅ Cambiado a passwordHash

    if (isPasswordValid) {
      console.log(`Usuario ${email} autenticado vía MySQL`);
      // Retornar usuario SIN passwordHash
      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    }

    return { user: null, error: 'Credenciales inválidas' };
  } catch (error) {
    console.error('Error en autenticación:', error);
    return { user: null, error: 'Error interno del servidor' };
  }
}

// Función para crear usuario
export async function createUser(data: {
  email: string;
  username: string;
  phone?: string;
  password: string;
}): Promise<{ user: Omit<User, 'passwordHash'> | null; error?: string }> {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { user: null, error: 'El usuario ya existe' };
    }

    // Encriptar contraseña para MySQL
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Crear usuario en MySQL
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        phone: data.phone || '',
        passwordHash: hashedPassword, // ✅ Cambiado de password a passwordHash
        role: 'USER',
      },
    });

    // Retornar usuario SIN passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { user: null, error: 'Error al crear usuario' };
  }
}

// Función para obtener usuario sin passwordHash (para uso general)
export async function getUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      phone: true,
      createdAt: true,
      // passwordHash NO incluido por seguridad
    },
  });
  return user;
}
