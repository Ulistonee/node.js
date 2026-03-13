import path from 'path';
import fs from 'fs';
import { Transform, pipeline } from 'stream';
import { Writable } from 'stream';

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
          characters += line.length + 1;
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
