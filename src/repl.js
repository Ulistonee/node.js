import * as navigation from './navigation.js';
import {csvToJson} from "./commands/csvToJson.js";
import {jsonToCsv} from "./commands/jsonToCsv.js";
import {count} from "./commands/count.js";
import {hash} from "./commands/hash.js";

export function createLineHandler({ rl, currentDirState }) {
  return async function handleLine(input) {
    const trimmed = input.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    if (trimmed === '.exit' || trimmed === 'exit') {
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
        case 'csv-to-json':
          await csvToJson(args, currentDirState);
          break;
        case 'json-to-csv':
          await jsonToCsv(args, currentDirState);
          break;
        case 'count':
          await count(args, currentDirState);
          break;
        case 'hash':
          await hash(args, currentDirState);
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
