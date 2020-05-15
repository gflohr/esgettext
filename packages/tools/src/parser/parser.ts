import { readFileSync } from 'fs';
import { Catalog } from '../pot/catalog';

export abstract class Parser {
	abstract parse(input: Buffer, filename: string): Catalog;

	parseFile(filename: string): Catalog {
		return this.parse(readFileSync(filename), filename);
	}
}
