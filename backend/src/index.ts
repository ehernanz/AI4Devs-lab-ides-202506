import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { upload, handleUploadError } from './middleware/upload';

dotenv.config();
const prisma = new PrismaClient();

export const app = express();
export default prisma;

const port = 3010;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.send('Hola LTI!');
});

// Ruta de login
app.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Actualizar fecha de último acceso
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para verificar token
app.get('/verify-token', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ valid: true, user: req.user });
});

// Ruta para crear un candidato (protegida) con archivo
app.post('/candidates', authenticateToken, upload.single('archivo'), handleUploadError, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, apellido, email, telefono, direccion, educacion, experienciaLaboral } = req.body;
    
    // Información del archivo si se subió
    let archivoData = {};
    if (req.file) {
      archivoData = {
        archivoNombre: req.file.originalname,
        archivoTipo: req.file.mimetype,
        archivoRuta: req.file.filename
      };
    }

    const nuevoCandidato = await prisma.candidate.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        direccion,
        educacion,
        experienciaLaboral,
        ...archivoData
      }
    });
    res.status(201).json(nuevoCandidato);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
    } else {
      res.status(500).json({ error: 'Error al crear el candidato.' });
    }
  }
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.type('text/plain'); 
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
