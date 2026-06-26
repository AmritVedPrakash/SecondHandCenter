

require('dotenv').config();
const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const connectDB    = require('./config/db');
const chatHandler  = require('./socket/chatHandler');
const errorHandler = require('./middleware/error.middleware');

const app    = express();
const server = http.createServer(app);

// ─── FIX: Increase server-level timeouts for file uploads ─────────────────────
server.timeout          = 120000;  // 2 minutes (was default 0 / 5s in some versions)
server.keepAliveTimeout = 120000;
server.headersTimeout   = 121000;  // must be > keepAliveTimeout

const io = new Server(server, {
  cors: {
    origin:  process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Connect Database
connectDB();

// Make io accessible in controllers
app.set('io', io);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));

// FIX: Increase body limits for multipart uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── FIX: Upload timeout middleware ───────────────────────────────────────────
// Applied only to POST /api/items and POST /api/items/:id/photos
// Gives Cloudinary upload routes 2 full minutes
const uploadTimeout = (req, res, next) => {
  res.setTimeout(120000, () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Upload timed out. Please try with a smaller image (under 2MB) and try again.',
      });
    }
  });
  next();
};

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Too many attempts. Try again after 15 minutes.' },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Too many requests. Slow down.' },
});

app.use('/api/', generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',    authLimiter, require('./routes/auth.routes'));
app.use('/api/users',               require('./routes/user.routes'));

// FIX: Apply uploadTimeout to item photo upload routes
app.use('/api/items', (req, res, next) => {
  // Apply extended timeout for POST requests (item creation + photo upload)
  if (req.method === 'POST') {
    return uploadTimeout(req, res, next);
  }
  next();
}, require('./routes/item.routes'));

app.use('/api/search',  require('./routes/search.routes'));
app.use('/api/chat',    require('./routes/chat.routes'));
app.use('/api/ratings', require('./routes/rating.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/wishlist',   require('./routes/wishlist.routes'));
app.use('/api/admin',      require('./routes/Admin.routes'));
app.use('/api/moderation', require('./routes/Moderation.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'BazaarBuddy API is running 🚀', timestamp: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Socket.io
chatHandler(io);

// Global Error Handler
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 BazaarBuddy Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(`  Upload timeout: 120 seconds\n`);
});