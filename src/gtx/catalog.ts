export interface Entry {
	[key: string]: Array<Array<string>>;
}

export interface Catalog {
	major: number;
	minor: number;
	pluralFunction: Function;
	entries: Entry;
}
