import {parseArgs} from "../utils/argParser.js";

export function runWorker() {
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
