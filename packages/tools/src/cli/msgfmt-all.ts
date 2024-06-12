import { Textdomain } from '@esgettext/runtime';
import { MsgfmtAll } from '../msgfmt-all/msgfmt-all';
import { Getopt, OptionGroup } from './getopt';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');
gtx.resolve().then(() => {
	const optionGroups: Array<OptionGroup> = [
		{
			description: gtx._('Input file options:'),
			options: [
				{
					name: 'package-json',
					yargsOptions: {
						type: 'string',
						describe: gtx._(
							"read package information from PACKAGE_JSON (or 'package.json' without an argument)",
						),
					},
				},
				{
					name: 'locale',
					flags: {
						multiple: true,
					},
					yargsOptions: {
						alias: 'l',
						type: 'array',
						describe: gtx._('list of locales'),
					},
				},
				{
					name: 'directory',
					yargsOptions: {
						alias: 'D',
						type: 'string',
						describe: gtx._("search '.po' files in DIRECTORY"),
					},
				},
			],
		},
		{
			description: gtx._('Output file options:'),
			options: [
				{
					name: 'format',
					yargsOptions: {
						type: 'string',
						default: 'gmo',
						describe: gtx._('output file type format'),
					},
				},
			],
		},
		{
			description: gtx._('Mode of operation:'),
			options: [
				{
					name: 'msgfmt',
					yargsOptions: {
						type: 'string',
						default: 'msgfmt',
						describe: gtx._('msgfmt program if not in PATH'),
					},
				},
				{
					name: 'options',
					flags: {
						multiple: true,
					},
					yargsOptions: {
						type: 'string',
						default: ['--check', '--statistics', '--verbose'],
						describe: gtx._('options to pass to msgfmt'),
					},
				},
			],
		},
	];

	const usage = gtx._('[OPTIONS] ref.pot');
	const description = gtx._("Invoke 'msgmerge' for multiple files.");
	const getopt = new Getopt(usage, description, optionGroups, {
		hasVerboseOption: true,
	});

	let msgfmtAll;

	try {
		msgfmtAll = new MsgfmtAll(getopt.argv());
	} catch (error) {
		console.warn(
			gtx._x('{programName}: {error}', {
				error,
				programName: getopt.programName,
			}),
		);
		console.error(
			gtx._x('Try "{programName} --help" for more information!', {
				programName: getopt.programName,
			}),
		);
		process.exit(2);
	}

	msgfmtAll.run()
	.then(exitCode => process.exit(exitCode))
	.catch(error => { throw(error) });
}).catch((exception: Error) => {
	console.error(
		gtx._x('{programName}: unhandled exception: {exception}', {
			programName: 'esgettext-xgettext',
			exception,
		}),
	);
});
;
