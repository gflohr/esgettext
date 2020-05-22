import { Options } from 'yargs';
import { Catalog, CatalogProperties } from '../pot/catalog';

export class XGettext {
	private readonly catalog: Catalog;

	constructor(private readonly options: Options) {
		const catalogProperties: CatalogProperties = {};

		this.catalog = new Catalog(catalogProperties);

		console.log(options);
	}

	public run(): number {
		/* TODO */
		return 0;
	}
}
