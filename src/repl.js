import * as navigation from './navigation.js';
import {csvToJson} from "./commands/csvToJson.js";
import {jsonToCsv} from "./commands/jsonToCsv.js";
import {count} from "./commands/count.js";
import {hash} from "./commands/hash.js";
import {hashCompare} from "./commands/hashCompare.js";
import {encrypt} from "./commands/encrypt.js";
import {decrypt} from "./commands/decrypt.js";
import {logStats} from "./commands/logStats.js";

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
    let success = false;

    try {
      switch (command) {
        case 'up':
          await navigation.up(currentDirState);
          success = true;
          break;
        case 'cd':
          await navigation.cd(args, currentDirState);
          success = true;
          break;
        case 'ls':
          await navigation.ls(currentDirState);
          success = true;
          break;
        case 'csv-to-json':
          await csvToJson(args, currentDirState);
          success = true;
          break;
        case 'json-to-csv':
          await jsonToCsv(args, currentDirState);
          success = true;
          break;
        case 'count':
          await count(args, currentDirState);
          success = true;
          break;
        case 'hash':
          await hash(args, currentDirState);
          success = true;
          break;
        case 'hash-compare':
          await hashCompare(args, currentDirState);
          success = true;
          break;
        case 'encrypt':
          await encrypt(args, currentDirState);
          success = true;
          break;
        case 'decrypt':
          await decrypt(args, currentDirState);
          success = true;
          break;
        case 'log-stats':
          await logStats(args, currentDirState);
          success = true;
          break;
        default:
          console.error('Invalid input');
      }
    } catch (err) {
      console.log(err.message);
    }

    if (success) {
      console.log(`You are currently in ${currentDirState.dir}`);
    }
    rl.prompt();
  };
}
