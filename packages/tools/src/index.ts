import yargs from 'yargs';

import { Package } from './package';
import { Textdomain } from '@esgettext/runtime';
import { Command } from './command';
import { Install } from './commands/install';

const commandNames = ['install'];

const commands: { [key: string]: Command } = {
	install: new Install(),
};

const gtx = Textdomain.getInstance('tools');
gtx
	.resolve()
	.then(() => {
		const program = yargs(process.argv.slice(2))
			.locale('en_US') // FIXME!
			.strict()
			.scriptName(Package.getName());

		for (const name of commandNames) {
			const command = commands[name];

			program.command({
				command: name,
				describe: command.description(),
				builder: (argv: yargs.Argv) => {
					return argv.options(command.options());
				},
				handler: (argv: yargs.Arguments) => command.run(argv),
			});
		}
		program
			.help()
			.epilogue(
				gtx._x('Report bugs at {url}!', { url: Package.getBugTrackerUrl() }),
			)
			.parse();
	})
	.catch((exception: Error) => {
		console.error(gtx._x('{programName}: unhandled exception: {exception}'), {
			programName: Package.getName(),
			exception,
		});
	});
