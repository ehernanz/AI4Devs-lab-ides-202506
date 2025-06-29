import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function initAdmin() {
  try {
    // Verificar si el usuario admin ya existe
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('El usuario admin ya existe');
      return;
    }

    // Crear el usuario admin con contraseña encriptada
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword
      }
    });

    console.log('Usuario admin creado exitosamente');
  } catch (error) {
    console.error('Error al crear el usuario admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initAdmin();