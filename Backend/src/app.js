const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const { UPLOAD_PUBLIC_DIR, UPLOAD_PRIVATE_DIR } = require('./config/env');
const corsOptions = require('./config/cors');
const { apiLimiter } = require('./middleware/rateLimiter');
const { csrfProtection } = require('./middleware/csrfProtection');
const errorHandler = require('./middleware/errorHandler');
const healthController = require('./modules/health/health.controller');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const siteContentRoutes = require('./modules/site-content/siteContent.routes');
const publicProjectsRoutes = require('./modules/projects/projects.public.routes');
const publicRecordsRoutes = require('./modules/records/records.public.routes');
const staffProjectsRoutes = require('./modules/projects/projects.staff.routes');
const staffProjectRecordsRoutes = require('./modules/records/records.staffProject.routes');
const staffRecordsRoutes = require('./modules/records/records.staff.routes');
const staffRecordFilesRoutes = require('./modules/files/files.staff.routes');
const filesRoutes = require('./modules/files/files.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const adminSiteContentRoutes = require('./modules/site-content/siteContent.admin.routes');
const adminProjectsRoutes = require('./modules/projects/projects.admin.routes');
const adminRecordsRoutes = require('./modules/records/records.admin.routes');
const adminUsersRoutes = require('./modules/users/users.admin.routes');

const app = express();

// Trust first proxy (Nginx), required for rate limiting behind reverse proxy.
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(csrfProtection);

// Uploaded files are delivered through authenticated/authorized API endpoints.
const publicUploadPath = path.resolve(process.cwd(), UPLOAD_PUBLIC_DIR);
const privateUploadPath = path.resolve(process.cwd(), UPLOAD_PRIVATE_DIR);
fs.mkdirSync(publicUploadPath, { recursive: true });
fs.mkdirSync(privateUploadPath, { recursive: true });

// Health endpoints
app.get('/api/health', healthController.health);
app.get('/api/ready', healthController.ready);

app.use(apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/projects', publicProjectsRoutes);
app.use('/api/records', publicRecordsRoutes);
app.use('/api/my/projects', staffProjectsRoutes);
app.use('/api/my/projects', staffProjectRecordsRoutes);
app.use('/api/my/records', staffRecordsRoutes);
app.use('/api/my/records', staffRecordFilesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/site-content', adminSiteContentRoutes);
app.use('/api/admin/projects', adminProjectsRoutes);
app.use('/api/admin/records', adminRecordsRoutes);
app.use('/api/admin/users', adminUsersRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

module.exports = app;
