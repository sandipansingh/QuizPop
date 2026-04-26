import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env.js';
import { authModel } from './auth.model.js';

export const issueAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
      type: 'access',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

export const parseExpiryToDate = (expiryValue) => {
  const value = String(expiryValue).trim();
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return new Date(Date.now() + numeric * 1000);

  const match = value.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitSeconds = { s: 1, m: 60, h: 60 * 60, d: 24 * 60 * 60 };
  return new Date(Date.now() + amount * unitSeconds[unit] * 1000);
};

export const hashToken = (token) =>
  createHash('sha256')
    .update(`${token}:${env.JWT_REFRESH_SECRET}`)
    .digest('hex');

export const issueRefreshToken = ({ userId, tokenJti }) =>
  jwt.sign(
    { sub: userId, jti: tokenJti, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

export const issueAuthTokens = async (user) => {
  const accessToken = issueAccessToken(user);
  const refreshTokenJti = randomUUID();
  const refreshToken = issueRefreshToken({
    userId: user.id,
    tokenJti: refreshTokenJti,
  });

  await authModel.createRefreshTokenSession({
    userId: user.id,
    tokenJti: refreshTokenJti,
    tokenHash: hashToken(refreshToken),
    expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: env.JWT_EXPIRES_IN,
    refresh_expires_in: env.JWT_REFRESH_EXPIRES_IN,
  };
};
