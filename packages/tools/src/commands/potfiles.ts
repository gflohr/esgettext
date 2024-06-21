import { existsSync } from 'fs';
import { join } from 'path';
import yargs from 'yargs';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import { Configuration } from '../configuration';

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

type PotfilesOptions = {
	_: string[];
	directory?: string;
	exclude?: string[];
	git: boolean;
	include?: string[];
	[key: string]: string | string[] | boolean | undefined;
};

export class Potfiles implements Command {
	private readonly GIT_FOLDER_NAME = '.git';
	private options: PotfilesOptions = undefined as unknown as PotfilesOptions;
	private readonly configuration: Configuration;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(configuration: Configuration) {
		this.configuration = configuration;
	}

	synopsis(): string {
		return `[${gtx._('PATTERN')}...]`;
	}

	description(): string {
		return gtx._(
			'Write a list of filenames with translatable strings to standard output.',
		);
	}

	aliases(): Array<string> {
		return [];
	}

	args(): { [key: string]: yargs.Options } {
		return {
			exclude: {
				alias: 'x',
				type: 'string',
				array: true,
				describe: gtx._('Pattern for files to ignore.'),
			},
			git: {
				type: 'boolean',
				describe: gtx._('Only list files under (git) version control.'),
				default: this.isGitRepo(),
			},
			include: {
				type: 'string',
				array: true,
				describe: gtx._(
					'Files to include (even, when not under version control).',
				),
			},
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	additional(argv: yargs.Argv) {
		argv.positional(gtx._('PATTERN'), {
			type: 'string',
			describe: gtx._('Filename patterns for source files'),
		});
	}

	private isGitFolder(path: string): boolean {
		return existsSync(join(path, this.GIT_FOLDER_NAME));
	}

	private isGitRepo(): boolean {
		if (this.isGitFolder(process.cwd())) {
			return true;
		}

		let currentPath = process.cwd();
		while (true) {
			const parentPath = join(currentPath, '..');
			if (parentPath === currentPath) {
				break;
			}
			if (this.isGitFolder(parentPath)) {
				return true;
			}
			currentPath = parentPath;
		}

		return false;
	}

	private init(argv: yargs.Arguments) {
		const options = argv as unknown as PotfilesOptions;
		this.options = options;
	}

	public run(argv: yargs.Arguments): Promise<number> {
		this.init(argv);

		return new Promise(resolve => {
			console.log(this.options);
			resolve(0);
		});
	}
}
