export type EsgettextPackageJson = {
	textdomain?: string;
	directory?: string;
	'msgid-bugs-address'?: string;
	locales?: [string];
};

export type PackageJson = {
	name?: string;
	version?: string;
	author?: string;
	bugs?: {
		url?: string;
	};
	esgettext?: EsgettextPackageJson;
};
