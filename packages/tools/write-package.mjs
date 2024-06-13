#! /usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const filename = fileURLToPath(import.meta.url);
const directory = dirname(filename);
const packageJsonPath = join(directory, 'package.json');

const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

console.log(`export class Package {
	public static getName(): string {
		return 'esgettext';
	}

	public static getBugTrackerUrl(): string {
		return '${pkg.bugs.url}';
	}

	public static getVersion(): string {
		return '${pkg.version}';
	}
};`);
