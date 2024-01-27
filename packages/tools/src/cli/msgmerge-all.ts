import { Textdomain } from '@esgettext/runtime';
import { MsgmergeAll } from '../msgmerge-all/msgmerge-all';
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
			description: gtx._('Mode of operation:'),
			options: [
				{
					name: 'msgmerge',
					yargsOptions: {
						type: 'string',
						default: 'msgmerge',
						describe: gtx._('msgmerge program if not in PATH'),
					},
				},
				{
					name: 'options',
					flags: {
						multiple: true,
					},
					yargsOptions: {
						type: 'string',
						describe: gtx._('options to pass to msgmerge'),
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

	let msgmergeAll;

	try {
		msgmergeAll = new MsgmergeAll(getopt.argv());
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

	msgmergeAll.run().then(exitCode => process.exit(exitCode));
});
