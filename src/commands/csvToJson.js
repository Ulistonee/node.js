import path from 'path';
import fs from 'fs';
import { Transform, pipeline } from 'stream';

export async function csvToJson(args, state) {
  const inputFlag = args.indexOf('--input');
  const outputFlag = args.indexOf('--output');

  if (inputFlag === -1 || outputFlag === -1) {
    console.error('Operation failed');
    return;
  }

  const inputFile = args[inputFlag + 1];
  const outputFile = args[outputFlag + 1];

  const inputPath = path.resolve(state.dir, inputFile);
  const outputPath = path.resolve(state.dir, outputFile);

  try {
    await fs.promises.access(inputPath);
  } catch {
    console.error('Operation failed');
    return;
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
    console.error('Operation failed');
  });
}
