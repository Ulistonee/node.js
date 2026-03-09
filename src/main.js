import readline from 'readline';
import os from 'os';

let currentDir = os.homedir();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>',
})

console.log('Welcome to Data Processing CLI!');
console.log(`You are currently in ${currentDir}`);
rl.prompt();

rl.on('line', async (input) => {
  const trimmed = input.trim();

  if (!trimmed) {
    rl.prompt();
    return;
  }

  if (trimmed === '.exit') {
    rl.close();
    return;
  }

  const [command, ...args] = trimmed.split(/\s+/);

  try {
    switch (command) {
      case 'ls':
        console.log('ls command not implemented yet');
        break;

      case 'cd':
        console.log('cd command not implemented yet');
        break;

      default:
        console.error('Invalid input');
    }
  } catch (err) {
    console.error('Operation failed');
  }

  console.log(`You are currently in ${currentDir}`);
  rl.prompt();
})

rl.on('close', () => {
  console.log('Thank you for using Data Processing CLI!');
  process.exit(0);
});
