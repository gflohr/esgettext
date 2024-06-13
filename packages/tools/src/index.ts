import { Command as Program } from 'commander';
import { Package } from './package';
import { Textdomain } from '@esgettext/runtime';
import { Command } from './command';
import { Install } from './commands/install';

const commands: { [key: string]: Command } = {
	install: new Install(),
};

const gtx = Textdomain.getInstance('tools');
gtx
	.resolve()
	.then(() => {
		const commonDescription =
			gtx._(
				'Mandatory arguments to long options are mandatory for short options too.',
			) +
			'\n' +
			gtx._('Similarly for optional arguments.') +
			'\n\n' +
			gtx._('Arguments to options are referred to in CAPS in the description.');
		const description =
			'Command-line tools for esgettext.' + '\n\n' + commonDescription;

		let program = new Program();

		program = program
			.name(Package.getName())
			.version(Package.getVersion())
			.description(description);

		Object.values(commands).forEach(command => {
			console.log(`command: ${command}`);
			const c = command.configure(commonDescription);
			program = program.addCommand(c);
		});

		program.parse();
	})
	.catch((exception: Error) => {
		console.error(gtx._x('{programName}: unhandled exception: {exception}'), {
			programName: Package.getName(),
			exception,
		});
	});
