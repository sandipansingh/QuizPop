import { z } from 'zod';
import { joinRoomBodySchema } from '../../shared/validation/room.schemas.js';

export const createRoomSchema = z.object({
  body: z.object({}),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const joinRoomSchema = z.object({
  body: joinRoomBodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
