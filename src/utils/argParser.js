export function parseArgs(args, flags = ['input', 'output'], boolFlags = []) {
  const result = Object.fromEntries(flags.map(f => [f, null]))
  boolFlags.forEach(f => result[f] = false)

  for (let i = 0; i < args.length; i++) {
    const flag = args[i]
    if (flag.startsWith('--')) {
      const key = flag.slice(2)
      if (boolFlags.includes(key)) {
        result[key] = true
      } else if (key in result) {
        result[key] = args[++i]
      }
    }
  }

  return result
}
