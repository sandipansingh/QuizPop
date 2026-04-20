import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env.js';
import { ApiError } from '../../shared/utils/api-error.js';
import { authModel } from './auth.model.js';

const issueAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email,
      type: 'access',
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );

const parseExpiryToDate = (expiryValue) => {
  const value = String(expiryValue).trim();
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return new Date(Date.now() + numeric * 1000);
  }

  const match = value.match(/^(\d+)\s*([smhd])$/i);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitSeconds = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return new Date(Date.now() + amount * unitSeconds[unit] * 1000);
};

const hashToken = (token) =>
  createHash('sha256')
    .update(`${token}:${env.JWT_REFRESH_SECRET}`)
    .digest('hex');

const issueRefreshToken = ({ userId, tokenJti }) =>
  jwt.sign(
    {
      sub: userId,
      jti: tokenJti,
      type: 'refresh',
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    }
  );

const issueAuthTokens = async (user) => {
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

export const authService = {
  register: async (payload) => {
    const email = payload.email.toLowerCase();
    const username = payload.username.trim();

    const [existingEmail, existingUsername] = await Promise.all([
      authModel.findUserByEmail(email),
      authModel.findUserByUsername(username),
    ]);

    if (existingEmail) {
      throw new ApiError(409, 'Email already in use');
    }

    if (existingUsername) {
      throw new ApiError(409, 'Username already in use');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 12);

    const createdUser = await authModel.createUser({
      username,
      email,
      password: hashedPassword,
      avatar_url: payload.avatar_url,
      bio: payload.bio,
      last_active_at: new Date(),
    });

    await authModel.upsertLeaderboardEntry(createdUser.id);

    const tokens = await issueAuthTokens(createdUser);

    return {
      user: createdUser,
      ...tokens,
    };
  },

  login: async ({ email, password }) => {
    const normalizedEmail = email.toLowerCase();
    const user = await authModel.findUserByEmail(normalizedEmail);

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const tokens = await issueAuthTokens(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        rank: user.rank,
        rating_points: user.rating_points,
        xp_points: user.xp_points,
        level: user.level,
      },
      ...tokens,
    };
  },

  refreshToken: async ({ refresh_token: refreshToken }) => {
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token missing');
    }

    let payload;

    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Refresh token expired. Please login again.');
      }
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (payload.type !== 'refresh' || !payload.jti || !payload.sub) {
      throw new ApiError(401, 'Invalid refresh token payload');
    }

    const session = await authModel.findRefreshTokenSessionByJti(payload.jti);

    if (!session || session.user_id !== payload.sub) {
      throw new ApiError(401, 'Refresh session not found');
    }

    if (session.revoked_at) {
      throw new ApiError(401, 'Refresh token has been revoked');
    }

    if (session.expires_at <= new Date()) {
      await authModel.revokeRefreshTokenSession({ tokenJti: payload.jti });
      throw new ApiError(401, 'Refresh token expired. Please login again.');
    }

    const incomingTokenHash = hashToken(refreshToken);
    if (incomingTokenHash !== session.token_hash) {
      await authModel.revokeAllUserRefreshTokenSessions(payload.sub);
      throw new ApiError(401, 'Refresh token mismatch detected');
    }

    const user = await authModel.findUserById(payload.sub);
    if (!user) {
      throw new ApiError(401, 'User not found for refresh token');
    }

    const nextTokenJti = randomUUID();
    const nextRefreshToken = issueRefreshToken({
      userId: user.id,
      tokenJti: nextTokenJti,
    });
    const nextAccessToken = issueAccessToken(user);

    await authModel.rotateRefreshTokenSession({
      userId: user.id,
      previousTokenJti: payload.jti,
      nextTokenJti,
      nextTokenHash: hashToken(nextRefreshToken),
      nextExpiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
    });

    return {
      access_token: nextAccessToken,
      refresh_token: nextRefreshToken,
      token_type: 'Bearer',
      expires_in: env.JWT_EXPIRES_IN,
      refresh_expires_in: env.JWT_REFRESH_EXPIRES_IN,
    };
  },

  logout: async ({ refresh_token: refreshToken }) => {
    if (!refreshToken) {
      return { logged_out: true };
    }

    let payload;

    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      return { logged_out: true };
    }

    if (!payload?.jti) {
      return { logged_out: true };
    }

    const session = await authModel.findRefreshTokenSessionByJti(payload.jti);
    if (!session || session.revoked_at) {
      return { logged_out: true };
    }

    await authModel.revokeRefreshTokenSession({ tokenJti: payload.jti });

    return { logged_out: true };
  },
};
