import yargs from 'yargs';
import { input } from '@inquirer/prompts';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import { Configuration } from '../configuration';

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

type InitOptions = {
	_: string[];
	verbose?: boolean;
	[key: string]: string | string[] | boolean | undefined;
};

export class Init implements Command {
	private options: InitOptions = undefined as unknown as InitOptions;
	private readonly configuration: Configuration;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(configuration: Configuration) {
		this.configuration = configuration;
	}

	synopsis(): string {
		return '';
	}

	description(): string {
		return gtx._('Prepare a package to use esgettext.');
	}

	aliases(): Array<string> {
		return [];
	}

	args(): { [key: string]: yargs.Options } {
		return {
			force: {
				alias: 'f',
				type: 'boolean',
				describe: gtx._('Overwrite existing files.'),
			},
			'dry-run': {
				alias: 'n',
				type: 'boolean',
				describe: gtx._(
					'Just print what would be done without writing anything.',
				),
			},
			verbose: {
				alias: 'V',
				type: 'boolean',
				describe: gtx._('Enable verbose output'),
			},
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	additional(_: yargs.Argv) {}

	private init(argv: yargs.Arguments) {
		const options = argv as unknown as InitOptions;
		this.options = options;
	}

	public run(argv: yargs.Arguments): Promise<number> {
		this.init(argv);

		return new Promise(resolve => {
			if (!this.configuration.files.includes('package.json')) {
				console.error(
					gtx._x(
						"{programName}: No 'package.json' found. Please run 'npm init' first!",
					),
				);
				return resolve(1);
			}
			this.promptUser()
				.then(() => {
					resolve(0);
				})
				.catch(() => {
					resolve(1);
				});
		});
	}

	private nonEmpty(answer: string): Promise<boolean | string> {
		return new Promise(resolve => {
			if (answer.trim().length === 0) {
				return resolve(
					gtx._('Please enter a string with at least one character!'),
				);
			} else {
				return resolve(true);
			}
		});
	}

	private async promptUser() {
		console.log(
			gtx._('All of the following questions have sane default answers.'),
		);
		console.log(gtx._('In doubt just hit return!'));
		console.log();
		const setup = {
			textdomain: await input({
				message: gtx._('Textdomain of your package'),
				default: this.configuration.package?.name,
				validate: answer => this.nonEmpty(answer),
			}),
		};
		console.log(setup);
	}
}
