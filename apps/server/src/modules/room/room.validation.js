import { z } from 'zod';

export const createRoomSchema = z.object({
  body: z.object({}),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const joinRoomSchema = z.object({
  body: z.object({
    room_id: z.string().min(1),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
