#! /usr/bin/env node

import yargs from 'yargs';

import { Package } from './package';
import { Textdomain } from '@esgettext/runtime';
import { Command } from './command';
import { ConfigurationFactory } from './configuration';
import { XGettext } from './commands/xgettext';
import { MsgmergeAll } from './commands/msgmerge-all';
import { Install } from './commands/install';
import { Convert } from './commands/convert';
import { MsgfmtAll } from './commands/msgfmt-all';

const commandNames = [
	'xgettext',
	'msgmerge-all',
	'msgfmt-all',
	'install',
	'convert',
];

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');
gtx
	.resolve()
	.then(async () => {
		const locale = Textdomain.selectLocale(['en-US', 'en-GB', 'de']);
		const ulocale = locale.replace('-', '_');
		const configuration = await ConfigurationFactory.create(locale);
		if (!configuration) process.exit(1);

		const commands: { [key: string]: Command } = {
			xgettext: new XGettext(configuration),
			'msgmerge-all': new MsgmergeAll(configuration),
			'msgfmt-all': new MsgfmtAll(configuration),
			install: new Install(configuration),
			convert: new Convert(configuration),
		};

		const program = yargs(process.argv.slice(2))
			.locale(ulocale)
			.strict()
			.showHelpOnFail(
				false,
				gtx._x("Try {programName} '--help' for more information!", {
					programName: Package.getName(),
				}),
			)
			.demandCommand(1, gtx._('Error: No command given.'))
			.scriptName(Package.getName());
		let epilogue = configuration.files.length
			? gtx._x('Additional defaults read from: {files}.', {
					files: configuration.files.join(', '),
				}) + '\n\n'
			: '';

		epilogue += gtx._x('Report bugs in the bugtracker at {url}!', {
			url: Package.getBugTrackerUrl(),
		});

		for (const name of commandNames) {
			const command = commands[name];

			const commandName = command.synopsis()
				? `${name} ${command.synopsis()}`
				: name;

			program.command({
				command: commandName,
				aliases: command.aliases(),
				describe: command.description(),
				builder: (argv: yargs.Argv) => {
					argv.epilogue(epilogue);
					command.additional(argv);

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
