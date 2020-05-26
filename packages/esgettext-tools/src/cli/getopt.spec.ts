import { OptionGroup, Getopt } from './getopt';

function getArgv(): { [x: string]: unknown; _: string[]; $0: string } {
	return {
		_: new Array<string>(),
		$0: 'ignore',
	};
}

const logSpy = jest.spyOn(global.console, 'log').mockImplementation(() => {
	/* ignore */
});
const warnSpy = jest.spyOn(global.console, 'warn').mockImplementation(() => {
	/* ignore */
});
const errorSpy = jest.spyOn(global.console, 'warn').mockImplementation(() => {
	/* ignore */
});

describe('getting command line options', () => {
	let optionGroups: Array<OptionGroup>;
	let getopt: Getopt;

	describe('bare minimum', () => {
		beforeAll(() => {
			optionGroups = [];
			getopt = new Getopt('usage', 'description', optionGroups);
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('to accept option --help', () => {
			const args = getArgv();
			args['help'] = true;
			expect(getopt.argv(args)).toBeDefined();
			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('to accept option --version', () => {
			const args = getArgv();
			args['version'] = true;
			expect(getopt.argv(args)).toBeDefined();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});
	});

	describe('simple option', () => {
		beforeAll(() => {
			optionGroups = [
				{
					description: 'File locations',
					options: [
						{
							name: 'input',
							yargsOptions: {
								alias: 'i',
								type: 'string',
								describe: 'location of the input file',
								demandOption: '--input is required',
							},
						},
						{
							name: 'add-comments',
							flags: { multiple: true },
							yargsOptions: {
								type: 'string',
								describe: 'add comments',
							},
						},
					],
				},
			];

			getopt = new Getopt('usage', 'description', optionGroups);
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('succeed with option --input', () => {
			const args = getArgv();
			args.input = 'something';
			expect(getopt.argv(args)).toBeDefined();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('succeed with option -i', () => {
			const args = getArgv();
			args.input = 'something';
			expect(getopt.argv(args)).toBeDefined();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('fail with multiple options --input', () => {
			const args = getArgv();
			args.input = ['something', 'else'];
			expect(() => getopt.argv(args)).toThrow();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('succeed with option --add-comments', () => {
			const args = getArgv();
			args.addComments = 'something';
			expect(getopt.argv(args)).toBeDefined();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('fail with option -a', () => {
			const args = getArgv();
			args.a = 'something';
			expect(() => getopt.argv(args)).toThrow();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('succeed with multiple options --add-commentts', () => {
			const args = getArgv();
			args.addComments = ['something', 'else'];
			expect(getopt.argv(args)).toBeDefined();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('to fail for unknown long options', () => {
			const args = getArgv();
			args['foobar'] = true;
			expect(() => getopt.argv(args)).toThrow();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('to fail for unknown short options', () => {
			const args = getArgv();
			args['%'] = true;
			expect(() => getopt.argv(args)).toThrow();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});
	});

	describe('variants', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should add an option --verbose', () => {
			const args = getArgv();
			args['help'] = true;
			const getoptLocal = new Getopt(
				'local usage',
				'local description',
				optionGroups,
				{
					hasVerboseOption: true,
				},
			);
			expect(getoptLocal.argv(args)).toBeDefined();
			expect(logSpy).toHaveBeenCalledTimes(1);
			const calls = logSpy.mock.calls;
			expect(calls[0][0]).toMatch(new RegExp('--verbose'));
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it.skip('should fall back to command-line arguments', () => {
			// This test segfaults node.
			const savedArgv = process.argv;
			process.argv = ['/usr/local/bin/node', '/some/script/name', '--help'];
			const getoptLocal = new Getopt(
				'local usage',
				'local description',
				optionGroups,
				{
					hasVerboseOption: true,
				},
			);
			expect(getoptLocal.argv()).toBeDefined();
			process.argv = savedArgv;
			expect(logSpy).toHaveBeenCalledTimes(1);
			const calls = logSpy.mock.calls;
			expect(calls[0][0]).toMatch(new RegExp('--verbose'));
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});
	});
});
