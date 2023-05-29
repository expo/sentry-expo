import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PKG_JSON_PATH = path.join(__dirname, '../../package.json');
const VERSION_TS_PATH = path.join(__dirname, '../../src/version.ts');

const PKG_JSON = fs.readFileSync(PKG_JSON_PATH).toString('utf8');
const { name, version } = JSON.parse(PKG_JSON);

if (typeof name !== 'string') {
  throw new Error('package.json name is not a string');
}
if (name.length === 0) {
  throw new Error('package.json name is empty');
}
if (typeof version !== 'string') {
  throw new Error('package.json version is not a string');
}
if (version.length === 0) {
  throw new Error('package.json version is empty');
}

const versionTs = fs.readFileSync(VERSION_TS_PATH, 'utf8');

const newVersionTs = versionTs.replace(
  /export const SENTRY_EXPO_VERSION = '[^']+';/,
  `export const SENTRY_EXPO_VERSION = '${version}';`
).replace(
  /export const SENTRY_EXPO_PACKAGE = '[^']+';/,
  `export const SENTRY_EXPO_PACKAGE = 'npm:${name}';`
);

fs.writeFileSync(VERSION_TS_PATH, newVersionTs);
