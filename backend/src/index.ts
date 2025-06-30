import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { authenticateToken, AuthRequest, requireAdmin } from './middleware/auth';
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

// --- Gestión de usuarios (solo admin) ---
app.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, lastLoginAt: true, createdAt: true, updatedAt: true } });
  res.json(users);
});

app.get('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    select: { id: true, username: true, role: true, lastLoginAt: true, createdAt: true, updatedAt: true }
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

app.post('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }
    if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Rol no válido' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'user'
      },
      select: { id: true, username: true, role: true, createdAt: true }
    });
    res.status(201).json(newUser);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'El nombre de usuario ya está registrado.' });
    } else {
      res.status(500).json({ error: 'Error al crear el usuario.' });
    }
  }
});

app.put('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, role } = req.body;
    const userId = Number(req.params.id);
    const data: any = {};
    if (username) data.username = username;
    if (role && ['admin', 'user'].includes(role)) {
      if (req.user && req.user.id === userId && role !== 'admin') {
        return res.status(400).json({ error: 'No puedes cambiar tu propio rol a usuario.' });
      }
      data.role = role;
    }
    if (password) data.password = await bcrypt.hash(password, 10);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, role: true, updatedAt: true }
    });
    res.json(updatedUser);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'El nombre de usuario ya está registrado.' });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    } else {
      res.status(500).json({ error: 'Error al actualizar el usuario.' });
    }
  }
});

app.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (req.user && req.user.id === userId) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario.' });
  }
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado.' });
    } else {
      res.status(500).json({ error: 'Error al eliminar el usuario.' });
    }
  }
});

// --- Fin gestión de usuarios ---

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

    // Generar token JWT (ahora incluye el rol)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
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
