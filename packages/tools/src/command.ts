import yargs from 'yargs';

export interface Command {
	synopsis(): string;
	description(): string;
	options(): { [key: string]: yargs.Options };
	run(argv: yargs.Arguments): void;
}
