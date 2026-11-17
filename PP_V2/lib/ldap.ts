// lib/ldap.ts

import ldap from 'ldapjs';

interface LDAPConfig {
  url: string;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  timeout: number;
}

const LDAP_CONFIG: LDAPConfig = {
  url: process.env.LDAP_URL || 'ldap://localhost:389',
  baseDN: process.env.LDAP_BASE_DN || 'dc=example,dc=com',
  bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=example,dc=com',
  bindPassword: process.env.LDAP_BIND_PASSWORD || 'admin',
  timeout: parseInt(process.env.LDAP_TIMEOUT || '3000'),
};

/**
 * Valida un usuario contra LDAP
 */
export async function validateLDAPUser(username: string, password: string): Promise<boolean> {
  let client: ldap.Client | null = null;

  try {
    console.log(`Buscando usuario ${username} en LDAP...`);

    client = ldap.createClient({
      url: LDAP_CONFIG.url,
      timeout: LDAP_CONFIG.timeout,
      connectTimeout: LDAP_CONFIG.timeout,
    });

    // Buscar el usuario en LDAP
    const searchFilter = `(&(objectClass=person)(|(uid=${username})(cn=${username})(sAMAccountName=${username})))`;
    const searchOptions = {
      scope: 'sub' as const,
      filter: searchFilter,
      attributes: ['dn'],
      sizeLimit: 1,
      timeout: LDAP_CONFIG.timeout,
    };

    // ✅ CORREGIDO: Usar Promise.race para timeout sin search.destroy()
    const entries = await new Promise<any[]>((resolve, reject) => {
      const entries: any[] = [];
      let resolved = false;

      // Timeout
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('LDAP search timeout'));
        }
      }, LDAP_CONFIG.timeout);

      try {
        client!.search(LDAP_CONFIG.baseDN, searchOptions, (err, res) => {
          if (err) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              reject(err);
            }
            return;
          }

          res.on('searchEntry', (entry) => {
            entries.push(entry);
          });

          res.on('error', (err) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              reject(err);
            }
          });

          res.on('end', () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              resolve(entries);
            }
          });
        });
      } catch (searchError) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          reject(searchError);
        }
      }
    });

    if (entries.length === 0) {
      console.log(`Usuario ${username} no encontrado en LDAP`);
      return false;
    }

    const userDN = entries[0].dn;
    console.log(`Usuario encontrado en LDAP: ${userDN}`);

    // Intentar autenticar con el DN del usuario
    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('LDAP bind timeout'));
        }
      }, LDAP_CONFIG.timeout);

      client!.bind(userDN, password, (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      });
    });

    console.log(`Autenticación LDAP exitosa para ${username}`);
    return true;
  } catch (error) {
    console.error('Error en autenticación LDAP:', error);
    return false;
  } finally {
    if (client) {
      try {
        client.unbind(() => {});
      } catch (e) {
        // Ignorar errores al desconectar
      }
    }
  }
}

/**
 * Verifica si LDAP está disponible
 */
export async function checkLDAPAvailability(): Promise<boolean> {
  let client: ldap.Client | null = null;

  try {
    console.log('Verificando conexión LDAP...');

    client = ldap.createClient({
      url: LDAP_CONFIG.url,
      timeout: 3000,
      connectTimeout: 3000,
    });

    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('LDAP connection timeout'));
        }
      }, 3000);

      client!.bind(LDAP_CONFIG.bindDN, LDAP_CONFIG.bindPassword, (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      });
    });

    console.log('LDAP disponible');
    return true;
  } catch (error) {
    console.warn('LDAP no disponible:', error);
    return false;
  } finally {
    if (client) {
      try {
        client.unbind(() => {});
      } catch (e) {
        // Ignorar errores al desconectar
      }
    }
  }
}

/**
 * Sincroniza un usuario con LDAP
 */
export async function syncUserToLDAP(username: string, email: string, password: string): Promise<boolean> {
  let client: ldap.Client | null = null;

  try {
    const isAvailable = await checkLDAPAvailability();
    if (!isAvailable) {
      console.warn('LDAP no disponible, no se puede sincronizar');
      return false;
    }

    client = ldap.createClient({
      url: LDAP_CONFIG.url,
      timeout: LDAP_CONFIG.timeout,
      connectTimeout: LDAP_CONFIG.timeout,
    });

    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('LDAP bind timeout'));
        }
      }, LDAP_CONFIG.timeout);

      client!.bind(LDAP_CONFIG.bindDN, LDAP_CONFIG.bindPassword, (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      });
    });

    // Verificar si el usuario ya existe
    const searchFilter = `(&(objectClass=person)(uid=${username}))`;
    const searchOptions = {
      scope: 'sub' as const,
      filter: searchFilter,
      attributes: ['dn'],
      sizeLimit: 1,
    };

    const entries = await new Promise<any[]>((resolve, reject) => {
      const results: any[] = [];
      let resolved = false;

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('LDAP search timeout'));
        }
      }, LDAP_CONFIG.timeout);

      client!.search(LDAP_CONFIG.baseDN, searchOptions, (err, res) => {
        if (err) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            reject(err);
          }
          return;
        }

        res.on('searchEntry', (entry) => {
          results.push(entry);
        });

        res.on('error', (err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            reject(err);
          }
        });

        res.on('end', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve(results);
          }
        });
      });
    });

    if (entries.length > 0) {
      console.log(`Usuario ${username} ya existe en LDAP`);
      return true;
    }

    // Crear usuario en LDAP
    const dn = `uid=${username},ou=users,${LDAP_CONFIG.baseDN}`;
    const entry = {
      objectClass: ['top', 'person', 'organizationalPerson', 'inetOrgPerson'],
      cn: username,
      sn: username,
      uid: username,
      mail: email,
      userPassword: password,
    };

    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('LDAP add timeout'));
        }
      }, LDAP_CONFIG.timeout);

      client!.add(dn, entry, (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      });
    });

    console.log(`Usuario ${username} sincronizado con LDAP`);
    return true;
  } catch (error) {
    console.error('Error al sincronizar usuario con LDAP:', error);
    return false;
  } finally {
    if (client) {
      try {
        client.unbind(() => {});
      } catch (e) {
        // Ignorar errores al desconectar
      }
    }
  }
}
