import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes';
import partidosRoutes from './routes/partidos.routes';
import prediccionesRoutes from './routes/predicciones.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import adminRoutes from './routes/admin.routes';
import notificationsRoutes from './routes/notifications.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares globales ────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ─── Health check ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Rutas ───────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/partidos', partidosRoutes);
app.use('/api/predicciones', prediccionesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);

// ─── Error handler global ────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error no manejado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── Iniciar servidor ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Quinela API corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
