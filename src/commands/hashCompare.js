import fs from 'fs';
import path from 'path';
import {calculateHash, parseArgs, SUPPORTED_ALGORITHMS} from "./hash.js";

export async function hashCompare(args, state) {
  const { input, hashFile, algorithm } = parseArgs(args)

  if (!input || !hashFile) {
    console.log('Operation failed')
    process.exit(1)
  }

  if (!SUPPORTED_ALGORITHMS.includes(algorithm)) {
    console.log('Operation failed')
    process.exit(1)
  }

  let hashValue
  try {
    hashValue = await calculateHash(input, algorithm, state.dir)
  } catch {
    console.log('Operation failed')
    process.exit(1)
  }

  const hashFilePath = path.resolve(state.dir, hashFile)
  if (!fs.existsSync(hashFilePath)) {
    console.log('Operation failed')
    process.exit(1)
  }

  const expectedRaw = fs.readFileSync(hashFilePath, 'utf8').trim()
  const expected = expectedRaw.includes(':')
    ? expectedRaw.split(':')[1].trim()
    : expectedRaw

  if (hashValue.toLowerCase() === expected.toLowerCase()) {
    console.log('OK')
  } else {
    console.log('MISMATCH')
  }
}
