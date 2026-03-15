import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import {parseArgs} from "../utils/argParser.js";

export function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, (err, key) => {
      if (err) reject(err)
      else resolve(key)
    })
  })
}

export async function encrypt(args, state) {
  const { input, output, password } = parseArgs(
    args,
    ['input', 'output', 'password']
  )

  if (!input || !output || !password) {
    throw new Error('Invalid input')
  }

  const inputPath  = path.resolve(state.dir, input)
  const outputPath = path.resolve(state.dir, output)

  try {
    await fs.promises.access(inputPath)
  } catch {
    throw new Error('Operation failed')
  }

  const salt = crypto.randomBytes(16)
  const iv   = crypto.randomBytes(12)

  let key
  try {
    key = await deriveKey(password, salt)
  } catch {
    throw new Error('Operation failed')
  }

  const cipher     = crypto.createCipheriv('aes-256-gcm', key, iv)
  const readStream  = fs.createReadStream(inputPath)
  const writeStream = fs.createWriteStream(outputPath)

  writeStream.write(salt)
  writeStream.write(iv)

  await new Promise((resolve, reject) => {
    readStream.on('error', reject)
    writeStream.on('error', reject)

    readStream.pipe(cipher)

    cipher.on('data', (chunk) => writeStream.write(chunk))

    cipher.on('end', () => {
      writeStream.write(cipher.getAuthTag())
      writeStream.end()
    })

    cipher.on('error', reject)
    writeStream.on('finish', resolve)
  }).catch(() => {
    throw new Error('Operation failed')
  })

  console.log('OK')
}
