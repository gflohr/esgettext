#! /usr/bin/env node

const path = require('path');

const package = require(path.resolve(__dirname, './package.json'));

console.log(`export class Package {
	public static getName(): string {
		return "${package.name}";
	}

	public static getVersion(): string {
		return "${package.version}";
	}
};
`);
