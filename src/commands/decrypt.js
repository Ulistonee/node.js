import {deriveKey, parseArgsForEncrypt} from "./encrypt.js";
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export async function decrypt(args, state) {
  const { input, output, password } = parseArgsForEncrypt(args)

  if (!input || !output || !password) {
    console.log('Operation failed')
    process.exit(1)
  }

  const inputPath  = path.resolve(state.dir, input)
  const outputPath = path.resolve(state.dir, output)

  if (!fs.existsSync(inputPath)) {
    console.log('Operation failed')
    process.exit(1)
  }

  const fd = fs.openSync(inputPath, 'r')
  const header = Buffer.alloc(28)
  fs.readSync(fd, header, 0, 28, 0)

  const fileSize = fs.fstatSync(fd).size
  const authTag = Buffer.alloc(16)
  fs.readSync(fd, authTag, 0, 16, fileSize - 16)
  fs.closeSync(fd)

  const salt = header.subarray(0, 16)
  const iv   = header.subarray(16, 28)

  let key
  try {
    key = await deriveKey(password, salt)
  } catch {
    console.log('Operation failed')
    process.exit(1)
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
  }).catch(() => {
    try { fs.unlinkSync(outputPath) } catch {}
    console.log('Operation failed')
    process.exit(1)
  })

  console.log('OK')
}
