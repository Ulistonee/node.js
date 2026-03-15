import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export function parseArgsForEncrypt(args) {
  const result = { input: null, output: null, password: null }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input')    result.input    = args[++i]
    else if (args[i] === '--output')   result.output   = args[++i]
    else if (args[i] === '--password') result.password = args[++i]
  }
  return result
}

export function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, (err, key) => {
      if (err) reject(err)
      else resolve(key)
    })
  })
}

export async function encrypt(args, state) {
  const { input, output, password } = parseArgs(args)

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

  const salt = crypto.randomBytes(16)
  const iv   = crypto.randomBytes(12)

  let key
  try {
    key = await deriveKey(password, salt)
  } catch {
    console.log('Operation failed')
    process.exit(1)
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
    console.log('Operation failed')
    process.exit(1)
  })

  console.log('OK')
}
