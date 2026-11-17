// app/api/auth/login/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';
import { validateLDAPUser, checkLDAPAvailability } from '@/lib/ldap';

export async function POST(req: NextRequest) {
  try {
    const body = await req?.json();
    const { email, password } = body ?? {};

    console.log('Intento de login para:', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        passwordHash: true,
      }
    });

    console.log('Usuario encontrado en MySQL:', user ? 'Sí' : 'No');

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    let authSuccess = false;
    let authMethod = 'mysql';
    let ldapError = null;

    
    console.log('Verificando disponibilidad de LDAP...');
    let isLDAPAvailable = false;
    
    try {
      isLDAPAvailable = await checkLDAPAvailability();
      console.log('LDAP disponible:', isLDAPAvailable);
    } catch (error) {
      console.warn('Error al verificar LDAP:', error);
      isLDAPAvailable = false;
    }

    if (isLDAPAvailable) {
      
      console.log(`Intentando autenticar con LDAP para: ${user.username}`);
      try {
        const ldapValid = await validateLDAPUser(user.username, password);
        if (ldapValid) {
          authSuccess = true;
          authMethod = 'ldap';
          console.log(`Usuario ${user.username} autenticado vía LDAP`);
        } else {
          console.log(`LDAP rechazó las credenciales para ${user.username}`);
          ldapError = 'LDAP rechazó las credenciales';
        }
      } catch (error) {
        console.warn('Error en autenticación LDAP:', error);
        ldapError = error instanceof Error ? error.message : 'Error desconocido en LDAP';
      }
    } else {
      console.log('LDAP no disponible, usando solo SQL');
    }

    
    if (!authSuccess) {
      console.log(`Intentando autenticar con MySQL para: ${user.email}`);
      try {
        const valid = await comparePassword(password, user.passwordHash);
        if (valid) {
          authSuccess = true;
          authMethod = 'mysql';
          console.log(`usuario ${user.email} autenticado via MySQL`);
        } else {
          console.log(`mysql rechazo las credenciales para ${user.email}`);
        }
      } catch (error) {
        console.error('err al comparar contrasea en mysql', error);
      }
    }

    
    if (!authSuccess) {
      console.log(`Autenticación fallida para ${email}`);
      return NextResponse.json({ 
        error: 'Credenciales inválidas',
        debug: {
          ldapAvailable: isLDAPAvailable,
          ldapError: ldapError,
          authMethod: authMethod
        }
      }, { status: 401 });
    }

    
    const token = signToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role, 
      username: user.username 
    });

    
    const ip = req?.headers?.get?.('x-forwarded-for') ?? req?.headers?.get?.('x-real-ip') ?? '';
    await logActivity({ 
      userId: user.id, 
      action: 'login', 
      ip,
      meta: { authMethod }
    });

    
    const response = NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        role: user.role 
      },
      authMethod
    });
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    console.log(`Login exitoso para ${email} usando ${authMethod}`);
    return response;
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ 
      error: 'Error al iniciar sesión',
      debug: process.env.NODE_ENV === 'production' ? e.message : undefined
    }, { status: 500 });
  }
}
