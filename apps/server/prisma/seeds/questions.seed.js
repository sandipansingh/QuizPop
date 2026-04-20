import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { logger } from '../../src/shared/utils/logger.js';

const DEFAULT_BATCH_SIZE = 100;

const rawQuestionSchema = z
  .object({
    question: z.string().trim().min(1).optional(),
    question_text: z.string().trim().min(1).optional(),
    options: z.array(z.string().trim().min(1)).min(2),
    answer: z.string().trim().min(1).optional(),
    correct_answer: z.string().trim().min(1).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
    category: z.string().trim().min(1).default('General'),
    tags: z.array(z.string().trim().min(1)).default([]),
  })
  .superRefine((value, context) => {
    if (!value.question && !value.question_text) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must have "question" (string)',
        path: ['question'],
      });
    }

    if (!value.answer && !value.correct_answer) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must have "answer"',
        path: ['answer'],
      });
    }
  });

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const questionsFilePath = path.join(thisDir, 'data', 'questions.json');

const parseQuestionsFile = async (filePath) => {
  const fileContent = await readFile(filePath, 'utf8');
  const parsedJson = JSON.parse(fileContent);

  if (!Array.isArray(parsedJson)) {
    throw new Error('Seed file must contain a JSON array of questions.');
  }

  const validQuestions = [];
  const validationErrors = [];

  parsedJson.forEach((item, index) => {
    const result = rawQuestionSchema.safeParse(item);

    if (!result.success) {
      const issueSummary = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ');
      validationErrors.push(`index ${index}: ${issueSummary}`);
      return;
    }

    const normalized = result.data;
    validQuestions.push({
      question_text: normalized.question ?? normalized.question_text,
      options: normalized.options,
      correct_answer: normalized.answer ?? normalized.correct_answer,
      difficulty: normalized.difficulty,
      category: normalized.category,
      tags: normalized.tags,
    });
  });

  if (validationErrors.length > 0) {
    throw new Error(
      `Validation failed for ${validationErrors.length} item(s):\n${validationErrors.join('\n')}`
    );
  }

  return validQuestions;
};

const dedupeQuestions = (questions) => {
  const uniqueByQuestionText = new Map();

  questions.forEach((question) => {
    const dedupeKey = question.question_text.trim().toLowerCase();
    if (!uniqueByQuestionText.has(dedupeKey)) {
      uniqueByQuestionText.set(dedupeKey, question);
    }
  });

  return Array.from(uniqueByQuestionText.values());
};

const insertQuestionsInBatches = async ({ prisma, questions, batchSize }) => {
  let insertedCount = 0;
  const totalBatches = Math.ceil(questions.length / batchSize);

  for (let start = 0; start < questions.length; start += batchSize) {
    const batch = questions.slice(start, start + batchSize);
    const batchNumber = Math.floor(start / batchSize) + 1;

    const result = await prisma.question.createMany({
      data: batch,
      skipDuplicates: true,
    });

    insertedCount += result.count;

    logger.info('Question seed batch inserted', {
      batchNumber,
      totalBatches,
      batchSize: batch.length,
      insertedInBatch: result.count,
    });
  }

  return insertedCount;
};

export const seedQuestions = async (prisma, batchSize = DEFAULT_BATCH_SIZE) => {
  const validatedQuestions = await parseQuestionsFile(questionsFilePath);
  const uniqueQuestions = dedupeQuestions(validatedQuestions);

  logger.info('Question seeding started', {
    seedFilePath: questionsFilePath,
    recordsInFile: validatedQuestions.length,
    uniqueRecords: uniqueQuestions.length,
    batchSize,
  });

  const insertedCount = await insertQuestionsInBatches({
    prisma,
    questions: uniqueQuestions,
    batchSize,
  });

  logger.info('Question seeding completed', {
    seedFilePath: questionsFilePath,
    validatedRecords: validatedQuestions.length,
    uniqueRecords: uniqueQuestions.length,
    insertedRecords: insertedCount,
  });
};
