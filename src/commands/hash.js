import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseArgs } from "../utils/argParser.js";

export const SUPPORTED_ALGORITHMS = ['sha256', 'md5', 'sha512']

export async function calculateHash(filePath, algorithm, currentDir) {
  const absolutePath = path.resolve(currentDir, filePath)

  try {
    await fs.promises.access(absolutePath)
  } catch {
    throw new Error('FILE_NOT_FOUND')
  }

  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm)
    const stream = fs.createReadStream(absolutePath)

    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', () => reject(new Error('FILE_NOT_FOUND')))
  })
}

export async function hash(args, state) {
  const { input, algorithm, save } = parseArgs(
    args,
    ['input', 'algorithm'],
    ['save']
  )

  const algo = algorithm ?? 'sha256'

  if (!input) {
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

  console.log(`${algo}: ${hashValue}`)

  if (save) {
    const absolutePath = path.resolve(state.dir, input)
    const savePath = `${absolutePath}.${algo}`
    try {
      await fs.promises.writeFile(savePath, `${algo}: ${hashValue}\n`)
    } catch {
      console.log('Operation failed')
    }
  }
}
