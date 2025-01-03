import { existsSync, realpathSync, lstatSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';
import { execSync } from 'child_process';
import { globSync } from 'glob';
import yargs from 'yargs';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import { Configuration } from '../configuration';
import { Package } from '../package';
import { OptSpec, coerceOptions } from '../optspec';

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
	private readonly GIT_DIRECTORY_NAME = '.git';
	private options: PotfilesOptions = undefined as unknown as PotfilesOptions;
	private readonly configuration: Configuration;

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

	args(): { [key: string]: OptSpec } {
		return {
			exclude: {
				multi: true,
				alias: 'x',
				type: 'string',
				describe: gtx._('Pattern for files to ignore.'),
			},
			git: {
				type: 'boolean',
				describe: gtx._('Only list files under (git) version control.'),
				default: this.isGitRepo(),
			},
			include: {
				multi: true,
				type: 'string',
				describe: gtx._(
					'Pattern for additional files to include (even when not under version control).',
				),
			},
			directory: {
				type: 'string',
				describe: gtx._('Make paths relative to this directory.'),
				default: this.configuration.po?.directory,
			},
		};
	}

	additional(argv: yargs.Argv) {
		argv.positional(gtx._('PATTERN'), {
			type: 'string',
			describe: gtx._('Filename patterns for source files'),
		});
	}

	private isDirectory(path: string): boolean {
		const stats = lstatSync(path);

		if (stats.isDirectory()) {
			return true;
		} else if (stats.isSymbolicLink()) {
			const realPath = realpathSync(path);
			const realStats = statSync(realPath);
			if (realStats.isDirectory()) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	private isGitDirectory(path: string): boolean {
		const fullPath = join(path, this.GIT_DIRECTORY_NAME);

		return existsSync(fullPath) && this.isDirectory(fullPath);
	}

	private isGitRepo(): boolean {
		if (this.isGitDirectory(process.cwd())) {
			return true;
		}

		let currentPath = process.cwd();
		while (true) {
			const parentPath = join(currentPath, '..');
			if (parentPath === currentPath) {
				break;
			}
			if (this.isGitDirectory(parentPath)) {
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

	private filterGit(allFiles: Array<string>) {
		const stdout = execSync('git ls-files').toString('utf-8');
		const repoFiles = stdout
			.trim()
			.split('\n')
			.map(filename => resolve(filename));
		const filtered: Array<string> = [];

		for (const filename of allFiles) {
			const resolved = resolve(filename);
			if (repoFiles.includes(resolved)) {
				filtered.push(filename);
			}
		}

		return filtered;
	}

	private makeRelative(filename: string, base: string): string {
		const absoluteFilename = resolve(filename);
		const absoluteBase = resolve(base);

		return relative(absoluteBase, absoluteFilename);
	}

	public run(argv: yargs.Arguments): Promise<number> {
		return new Promise(resolve => {
			if (!coerceOptions(argv, this.args())) {
				return resolve(1);
			}
			this.init(argv);
			const patterns = this.options[gtx._('PATTERN')] as string[];

			if (!patterns.length) {
				console.error(
					gtx._x('{programName}: Error: No filename patterns specified!', {
						programName: Package.getName(),
					}),
				);
				return resolve(1);
			}

			const candidates = globSync(patterns, { ignore: this.options.exclude });

			let filtered: Array<string>;
			if (this.options.git) {
				filtered = this.filterGit(candidates);
			} else {
				filtered = candidates.filter(filename => !this.isDirectory(filename));
			}

			if (typeof this.options.include !== 'undefined') {
				const included = globSync(this.options.include).filter(
					filename => !this.isDirectory(filename),
				);
				filtered.push(...included);
			}

			// sort | uniq for JavaScript.
			filtered = filtered.sort().filter((item, index) => {
				return index === 0 || item !== filtered[index - 1];
			});

			if (
				typeof this.options.directory !== 'undefined' &&
				this.options.directory.length
			) {
				filtered = filtered.map(filename =>
					this.makeRelative(filename, this.options.directory as string),
				);
			}

			for (const filename of filtered) {
				console.log(filename);
			}

			resolve(0);
		});
	}
}
