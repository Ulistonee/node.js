import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SUPPORTED_ALGORITHMS = ['sha256', 'md5', 'sha512']

function parseArgs(args) {
  const result = { input: null, algorithm: 'sha256', save: false }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') {
      result.input = args[++i]
    } else if (args[i] === '--algorithm') {
      result.algorithm = args[++i]
    } else if (args[i] === '--save') {
      result.save = true
    }
  }

  return result
}

function calculateHash(filePath, algorithm, currentDir) {
  return new Promise((resolve, reject) => {
    const absolutePath = path.resolve(currentDir, filePath)

    if (!fs.existsSync(absolutePath)) {
      return reject(new Error('FILE_NOT_FOUND'))
    }

    const hash = crypto.createHash(algorithm)
    const stream = fs.createReadStream(absolutePath)

    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', () => reject(new Error('FILE_NOT_FOUND')))
  })
}

export async function hash(args, state) {
  const { input, algorithm, save } = parseArgs(args)

  if (!input) {
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

  console.log(`${algorithm}: ${hashValue}`)

  if (save) {
    const absolutePath = path.resolve(state.dir, input)
    const savePath = `${absolutePath}.${algorithm}`
    try {
      fs.writeFileSync(savePath, `${algorithm}: ${hashValue}\n`)
    } catch {
      console.log('Operation failed')
      process.exit(1)
    }
  }
}
