import yargs from 'yargs';

export interface Command {
	synopsis(): string;
	description(): string;
	aliases(): Array<string>;
	args(): { [key: string]: yargs.Options };
	run(argv: yargs.Arguments): Promise<number>;
}
