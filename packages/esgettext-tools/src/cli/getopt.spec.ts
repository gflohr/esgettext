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
	describe('bare minimimum', () => {
		const optionGroups: Array<OptionGroup> = [];
		const getopt = new Getopt('usage', 'description', optionGroups, {
			errorFunction,
		});

		it('to fail for unknown options', () => {
			const argv = getArgv();
			argv['foobar'] = true;
			expect(() => getopt.argv(argv)).toThrow();
		});
	});
});
