import { sendSuccess } from '../../shared/utils/http-response.js';
import { userService } from './user.service.js';

const streamAvatarResponse = (res, avatarFile) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Type', avatarFile.contentType);
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (avatarFile.etag) {
    res.setHeader('ETag', avatarFile.etag);
  }

  if (avatarFile.lastModified) {
    res.setHeader('Last-Modified', avatarFile.lastModified.toUTCString());
  }

  if (Number.isInteger(avatarFile.size) && avatarFile.size >= 0) {
    res.setHeader('Content-Length', String(avatarFile.size));
  }

  avatarFile.stream.on('error', () => {
    if (!res.headersSent) {
      res.status(404).end();
      return;
    }

    res.destroy();
  });

  avatarFile.stream.pipe(res);
};

export const userController = {
  viewAvatarObject: async (req, res) => {
    const avatarFile = await userService.getAvatarObjectView(
      req.validated.query.key
    );
    streamAvatarResponse(res, avatarFile);
  },

  viewUserAvatar: async (req, res) => {
    const avatarFile = await userService.getUserAvatarView(
      req.validated.params.userId
    );
    streamAvatarResponse(res, avatarFile);
  },

  changePassword: async (req, res) => {
    const data = await userService.changeMyPassword(
      req.user.id,
      req.validated.body
    );
    sendSuccess(res, { message: 'Password changed', data });
  },

  updateProfile: async (req, res) => {
    const data = await userService.updateMyProfile(
      req.user.id,
      req.validated.body
    );
    sendSuccess(res, { message: 'Profile updated', data });
  },

  getPublicProfile: async (req, res) => {
    const data = await userService.getPublicProfileById(
      req.validated.params.userId
    );
    sendSuccess(res, { message: 'Public profile fetched', data });
  },

  getPublicProfileByUsername: async (req, res) => {
    const data = await userService.getPublicProfileByUsername(
      req.validated.params.username
    );
    sendSuccess(res, { message: 'Public profile fetched', data });
  },

  deleteMyAvatar: async (req, res) => {
    const data = await userService.deleteMyAvatar(req.user.id);
    sendSuccess(res, { message: 'Avatar removed', data });
  },

  uploadMyAvatar: async (req, res) => {
    const data = await userService.uploadMyAvatar(req.user.id, req.file);
    sendSuccess(res, { message: 'Avatar updated', data });
  },

  getProfile: async (req, res) => {
    const data = await userService.getMyProfile(req.user.id);
    sendSuccess(res, { message: 'Profile fetched', data });
  },

  getStats: async (req, res) => {
    const data = await userService.getMyStats(req.user.id);
    sendSuccess(res, { message: 'Stats fetched', data });
  },
};
