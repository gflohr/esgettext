import { basename, join } from 'path';
import { FileResolver } from './file-resolver';

describe('file resolving', () => {
	// Mocking existsSync fails at least with node 13.14.0 with an
	// unhandled promise rejection. So we test with real files using the
	// fact that a file cannot be a file and a directory at the same time.
	it('should default to the current directory', () => {
		const resolver = new FileResolver();
		const filename = 'package.json';

		expect(resolver.resolve('package.json')).toEqual(join('', filename));
	});

	it('should search one directory and fail', () => {
		const filename = basename(__filename);
		const resolver = new FileResolver([__filename]);

		expect(resolver.resolve(filename)).toBeNull();
	});

	it('should search two directories and succeed', () => {
		const filename = basename(__filename);
		const resolver = new FileResolver([__filename, __dirname]);

		expect(resolver.resolve(filename)).toEqual(join(__dirname, filename));
	});
});
