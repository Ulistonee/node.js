import path from 'path';
import fs from 'fs';
import { Readable, pipeline } from 'stream';

export async function jsonToCsv(args, state) {
  const inputFlag = args.indexOf('--input');
  const outputFlag = args.indexOf('--output');

  if (inputFlag === -1 || outputFlag === -1) {
    console.error('Operation failed');
    return;
  }

  const inputPath = path.resolve(state.dir, args[inputFlag + 1]);
  const outputPath = path.resolve(state.dir, args[outputFlag + 1]);

  try {
    await fs.promises.access(inputPath);
  } catch {
    console.error('Operation failed');
    return;
  }

  try {
    const content = await fs.promises.readFile(inputPath, 'utf8');
    const data = JSON.parse(content);

    if (!Array.isArray(data) || data.length === 0) {
      console.error('Operation failed');
      return;
    }

    const headers = Object.keys(data[0]);
    const lines = [
      headers.join(','),
      ...data.map((obj) => headers.map((h) => obj[h] ?? '').join(',')),
    ];

    await new Promise((resolve, reject) => {
      const readable = Readable.from(lines.join('\n'));
      const writable = fs.createWriteStream(outputPath, { encoding: 'utf8' });

      pipeline(readable, writable, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch {
    console.error('Operation failed');
  }
}
