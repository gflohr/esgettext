export interface CatalogEntries {
	[key: string]: Array<string>;
}

export interface Catalog {
	major: number;
	minor: number;
	pluralFunction: Function;
	entries: CatalogEntries;
}
