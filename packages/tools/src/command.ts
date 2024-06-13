import { Command as Program } from 'commander';

export interface Command {
	configure(commonDescription: string): Program;
}
