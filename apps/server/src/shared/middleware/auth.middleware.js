import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../db/connection.js';
import { ApiError } from '../utils/api-error.js';

export const requireAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = jwt.verify(token, env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        rank: true,
        rating_points: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'Token subject no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired. Please login again.'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }

    return next(error);
  }
};
