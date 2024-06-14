export type EsgettextPackageJson = {
	textdomain?: string;
	directory?: string;
	// Email address or URL where to report bugs.
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
