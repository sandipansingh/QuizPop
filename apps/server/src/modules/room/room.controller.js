import { sendSuccess } from '../../shared/utils/http-response.js';
import { roomService } from './room.service.js';

export const roomController = {
  createRoom: async (req, res) => {
    const data = await roomService.createRoom(req.user.id);
    sendSuccess(res, { statusCode: 201, message: 'Room created', data });
  },

  joinRoom: async (req, res) => {
    const data = await roomService.joinRoom({
      roomId: req.validated.body.room_id,
      userId: req.user.id,
    });
    sendSuccess(res, { message: 'Joined room', data });
  },
};
