const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { PORT, NODE_ENV } = require('./config/env');
const corsOptions = require('./config/cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const teamsRoutes = require('./routes/teams.routes');
const playersRoutes = require('./routes/players.routes');
const gameTypesRoutes = require('./routes/gameTypes.routes');
const tournamentsRoutes = require('./routes/tournaments.routes');
const matchesRoutes = require('./routes/matches.routes');
const adminRoutes = require('./routes/admin.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();

// ─── Middleware ────────────────────────────────────────────
// Trust first proxy (Nginx) — required for express-rate-limit behind reverse proxy
app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(apiLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/teams/:teamId/players', playersRoutes);
app.get('/api/players/birthdays', require('./controllers/players.controller').getBirthdaysToday);
app.use('/api/game-types', gameTypesRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: NODE_ENV });
});

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏆 Socioeducativo API running on port ${PORT}`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
