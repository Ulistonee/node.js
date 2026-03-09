import fs from 'fs';
import path from 'path';

export async function cd(args, state) {
  if (args.length === 0) {
    console.error('Invalid input');
    return;
  }

  const targetPath = path.resolve(state.dir, args[0]);
  try {
    const stat = await fs.promises.stat(targetPath);
    if (!stat.isDirectory()) {
      console.error('Invalid input');
      return;
    }

    state.dir = targetPath;
  } catch (err) {
    console.error('Operation failed');
  }
}

export async function ls(args, state) {
  try {
    const entries = await fs.promises.readdir(state.dir, {
      withFileTypes: true,
    });

    const names = entries.map((e) => e.name);
    console.log(names.sort((a, b) => a - b ).join('\n'));
  } catch {
    console.error('Operation failed');
  }
}

export async function up(args, state) {
  const parentDir = path.dirname(state.dir);

  if (parentDir !== state.dir) {
    state.dir = parentDir;
  }
}
