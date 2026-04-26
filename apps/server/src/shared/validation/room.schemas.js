import { z } from 'zod';
import { roomIdSchema } from './common.schemas.js';

export const joinRoomBodySchema = z.object({
  room_id: roomIdSchema,
});
