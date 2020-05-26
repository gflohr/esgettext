import { OptionGroup, Getopt } from './getopt';

function getArgv(): { [x: string]: unknown; _: string[]; $0: string } {
	return {
		_: new Array<string>(),
		$0: 'ignore',
	};
}

function errorFunction(message: string): void {
	throw new Error(message);
}

describe('getting command line options', () => {
	let optionGroups: Array<OptionGroup>;
	let getopt: Getopt;

	describe('bare minimum', () => {
		beforeAll(() => {
			optionGroups = [];
			getopt = new Getopt('usage', 'description', optionGroups);
		});

		it('to accept option --help', () => {
			const args = getArgv();
			args['help'] = true;
			expect(getopt.argv(args)).toBeDefined();
		});

		it('to accept option --version', () => {
			const args = getArgv();
			args['version'] = true;
			expect(getopt.argv(args)).toBeDefined();
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
					],
				},
			];

			getopt = new Getopt('usage', 'description', optionGroups, {
				errorFunction,
			});
		});

		it('succeed with option --input', () => {
			const args = getArgv();
			args.input = 'something';
			expect(getopt.argv(args)).toBeDefined();
		});

		it('fail with multiple options --input', () => {
			const args = getArgv();
			args.input = ['something', 'else'];
			expect(() => getopt.argv(args)).toThrow();
		});

		it('to fail for unknown long options', () => {
			const args = getArgv();
			args['foobar'] = true;
			expect(() => getopt.argv(args)).toThrow();
		});

		it('to fail for unknown short options', () => {
			const args = getArgv();
			args['%'] = true;
			expect(() => getopt.argv(args)).toThrow();
		});
	});
});
