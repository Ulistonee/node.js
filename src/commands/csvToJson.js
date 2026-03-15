import path from 'path';
import fs from 'fs';
import { Transform, pipeline } from 'stream';
import { parseArgs } from '../utils/argParser.js';

export async function csvToJson(args, state) {
  const { input: inputFile, output: outputFile } = parseArgs(args)

  if (!inputFile || !outputFile) {
    throw new Error('Operation failed')
  }

  const inputPath = path.resolve(state.dir, inputFile);
  const outputPath = path.resolve(state.dir, outputFile);

  try {
    await fs.promises.access(inputPath);
  } catch {
    throw new Error('Operation failed')
  }

  await new Promise((resolve, reject) => {
    let headers = null;
    const rows = [];
    let leftover = '';

    const readable = fs.createReadStream(inputPath, { encoding: 'utf8' });

    const transform = new Transform({
      readableObjectMode: true,
      transform(chunk, encoding, callback) {
        const lines = (leftover + chunk).split('\n');
        leftover = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const values = trimmed.split(',');

          if (!headers) {
            headers = values;
          } else {
            const obj = {};
            headers.forEach((key, i) => {
              obj[key] = values[i] ?? '';
            });
            rows.push(obj);
          }
        }
        callback();
      },
      flush(callback) {
        if (leftover.trim() && headers) {
          const values = leftover.trim().split(',');
          const obj = {};
          headers.forEach((key, i) => {
            obj[key] = values[i] ?? '';
          });
          rows.push(obj);
        }
        this.push(JSON.stringify(rows, null, 2));
        callback();
      },
    });

    const writable = fs.createWriteStream(outputPath, { encoding: 'utf8' });

    pipeline(readable, transform, writable, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }).catch(() => {
    throw new Error('Operation failed')
  });
}
