import { readFileSync } from 'fs';

export abstract class Parser {
	abstract parse(input: Buffer, filename: string, encoding?: string): void;

	parseFile(filename: string, encoding?: string): void {
		return this.parse(readFileSync(filename), filename, encoding);
	}
}
