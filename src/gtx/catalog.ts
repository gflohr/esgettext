export interface Entry {
	[key: string]: string[];
}

export interface Catalog {
	major: number;
	minor: number;
	pluralFunction: Function;
	entries: Entry;
}
