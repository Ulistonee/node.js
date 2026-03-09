import * as navigation from './navigation.js';

export function createLineHandler({ rl, currentDirState }) {
  return async function handleLine(input) {
    const trimmed = input.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    if (trimmed === 'exit') {
      rl.close();
      return;
    }

    const [command, ...args] = trimmed.split(/\s+/);

    try {
      switch (command) {
        case 'up':
          await navigation.up(args, currentDirState);
          break;

        case 'cd':
          await navigation.cd(args, currentDirState);
          break;
        case 'ls':
          await navigation.ls(args, currentDirState);
          break;

        default:
          console.error('Invalid input');
      }
    } catch (err) {
      console.error('Operation failed', err);
    }

    console.log(`You are currently in ${currentDirState.dir}`);
    rl.prompt();
  };
}
