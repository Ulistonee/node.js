import fs from 'fs'
import path from 'path'
import os from 'os'
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'

function runWorker() {
  const { filePath, start, end } = workerData

  const stats = {
    total: 0,
    levels: {},
    status: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    paths: {},
    responseTimeSum: 0,
  }

  const CHUNK_SIZE = 64 * 1024
  const fd = fs.openSync(filePath, 'r')
  let pos = start
  let leftover = ''

  while (pos <= end) {
    const toRead = Math.min(CHUNK_SIZE, end - pos + 1)
    const buf = Buffer.alloc(toRead)
    const bytesRead = fs.readSync(fd, buf, 0, toRead, pos)
    if (bytesRead === 0) break
    pos += bytesRead

    const text = leftover + buf.toString('utf8', 0, bytesRead)
    const lines = text.split('\n')
    leftover = lines.pop()

    for (const line of lines) {
      parseLine(line, stats)
    }
  }

  if (leftover.trim()) parseLine(leftover, stats)
  fs.closeSync(fd)

  parentPort.postMessage(stats)
}

function parseLine(line, stats) {
  const trimmed = line.trim()
  if (!trimmed) return

  const parts = trimmed.split(' ')
  if (parts.length < 7) return

  const [, level, , statusCodeStr, responseTimeStr, , reqPath] = parts
  const statusCode = parseInt(statusCodeStr, 10)
  const responseTime = parseFloat(responseTimeStr)

  if (isNaN(statusCode) || isNaN(responseTime)) return

  stats.total++
  stats.levels[level] = (stats.levels[level] || 0) + 1

  const bucket = `${Math.floor(statusCode / 100)}xx`
  if (bucket in stats.status) stats.status[bucket]++

  stats.paths[reqPath] = (stats.paths[reqPath] || 0) + 1
  stats.responseTimeSum += responseTime
}

function findChunkBoundaries(filePath, numChunks) {
  const fileSize = fs.statSync(filePath).size
  const chunkSize = Math.floor(fileSize / numChunks)
  const boundaries = []
  const fd = fs.openSync(filePath, 'r')
  const buf = Buffer.alloc(1)

  let start = 0
  for (let i = 0; i < numChunks; i++) {
    const isLast = i === numChunks - 1
    let end = isLast ? fileSize - 1 : start + chunkSize - 1

    if (!isLast) {
      let pos = end
      while (pos < fileSize - 1) {
        fs.readSync(fd, buf, 0, 1, pos)
        if (buf[0] === 0x0a) break
        pos++
      }
      end = pos
    }

    boundaries.push({ start, end })
    start = end + 1
  }

  fs.closeSync(fd)
  return boundaries
}

function mergeStats(partials) {
  const merged = {
    total: 0,
    levels: {},
    status: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
    paths: {},
    responseTimeSum: 0,
  }

  for (const p of partials) {
    merged.total += p.total
    merged.responseTimeSum += p.responseTimeSum

    for (const [lvl, cnt] of Object.entries(p.levels)) {
      merged.levels[lvl] = (merged.levels[lvl] || 0) + cnt
    }
    for (const bucket of Object.keys(merged.status)) {
      merged.status[bucket] += p.status[bucket] || 0
    }
    for (const [pth, cnt] of Object.entries(p.paths)) {
      merged.paths[pth] = (merged.paths[pth] || 0) + cnt
    }
  }

  return merged
}

function parseArgs(args) {
  const result = { input: null, output: null }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') {
      result.input = args[++i]
    } else if (args[i] === '--output') {
      result.output = args[++i]
    }
  }

  return result
}

export async function logStats(args, state) {
  const { input, output } = parseArgs(args)

  if (!input || !output) {
    console.log('Operation failed')
    process.exit(1)
  }

  const inputPath  = path.resolve(state.dir, input)
  const outputPath = path.resolve(state.dir, output)

  if (!fs.existsSync(inputPath)) {
    console.log('Operation failed')
    process.exit(1)
  }

  const numCores   = os.cpus().length
  const boundaries = findChunkBoundaries(inputPath, numCores)

  const partials = await Promise.all(
    boundaries.map(({ start, end }) =>
      new Promise((resolve, reject) => {
        const worker = new Worker(new URL(import.meta.url), {
          workerData: { filePath: inputPath, start, end },
        })
        worker.on('message', resolve)
        worker.on('error', reject)
        worker.on('exit', (code) => {
          if (code !== 0) reject(new Error(`Worker exited with code ${code}`))
        })
      })
    )
  )

  const merged = mergeStats(partials)

  const topPaths = Object.entries(merged.paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([p, count]) => ({ path: p, count }))

  const result = {
    total: merged.total,
    levels: merged.levels,
    status: merged.status,
    topPaths,
    avgResponseTimeMs:
      merged.total > 0
        ? Math.round((merged.responseTimeSum / merged.total) * 100) / 100
        : 0,
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
  console.log('OK')
}

if (!isMainThread) {
  runWorker()
}
