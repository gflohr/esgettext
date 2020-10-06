import { Textdomain } from '@esgettext/runtime';
import { Install } from '../install/install';
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
						describe: gtx._('read package information from PACKAGE_JSON'),
					}
				},
				{
					name: 'locale',
					flags: {
						multiple: true,
					},
					yargsOptions: {
						alias: 'l',
						type: 'array',
						describe: gtx._(
							"list of locales",
						),
					},
				},
				{
					name: 'directory',
					yargsOptions: {
						alias: 'D',
						type: 'string',
						describe: gtx._(
							"search '.gmo' files in DIRECTORY",
						),
					},
				},
				{
					name: 'input-format',
					yargsOptions: {
						type: 'string',
						default: 'gmo',
						describe: gtx._(
							"input file type format",
						),
					},
				},
			],
		},
		{
			description: gtx._('Output file options:'),
			options: [
				{
					name: 'output-directory',
					yargsOptions: {
						type: 'string',
						default: 'assets/locale',
						describe: gtx._(
							"output directory",
						),
					},
				},
				{
					name: 'output-format',
					yargsOptions: {
						type: 'string',
						default: 'json',
						describe: gtx._(
							"output file type format",
						),
					},
				},
			],
		},
	];

	const usage = gtx._('[OPTIONS] ref.pot');
	const description = gtx._("Install translation catalogs.");
	const getopt = new Getopt(usage, description, optionGroups, {
		hasVerboseOption: true,
	});

	let install;

	try {
		install = new Install(getopt.argv());
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

	install.run().then(exitCode => process.exit(exitCode));
});
