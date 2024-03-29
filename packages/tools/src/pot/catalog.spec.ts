import { Catalog } from './catalog';
import { POTEntry } from './entry';

const date = '2020-04-23 08:50+0300';

describe('translation catalog', () => {
	describe('initialization', () => {
		it('should be initialized with zero configuration', () => {
			const catalog = new Catalog();
			expect(catalog.toString({ width: 76 })).toMatch(/Content-Type/);
		});

		it('should be initialized with default values', () => {
			const catalog = new Catalog({ date });
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should honor the foreign-user option', () => {
			const catalog = new Catalog({ date, foreignUser: true });
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should honor the package option', () => {
			const catalog = new Catalog({ date, package: 'foobar 23.4' });
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should ignore a lone version option', () => {
			const catalog = new Catalog({ date, version: '23.4' });
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should honor the version option', () => {
			const catalog = new Catalog({
				date,
				package: 'foobar',
				version: '23.4.89',
			});
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should honor the msgid-bugs-address option', () => {
			const catalog = new Catalog({
				date,
				msgidBugsAddress: 'me@example.com',
			});
			expect(catalog.toString()).toMatchSnapshot();
		});
	});

	describe('conflicting flags', () => {
		/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
		let warner: jest.SpyInstance<void, [any?, ...any[]]>;

		beforeEach(() => {
			warner = jest.spyOn(global.console, 'warn').mockImplementation(() => {
				/* ignore */
			});
		});

		afterEach(() => jest.restoreAllMocks());

		it('should warn about conflicting flags', () => {
			const catalog = new Catalog();

			catalog.addEntry(
				new POTEntry({
					msgid: 'hello',
					flags: ['no-mercy', 'perl-brace-format'],
					references: ['first.js:10'],
				}),
			);

			catalog.addEntry(
				new POTEntry({
					msgid: 'hello',
					flags: ['no-mercy'],
					references: ['second.js:10'],
				}),
			);

			catalog.addEntry(
				new POTEntry({
					msgid: 'hello',
					flags: ['mercy'],
					references: ['third.js:10'],
				}),
			);
			expect(warner).toHaveBeenCalledTimes(4);

			catalog.addEntry(
				new POTEntry({
					msgid: 'hello',
					flags: ['no-perl-brace-format'],
					references: ['third.js:10'],
				}),
			);
			expect(warner).toHaveBeenCalledTimes(9);
		});
	});

	describe('continuous filling', () => {
		const catalog = new Catalog({ date });

		it('should add an entry', () => {
			catalog.addEntry(
				new POTEntry({
					msgid: 'Mike',
					references: ['src/zulu.ts:2304'],
				}),
			);
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should add a second entry', () => {
			catalog.addEntry(
				new POTEntry({
					msgid: 'November',
					references: ['src/yankee.ts:42'],
				}),
			);
			expect(catalog.toString()).toMatchSnapshot();
		});

		it('should merge the third entry', () => {
			catalog.addEntry(
				new POTEntry({
					msgid: 'Mike',
					references: ['src/xray.ts:1303'],
				}),
			);
			expect(catalog.toString()).toMatchSnapshot();
		});

		// This can later be used to test sorting by file.
		it('should support a string at many locations', () => {
			catalog.addEntry(
				new POTEntry({
					msgid: 'Lima',
					references: ['whiskey.ts:2'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'Oscar',
					references: ['whiskey.ts:2'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'Lima',
					references: ['victor.ts:3'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'Oscar',
					references: ['victor.ts:3'],
				}),
			);
			// When sorting by file, the Oscar entry should appear before
			// the Lima entry. Actually that case could not happen but ...
			catalog.addEntry(
				new POTEntry({
					msgid: 'Lima',
					references: ['uniform.ts:4'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'Oscar',
					references: ['uniform.ts:3'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'Lima',
					references: ['tango.ts:25'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'Oscar',
					references: ['tango.ts:25'],
				}),
			);
			expect(catalog.toString()).toMatchSnapshot();
		});
		it('should also merge flags and comments', () => {
			catalog.addEntry(
				new POTEntry({
					msgid: 'Mike',
					translatorComments: ['This is difficult.'],
					automatic: ['TRANSLATORS: Buy me a milk shake!'],
					flags: ['no-c-format'],
					references: ['sierra.ts:27'],
				}),
			);
			expect(catalog.toString()).toMatchSnapshot();

			catalog.addEntry(
				new POTEntry({
					msgid: 'Mike',
					translatorComments: ['Not really.'],
					automatic: ['TRANSLATORS: Drop me a line!'],
					flags: ['perl-brace-format'],
					references: ['romeo.ts:85'],
				}),
			);
			expect(catalog.toString()).toMatchSnapshot();

			// We need entries with a message context.
			catalog.addEntry(
				new POTEntry({
					msgid: 'Mike',
					msgctxt: 'phonetic alphabet',
					references: ['juliet.ts:85'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'Mike',
					msgctxt: 'audio',
					references: ['golf.ts:85'],
				}),
			);

			// And entries with one more ref than another.
			catalog.addEntry(
				new POTEntry({
					msgid: 'Foxtrot',
					references: ['src/yankee.ts:42', 'src/zulu.ts:2304'],
				}),
			);
		});

		it('should sort output on demand', () => {
			expect(catalog.toString({ sortOutput: true })).toMatchSnapshot();
		});

		it('should sort by file on demand', () => {
			expect(catalog.toString({ sortByFile: true })).toMatchSnapshot();
		});
	});

	describe('deleting', () => {
		const catalog = new Catalog({ date });

		catalog.addEntry(
			new POTEntry({
				msgid: 'Hello, world!',
			}),
		);

		expect(catalog.toString()).toMatchSnapshot();

		catalog.deleteEntry('Hello, world!');
		catalog.deleteEntry('Goodbye, world!');
		catalog.deleteEntry('Hello, world!', 'La-la-land');

		expect(catalog.toString()).toMatchSnapshot();

		catalog.deleteEntry('');
		expect(catalog.toString()).toEqual('');
	});

	describe('sorting', () => {
		it('should sort by msgctxt', () => {
			const catalog = new Catalog({ date });

			catalog.addEntry(
				new POTEntry({
					msgid: 'sort',
					msgctxt: 'delta',
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'sort',
					msgctxt: 'charlie',
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'sort',
					msgctxt: 'bravo',
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'sort',
					msgctxt: 'alpha',
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'sort',
				}),
			);

			expect(catalog.toString({ sortOutput: true })).toMatchSnapshot();
		});

		it('should sort by line number', () => {
			const catalog = new Catalog({ date });

			catalog.addEntry(
				new POTEntry({
					msgid: 'alpha',
					references: ['source.ts:42'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'bravo',
					references: ['source.ts:3'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'charlie',
					references: ['source.ts:31'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'delta',
					references: ['source.ts:1'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'echo',
					references: ['source.ts:11', 'source.ts:13'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'foxtrot',
					references: ['source.ts:11', 'source.ts:12'],
				}),
			);
			catalog.addEntry(
				new POTEntry({
					msgid: 'golf',
				}),
			);

			expect(catalog.toString({ sortByFile: true })).toMatchSnapshot();
		});
	});
});
