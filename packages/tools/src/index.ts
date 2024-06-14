import yargs from 'yargs';

import { Package } from './package';
import { Textdomain } from '@esgettext/runtime';
import { Command } from './command';
import { Install } from './commands/install';

const commandNames = ['install'];

const commands: { [key: string]: Command } = {
	install: new Install(),
};

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');
gtx
	.resolve()
	.then(() => {
		const locale = Textdomain.selectLocale(['en-US', 'en-GB', 'de']).replace(
			'-',
			'_',
		);
		const program = yargs(process.argv.slice(2))
			.locale(locale)
			.strict()
			.scriptName(Package.getName());
		const epilogue = gtx._x('Report bugs in the bugtracker at {url}!', {
			url: Package.getBugTrackerUrl(),
		});

		for (const name of commandNames) {
			const command = commands[name];

			program.command({
				command: name,
				describe: command.description(),
				builder: (argv: yargs.Argv) => {
					argv.epilogue(epilogue);
					return argv.options(command.args());
				},
				handler: async (argv: yargs.Arguments) => {
					argv._.shift();  // Remove the command name.
					const exitCode = await command.init(argv).run();
					process.exit(exitCode);
				},
			});
		}
		program.help().epilogue(epilogue).parse();
	})
	.catch((exception: Error) => {
		console.error(gtx._x('{programName}: unhandled exception: {exception}'), {
			programName: Package.getName(),
			exception,
		});
	});
