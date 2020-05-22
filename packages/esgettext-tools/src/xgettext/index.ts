import { Catalog, CatalogProperties } from '../pot/catalog';
import { Options } from '../cli/getopt';

export class XGettext {
	private readonly catalog: Catalog;

	constructor(private readonly options: Options) {
		const catalogProperties: CatalogProperties = {};

		this.catalog = new Catalog(catalogProperties);
	}

	public run(): number {
		/* TODO */
		return 0;
	}
}
