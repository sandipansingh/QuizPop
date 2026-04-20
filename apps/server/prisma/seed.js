import { PrismaClient } from '@prisma/client';
import { logger } from '../src/shared/utils/logger.js';
import { seedQuestions } from './seeds/questions.seed.js';

const prisma = new PrismaClient();

async function main() {
  logger.info('Prisma seed run started');
  await seedQuestions(prisma);
  logger.info('Prisma seed run completed');
}

main()
  .catch((error) => {
    logger.error('Question seed failed', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected after seed run');
  });
