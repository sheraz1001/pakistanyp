import multer from "multer";
import path from "path";
import fs from "fs-extra";
import crypto from "crypto";

// Ensure uploads directory exists
const uploadsDir = (process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads'));
fs.ensureDirSync(uploadsDir);

// Ensure blogs directory exists
const blogsDir = path.join(process.cwd(), 'public', 'assets', 'blogs');
fs.ensureDirSync(blogsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Configure multer for blog image uploads (keep original filename)
const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, blogsDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename without any modification
    cb(null, file.originalname);
  }
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Configure multer for blog images (keep original filename, save to blogs folder)
export const blogUpload = multer({
  storage: blogStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Helper function to delete file
export const deleteFile = async (filename: string): Promise<boolean> => {
  try {
    const filePath = path.join(uploadsDir, filename);
    await fs.remove(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to get file URL
export const getFileUrl = (filename: string): string => {
  return `/uploads/${filename}`;
};

// Helper function to get blog image URL
export const getBlogImageUrl = (filename: string): string => {
  return `/assets/blogs/${filename}`;
};

// Helper function to delete blog file
export const deleteBlogFile = async (filename: string): Promise<boolean> => {
  try {
    const filePath = path.join(blogsDir, filename);
    await fs.remove(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting blog file:', error);
    return false;
  }
};