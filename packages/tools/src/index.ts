import yargs from 'yargs';

import { Package } from './package';
import { Textdomain } from '@esgettext/runtime';
import { Command } from './command';
import { Install } from './commands/install';
import { ConfigurationFactory } from './configuration';

const commandNames = ['install'];

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');
gtx
	.resolve()
	.then(async () => {
		const locale = 'de-DE'; //Textdomain.selectLocale(['en-US', 'en-GB', 'de']);
		const ulocale = locale.replace('-', '_');
		const configuration = await ConfigurationFactory.create(locale);
		if (!configuration) process.exit(1);

		const commands: { [key: string]: Command } = {
			install: new Install(configuration),
		};

		const program = yargs(process.argv.slice(2))
			.locale(ulocale)
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
					argv._.shift(); // Remove the command name.
					const exitCode = await command.run(argv);
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
