import readline from 'readline';
import os from 'os';
import {createLineHandler} from "./repl.js";

let currentDir = os.homedir();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
})

console.log('Welcome to Data Processing CLI!');
console.log(`You are currently in ${currentDir}`);
rl.prompt();

rl.on('line', createLineHandler( { rl, currentDirState: { dir: currentDir } }))

rl.on('close', () => {
  console.log('Thank you for using Data Processing CLI!');
  process.exit(0);
});
