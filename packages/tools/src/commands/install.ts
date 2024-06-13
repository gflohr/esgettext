import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import yargs from 'yargs';

const gtx = Textdomain.getInstance('com.cantanea.esgettext');

export class Install implements Command {
	synopsis(): string {
		return gtx._('[OPTIONS]');
	}

	description(): string {
		return gtx._('Install translation catalogs.');
	}

	options(): { [key: string]: yargs.Options } {
		return {
			'package-json': {
				type: 'boolean',
				describe: gtx._('Read package information from this file'),
				default: 'package.json',
				group: gtx._('Input file options:'),
			},
			locales: {
				alias: 'l',
				type: 'array',
				describe: gtx._('List of locale identifiers'),
				demandOption: true,
				group: gtx._('Input file options:'),
			},
			directory: {
				alias: 'D',
				type: 'string',
				describe: gtx._('Where to search message catalog files'),
				default: '.',
				group: gtx._('Input file options:'),
			},
			'input-format': {
				type: 'string',
				describe: gtx._('Input file type'),
				default: 'gmo',
				group: gtx._('Input file options:'),
			},
			'output-directory': {
				type: 'string',
				describe: gtx._('Output directory'),
				default: 'assets/locale',
				group: gtx._('Output file options:'),
			},
			'output-format': {
				type: 'string',
				describe: gtx._('Output format'),
				default: 'json',
				group: gtx._('Output file options:'),
			},
			verbose: {
				alias: 'V',
				type: 'boolean',
				describe: gtx._('Enable verbose output'),
			},
		};
	}

	run(argv: yargs.Arguments) {
		console.log('executed install with this arguments');
		console.log(argv);
	}
}
