import fs from 'fs';
import path from 'path';
import {calculateHash, SUPPORTED_ALGORITHMS} from "./hash.js";
import {parseArgs} from "../utils/argParser.js";

export async function hashCompare(args, state) {
  const { input, hash: hashFile, algorithm } = parseArgs(
    args,
    ['input', 'hash', 'algorithm']
  )

  const algo = algorithm ?? 'sha256'

  if (!input || !hashFile) {
    console.log('Operation failed')
    return
  }

  if (!SUPPORTED_ALGORITHMS.includes(algo)) {
    console.log('Operation failed')
    return
  }

  let hashValue
  try {
    hashValue = await calculateHash(input, algo, state.dir)
  } catch {
    console.log('Operation failed')
    return
  }

  const hashFilePath = path.resolve(state.dir, hashFile)

  try {
    await fs.promises.access(hashFilePath)
  } catch {
    console.log('Operation failed')
    return
  }

  const expectedRaw = (await fs.promises.readFile(hashFilePath, 'utf8')).trim()
  const expected = expectedRaw.includes(':')
    ? expectedRaw.split(':')[1].trim()
    : expectedRaw

  if (hashValue.toLowerCase() === expected.toLowerCase()) {
    console.log('OK')
  } else {
    console.log('MISMATCH')
  }
}
