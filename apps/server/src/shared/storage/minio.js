import { randomUUID } from 'crypto';
import * as Minio from 'minio';

import { env } from '../config/env.js';

const resolveMinioConnection = () => {
  const endpoint = String(env.MINIO_ENDPOINT || '').trim();

  if (!endpoint.includes(':')) {
    return {
      endPoint: endpoint,
      port: env.MINIO_PORT,
    };
  }

  const [host, rawPort] = endpoint.split(':');
  const parsedPort = Number.parseInt(rawPort, 10);

  return {
    endPoint: host,
    port: Number.isInteger(parsedPort) ? parsedPort : env.MINIO_PORT,
  };
};

const contentTypeToExtension = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const stripUnsafe = (value) => value.replace(/[^a-zA-Z0-9._-]/g, '');

const resolveExtension = ({ contentType, fileName }) => {
  const fromType = contentTypeToExtension[contentType];
  if (fromType) {
    return fromType;
  }

  const parts = String(fileName || '').split('.');
  const raw = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  const sanitized = stripUnsafe(raw);
  return sanitized || 'bin';
};

export const minioClient = new Minio.Client({
  ...resolveMinioConnection(),
  region: env.MINIO_REGION,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const buildAvatarObjectKey = ({ userId, fileName, contentType }) => {
  const extension = resolveExtension({ contentType, fileName });
  return `users/${userId}/avatars/${randomUUID()}.${extension}`;
};

export const putAvatarObject = async ({ objectKey, fileBuffer, contentType }) =>
  minioClient.putObject(
    env.MINIO_AVATARS_BUCKET,
    objectKey,
    fileBuffer,
    fileBuffer.length,
    {
      'Content-Type': contentType,
    }
  );

export const statAvatarObject = (objectKey) =>
  minioClient.statObject(env.MINIO_AVATARS_BUCKET, objectKey);

export const getAvatarObjectStream = (objectKey) =>
  minioClient.getObject(env.MINIO_AVATARS_BUCKET, objectKey);

export const removeAvatarObject = (objectKey) =>
  minioClient.removeObject(env.MINIO_AVATARS_BUCKET, objectKey);

export const getAvatarPublicUrl = (objectKey) =>
  `${env.SERVER_PUBLIC_BASE_URL}/api/user/avatar/object?key=${encodeURIComponent(objectKey)}`;

export const extractAvatarObjectKeyFromUrl = (avatarUrl) => {
  if (!avatarUrl) {
    return null;
  }

  const expectedPrefix = `${env.MINIO_PUBLIC_BASE_URL}/${env.MINIO_AVATARS_BUCKET}/`;
  if (!avatarUrl.startsWith(expectedPrefix)) {
    return null;
  }

  return avatarUrl.slice(expectedPrefix.length);
};
