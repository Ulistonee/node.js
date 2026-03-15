import path from 'path';
import fs from 'fs';
import { Readable, pipeline } from 'stream';
import {parseArgs} from "../utils/argParser.js";

export async function jsonToCsv(args, state) {
  const { input: inputFile, output: outputFile } = parseArgs(args)

  if (!inputFile || !outputFile) {
    throw new Error('Invalid input')
  }

  const inputPath = path.resolve(state.dir, inputFile);
  const outputPath = path.resolve(state.dir, outputFile);

  try {
    await fs.promises.access(inputPath);
  } catch {
    throw new Error('Operation failed')
  }

  try {
    const content = await fs.promises.readFile(inputPath, 'utf8');
    const data = JSON.parse(content);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Operation failed')
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
    throw new Error('Operation failed')
  }
}
