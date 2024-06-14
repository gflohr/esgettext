import yargs from 'yargs';

export interface Command {
	synopsis(): string;
	description(): string;
	args(): { [key: string]: yargs.Options };
	init(argv: yargs.Arguments): void;
	run(): Promise<number>;
}
