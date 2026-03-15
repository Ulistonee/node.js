import { deriveKey } from "./encrypt.js";
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { parseArgs } from "../utils/argParser.js";

export async function decrypt(args, state) {
  const { input, output, password } = parseArgs(
    args,
    ['input', 'output', 'password']
  )

  if (!input || !output || !password) {
    console.log('Operation failed')
    return
  }

  const inputPath  = path.resolve(state.dir, input)
  const outputPath = path.resolve(state.dir, output)

  try {
    await fs.promises.access(inputPath)
  } catch {
    console.log('Operation failed')
    return
  }

  const fh = await fs.promises.open(inputPath, 'r')
  const header = Buffer.alloc(28)
  await fh.read(header, 0, 28, 0)

  const { size: fileSize } = await fh.stat()
  const authTag = Buffer.alloc(16)
  await fh.read(authTag, 0, 16, fileSize - 16)
  await fh.close()

  const salt = header.subarray(0, 16)
  const iv   = header.subarray(16, 28)

  let key
  try {
    key = await deriveKey(password, salt)
  } catch {
    console.log('Operation failed')
    return
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  const readStream  = fs.createReadStream(inputPath, { start: 28, end: fileSize - 17 })
  const writeStream = fs.createWriteStream(outputPath)

  await new Promise((resolve, reject) => {
    readStream.on('error', reject)
    writeStream.on('error', reject)
    decipher.on('error', reject)

    readStream.pipe(decipher).pipe(writeStream)

    writeStream.on('finish', resolve)
  }).catch(async () => {
    try { await fs.promises.unlink(outputPath) } catch {}
    console.log('Operation failed')
  })

  console.log('OK')
}
