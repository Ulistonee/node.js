import fs from 'fs';
import path from 'path';

export async function up(state) {
  const parentDir = path.dirname(state.dir);

  if (parentDir !== state.dir) {
    state.dir = parentDir;
  }
}

export async function cd(args, state) {
  if (args.length === 0) {
    console.error('Invalid input');
    return;
  }

  const targetPath = path.resolve(state.dir, args[0]);
  try {
    const stat = await fs.promises.stat(targetPath);
    if (!stat.isDirectory()) {
      console.error('Operation failed');
      return;
    }

    state.dir = targetPath;
  } catch (err) {
    console.error('Operation failed');
  }
}

export async function ls(state) {
  try {
    const entries = await fs.promises.readdir(state.dir, {
      withFileTypes: true,
    });

    const visible = entries.filter((e) => !e.name.startsWith('.'));

    const folders = visible
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    const files = visible
      .filter((e) => !e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    const lines = [
      ...folders.map((name) => `${name.padEnd(90)}[folder]`),
      ...files.map((name) => `${name.padEnd(90)}[file]`),
    ];

    console.log(lines.join('\n'));
  } catch {
    console.error('Operation failed');
  }
}
