import multer from 'multer';
import { ApiError } from '../utils/api-error.js';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AVATAR_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      return callback(null, true);
    }

    return callback(new ApiError(400, 'Avatar must be PNG, JPEG, or WEBP.'));
  },
});

export const uploadSingleAvatarImage = upload.single('avatar');
