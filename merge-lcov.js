#! /usr/bin/env node

const fs = require('fs');

const dirs = process.argv.slice(2);

let output = '';
dirs.forEach(dir => {
	const filename = `${dir}/coverage/lcov.info`;
	const orig = fs.readFileSync(filename, 'utf-8');
	const patched = orig.replace(/^SF:/gm, () => {
		return `SF:${dir}/`;
	});
	output += patched;
});

try {
	fs.mkdirSync('coverage');
} catch (e) {
	/* ignore */
}
fs.writeFileSync('coverage/lcov.info', output, 'utf-8');
