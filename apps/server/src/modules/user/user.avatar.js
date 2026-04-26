import { ApiError } from '../../shared/utils/api-error.js';
import {
  buildAvatarObjectKey,
  getAvatarObjectStream,
  extractAvatarObjectKeyFromUrl,
  getAvatarPublicUrl,
  putAvatarObject,
  removeAvatarObject,
  statAvatarObject,
} from '../../shared/storage/minio.js';
import { env } from '../../shared/config/env.js';
import { userModel } from './user.model.js';
import { invalidateUserCaches } from './user.cache.js';

export const resolveAvatarObjectKey = (avatarUrl) => {
  if (!avatarUrl) return null;
  const rawUrl = String(avatarUrl).trim();
  if (!rawUrl) return null;
  if (rawUrl.startsWith('users/')) return rawUrl;
  const proxyQueryPrefix = `${env.SERVER_PUBLIC_BASE_URL}/api/user/avatar/object?key=`;
  if (rawUrl.startsWith(proxyQueryPrefix)) {
    return decodeURIComponent(rawUrl.slice(proxyQueryPrefix.length));
  }
  return extractAvatarObjectKeyFromUrl(rawUrl);
};

export const loadAvatarFileByObjectKey = async (objectKey) => {
  let objectStat;
  try {
    objectStat = await statAvatarObject(objectKey);
  } catch {
    throw new ApiError(404, 'Avatar not found');
  }
  const stream = await getAvatarObjectStream(objectKey);
  return {
    stream,
    size: objectStat.size,
    etag: objectStat.etag,
    lastModified: objectStat.lastModified,
    contentType:
      objectStat.metaData?.['content-type'] || 'application/octet-stream',
  };
};

export const avatarService = {
  getAvatarObjectView: async (objectKey) => {
    const sanitizedKey = String(objectKey || '').trim();
    if (!sanitizedKey || !sanitizedKey.startsWith('users/')) {
      throw new ApiError(400, 'Invalid avatar object key');
    }
    return loadAvatarFileByObjectKey(sanitizedKey);
  },

  getUserAvatarView: async (targetUserId) => {
    const userAvatar = await userModel.getUserAvatarById(targetUserId);
    if (!userAvatar?.avatar_url) throw new ApiError(404, 'Avatar not found');
    const objectKey = resolveAvatarObjectKey(userAvatar.avatar_url);
    if (!objectKey) throw new ApiError(404, 'Avatar not found');
    return loadAvatarFileByObjectKey(objectKey);
  },

  uploadMyAvatar: async (userId, file) => {
    const user = await userModel.getUserProfileById(userId);
    if (!user) throw new ApiError(404, 'User profile not found');
    if (!file?.buffer?.length)
      throw new ApiError(400, 'Avatar file is required');

    const objectKey = buildAvatarObjectKey({
      userId,
      contentType: file.mimetype,
      fileName: file.originalname,
    });
    await putAvatarObject({
      objectKey,
      fileBuffer: file.buffer,
      contentType: file.mimetype,
    });
    const avatarUrl = getAvatarPublicUrl(objectKey);
    const updated = await userModel.updateUserAvatarUrl({ userId, avatarUrl });

    const previousObjectKey = resolveAvatarObjectKey(user.avatar_url);
    if (previousObjectKey && previousObjectKey !== objectKey) {
      try {
        await removeAvatarObject(previousObjectKey);
      } catch {
        /* ignore */
      }
    }

    await invalidateUserCaches(userId);
    return {
      user_id: updated.id,
      avatar_url: updated.avatar_url,
      object_key: objectKey,
    };
  },

  deleteMyAvatar: async (userId) => {
    const user = await userModel.getUserProfileById(userId);
    if (!user) throw new ApiError(404, 'User profile not found');

    const objectKey = resolveAvatarObjectKey(user.avatar_url);
    if (objectKey) {
      try {
        await removeAvatarObject(objectKey);
      } catch {
        /* ignore */
      }
    }

    const updated = await userModel.clearUserAvatarUrl(userId);
    await invalidateUserCaches(userId);
    return {
      user_id: updated.id,
      avatar_url: updated.avatar_url,
      removed_object_key: objectKey,
    };
  },
};
