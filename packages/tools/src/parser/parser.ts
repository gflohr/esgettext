import { readFileSync } from 'fs';

export abstract class Parser {
	abstract parse(input: string): void;

	parseFile(filename: string, encoding: string): void {
		return this.parse(readFileSync(filename, encoding));
	}
}
