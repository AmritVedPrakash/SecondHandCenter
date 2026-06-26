

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // FIX 1: Increase SDK timeout (milliseconds)
  timeout:    120000,
});

// ── Item photos storage ───────────────────────────────────────────────────────
const itemStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:          'bazaarbuddy/items',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // FIX 2: Smaller dimensions = faster upload = no timeout
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto:low', fetch_format: 'auto' }
    ],
    // FIX 3: Unique filename
    public_id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
     moderation: process.env.CLOUDINARY_MODERATION || 'aws_rek',
  }),
});

// ── Avatar storage ────────────────────────────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:          'bazaarbuddy/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto:low' }
    ],
    public_id: `avatar_${Date.now()}`,
  }),
});

// ── College ID storage ────────────────────────────────────────────────────────
const collegeIdStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:          'bazaarbuddy/college-ids',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    public_id:       `college_${Date.now()}`,
  }),
});

// ── File filter ───────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, WEBP images and PDFs are allowed.'), false);
  }
};

// ── Multer instances ──────────────────────────────────────────────────────────
const uploadItemPhotos = multer({
  storage: itemStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 MB per file
    files:    4,
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

const uploadCollegeId = multer({
  storage: collegeIdStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

module.exports = { cloudinary, uploadItemPhotos, uploadAvatar, uploadCollegeId };