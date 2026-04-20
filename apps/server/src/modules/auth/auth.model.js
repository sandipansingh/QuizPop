import { prisma } from '../../shared/db/connection.js';

export const authModel = {
  findUserByEmail: (email) => prisma.user.findUnique({ where: { email } }),

  findUserById: (id) => prisma.user.findUnique({ where: { id } }),

  findUserByUsername: (username) =>
    prisma.user.findUnique({ where: { username } }),

  createUser: (data) =>
    prisma.user.create({
      data,
      select: {
        id: true,
        username: true,
        email: true,
        avatar_url: true,
        bio: true,
        rank: true,
        rating_points: true,
        xp_points: true,
        level: true,
        created_at: true,
      },
    }),

  upsertLeaderboardEntry: (userId) =>
    prisma.leaderboard.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: { last_updated: new Date() },
    }),

  createRefreshTokenSession: ({ userId, tokenJti, tokenHash, expiresAt }) =>
    prisma.refreshTokenSession.create({
      data: {
        user_id: userId,
        token_jti: tokenJti,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    }),

  findRefreshTokenSessionByJti: (tokenJti) =>
    prisma.refreshTokenSession.findUnique({
      where: { token_jti: tokenJti },
    }),

  revokeRefreshTokenSession: ({ tokenJti, replacedByJti = null }) =>
    prisma.refreshTokenSession.update({
      where: { token_jti: tokenJti },
      data: {
        revoked_at: new Date(),
        replaced_by_jti: replacedByJti,
      },
    }),

  rotateRefreshTokenSession: ({
    userId,
    previousTokenJti,
    nextTokenJti,
    nextTokenHash,
    nextExpiresAt,
  }) =>
    prisma.$transaction(async (tx) => {
      await tx.refreshTokenSession.update({
        where: { token_jti: previousTokenJti },
        data: {
          revoked_at: new Date(),
          replaced_by_jti: nextTokenJti,
        },
      });

      await tx.refreshTokenSession.create({
        data: {
          user_id: userId,
          token_jti: nextTokenJti,
          token_hash: nextTokenHash,
          expires_at: nextExpiresAt,
        },
      });
    }),

  revokeAllUserRefreshTokenSessions: (userId) =>
    prisma.refreshTokenSession.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
      },
      data: {
        revoked_at: new Date(),
      },
    }),
};
