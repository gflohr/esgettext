import { Command } from 'commander';
import { Package } from './package';
import { Textdomain } from '@esgettext/runtime';

const gtx = Textdomain.getInstance('tools');
gtx
	.resolve()
	.then(() => {
		const description =
			gtx._('Command-line utilities for esgettext.') +
			'\n\n' +
			gtx._(
				'Mandatory arguments to long options are mandatory for short options too.',
			) +
			'\n' +
			gtx._('Similarly for optional arguments.') +
			'\n\n' +
			gtx._('Arguments to options are referred to in CAPS in the description.');

		const program = new Command();

		program
			.name(Package.getName())
			.version(Package.getVersion())
			.description(description);

		program.parse();
	})
	.catch((exception: Error) => {
		console.error(gtx._x('{programName}: unhandled exception: {exception}'), {
			programName: Package.getName(),
			exception,
		});
	});
