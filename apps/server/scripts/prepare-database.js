import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const runPrismaCommand = (args) =>
  new Promise((resolve, reject) => {
    const childProcess = spawn('npx', ['prisma', ...args], {
      stdio: 'inherit',
      shell: false,
    });

    childProcess.on('error', reject);
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Prisma command failed: prisma ${args.join(' ')}`));
    });
  });

const resolveMigrationDirectories = async () => {
  const migrationsPath = join(process.cwd(), 'prisma', 'migrations');

  try {
    const entries = await readdir(migrationsPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
};

const prepareDatabase = async () => {
  const migrationDirectories = await resolveMigrationDirectories();

  if (migrationDirectories.length > 0) {
    console.log('Migrations detected. Running prisma migrate deploy...');
    await runPrismaCommand(['migrate', 'deploy']);
    return;
  }

  console.log('No migrations found. Running prisma db push...');
  await runPrismaCommand(['db', 'push']);
};

prepareDatabase().catch((error) => {
  console.error('Database preparation failed:', error.message);
  process.exit(1);
});
