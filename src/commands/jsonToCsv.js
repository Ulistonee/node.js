import path from 'path';
import fs from 'fs';
import { Readable, Writable, Transform, pipeline } from 'stream';

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

export async function count(args, state) {
  const inputFlag = args.indexOf('--input');

  if (inputFlag === -1) {
    console.error('Operation failed');
    return;
  }

  const inputPath = path.resolve(state.dir, args[inputFlag + 1]);

  try {
    await fs.promises.access(inputPath);
  } catch {
    console.error('Operation failed');
    return;
  }

  await new Promise((resolve, reject) => {
    let lines = 0;
    let words = 0;
    let characters = 0;
    let leftover = '';

    const readable = fs.createReadStream(inputPath, { encoding: 'utf8' });

    const transform = new Transform({
      transform(chunk, encoding, callback) {
        const text = leftover + chunk;
        const parts = text.split('\n');
        leftover = parts.pop();

        for (const line of parts) {
          lines++;
          characters += line.length + 1; // +1 for \n
          words += line.split(/\s+/).filter(Boolean).length;
        }

        callback();
      },
      flush(callback) {
        if (leftover.length > 0) {
          lines++;
          characters += leftover.length;
          words += leftover.split(/\s+/).filter(Boolean).length;
        }
        callback();
      },
    });

    const writable = new Writable({
      write(chunk, encoding, callback) {
        callback();
      },
    });

    writable.on('finish', () => {
      console.log(`Lines: ${lines}\nWords: ${words}\nCharacters: ${characters}`);
      resolve();
    });

    pipeline(readable, transform, writable, (err) => {
      if (err) reject(err);
    });
  }).catch(() => {
    console.error('Operation failed');
  });
}
