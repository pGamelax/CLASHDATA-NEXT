import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';
import { env } from '../env';

const connectionString = env.DATABASE_URL;


const pool = new Pool({
  connectionString,
  max: 15, 
  min: 2, 
  idleTimeoutMillis: 20000, 
  connectionTimeoutMillis: 5000, 
  allowExitOnIdle: true,
});

// Trata erros do pool
pool.on('error', () => {
  // Erro inesperado no pool do PostgreSQL
});

const adapter = new PrismaPg(pool);

const prismaClient = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Wrapper para tratar erros P2025 em operações de delete
// Isso é necessário porque o Better Auth pode tentar deletar sessões que já foram removidas
export const prisma = new Proxy(prismaClient, {
  get(target, prop) {
    const value = (target as any)[prop];
    
    // Intercepta modelos do Prisma (Session, Account, etc)
    if (typeof value === 'object' && value !== null && 'delete' in value) {
      return new Proxy(value, {
        get(modelTarget, modelProp) {
          const modelValue = (modelTarget as any)[modelProp];
          
          // Intercepta o método delete
          if (modelProp === 'delete' && typeof modelValue === 'function') {
            return async (...args: any[]) => {
              try {
                return await modelValue.apply(modelTarget, args);
              } catch (error: any) {
                // Se o erro for P2025 (record not found), trata como sucesso
                if (error?.code === 'P2025') {
                  return null;
                }
                throw error;
              }
            };
          }
          
          // Intercepta o método deleteMany
          if (modelProp === 'deleteMany' && typeof modelValue === 'function') {
            return async (...args: any[]) => {
              try {
                return await modelValue.apply(modelTarget, args);
              } catch (error: any) {
                // Se o erro for P2025 (record not found), trata como sucesso
                if (error?.code === 'P2025') {
                  return { count: 0 };
                }
                throw error;
              }
            };
          }
          
          return modelValue;
        },
      });
    }
    
    return value;
  },
});
