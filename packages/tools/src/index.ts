#! /usr/bin/env node

import yargs, { alias } from 'yargs';

import { Package } from './package.js';
import { Textdomain } from '@esgettext/runtime';
import { Command } from './command.js';
import { ConfigurationFactory } from './configuration.js';
import { XGettext } from './commands/xgettext.js';
import { MsgmergeAll } from './commands/msgmerge-all.js';
import { Install } from './commands/install.js';
import { Convert } from './commands/convert.js';
import { MsgfmtAll } from './commands/msgfmt-all.js';

const commandNames = [
	'xgettext',
	'msgmerge-all',
	'msgfmt-all',
	'install',
	'convert',
];

const configFiles = locateConfigFiles();
const pkgJsonFile = locatePkgJsonFile();

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');
gtx
	.resolve()
	.then(async () => {
		const locale = Textdomain.selectLocale(['en-US', 'en-GB', 'de']);
		const ulocale = locale.replace('-', '_');
		const configuration = await ConfigurationFactory.create(configFiles, pkgJsonFile, locale);
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
			.options({
				configuration: {
					alias: ['config-file'],
					type: 'string',
					describe: gtx._('Path to configuration file'),
					default: 'esgettext.config.{mjs,cjs,js,json}'
				},
				package: {
					alias: ['package-json'],
					type: 'string',
					describe: gtx._("Path to 'package.json'"),
					default: 'package.json',
				}
			})
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


function getArgument(option: string): string | null {
	const longOption = '--' + option;
	const longOptionRe = new RegExp(`^${longOption}=.+`);
	const args = process.argv.slice(2);

	for (const [index, arg] of args.entries()) {
		if (arg == longOption && index < args.length) {
			return args[index + 1];
		} else if (arg.match(longOptionRe)) {
			return arg.substring(longOption.length + 1);
		} else if (arg[0] !== '-') {
			break;
		}
	}

	return null;
}

function locateConfigFiles(): Array<string> {
	const configFile = getArgument('config-file') ?? getArgument('configuration');

	return configFile !== null ? [configFile] : ['esgettext.config.mjs', 'esgettext.config.cjs', 'esgettext.config.js', 'esgettext.config.json'];
}

function locatePkgJsonFile(): string {
	const configFile = getArgument('package') ?? getArgument('package-json');

	return configFile !== null ? configFile : 'package.json';
}
