import path from 'path';
import fs from 'fs';
import { Transform, pipeline } from 'stream';
import { Writable } from 'stream';
import { parseArgs } from '../utils/argParser.js';

export async function count(args, state) {
  const { input } = parseArgs(args, ['input'])

  if (!input) {
    throw new Error('Invalid input')
  }

  const inputPath = path.resolve(state.dir, input)

  try {
    await fs.promises.access(inputPath);
  } catch {
    throw new Error('Operation failed')
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
    throw new Error('Operation failed')
  });
}
