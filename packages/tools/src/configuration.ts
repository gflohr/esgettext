import { Textdomain } from '@esgettext/runtime';
import NpmCliPackageJson from '@npmcli/package-json';
import normalizePackageData from 'normalize-package-data';
import * as fs from 'fs';
import * as path from 'path';
import * as v from 'valibot';
import '@valibot/i18n/de';
import { Package } from './package';

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

type Author = {
	name?: string;
	email?: string;
	url?: string;
};

export type PackageJson = {
	name?: string;
	version?: string;
	type?: 'module' | 'commonjs';
	main?: string;
	module?: string;
	browser?: string;
	bugs?: {
		url?: string;
		email?: string;
	};
	people?: {
		author?: Author;
	};
	scripts?: {
		esgettext?: 'string';
		'esgettext:potfiles'?: 'string';
		'esgettext:extract'?: 'string';
		'esgettext:update-po'?: 'string';
		'esgettext:update-mo'?: 'string';
		'esgettext:install'?: 'string';
	};
	esgettext?: Configuration;
};

const bugsAddressSchema = v.union([
	v.pipe(
		v.string(),
		v.nonEmpty(
			gtx._("The field 'package.msgid-bugs-address' must not be empty!"),
		),
		v.email(
			gtx._(
				"The field 'package.msgid-bugs-address' must contain a valid email address or URL!",
			),
		),
	),
	v.pipe(
		v.string(),
		v.nonEmpty(
			gtx._("The field 'package.msgid-bugs-address' must not be empty!"),
		),
		v.url(
			gtx._(
				"The field 'package.msgid-bugs-address' must contain a valid email address or URL!",
			),
		),
	),
]);

const programSchema = (program: string) => {
	return v.strictObject({
		path: v.optional(
			v.pipe(
				v.string(),
				v.nonEmpty(
					gtx._x("The field '{field}' must not be empty!", {
						field: `programs.${program}.path`,
					}),
				),
			),
		),
		options: v.optional(
			v.array(
				v.pipe(
					v.string(),
					v.regex(new RegExp('^(?:[A-Z]|[-a-z]{2,})')),
					v.nonEmpty(),
				),
			),
		),
	});
};

export const ConfigurationSchema = v.strictObject({
	package: v.optional(
		v.strictObject({
			textdomain: v.optional(
				v.pipe(
					v.string(
						gtx._x("The field '{field}' must be a string!", {
							field: 'package.textdomain',
						}),
					),
					v.nonEmpty(
						gtx._x("The field '{field}' must not be empty!", {
							field: 'package.textdomain',
						}),
					),
				),
			),
			'msgid-bugs-address': v.optional(bugsAddressSchema),
			name: v.optional(
				v.pipe(
					v.string(
						gtx._x("The field '{field}' must be a string!", {
							field: 'package.name',
						}),
					),
					v.nonEmpty(
						gtx._x("The field '{field}' must not be empty!", {
							field: 'package.name',
						}),
					),
				),
			),
			version: v.optional(
				v.pipe(
					v.string(
						gtx._x("The field '{field}' must be a string!", {
							field: 'package.version',
						}),
					),
					v.nonEmpty(
						gtx._x("The field '{field}' must not be empty!", {
							field: 'package.version',
						}),
					),
				),
			),
			'copyright-holder': v.optional(
				v.pipe(
					v.string(
						gtx._x("The field '{field}' must be a string!", {
							field: 'package.copyright-holder',
						}),
					),
					v.nonEmpty(
						gtx._x("The field '{field}' must not be empty!", {
							field: 'package.copyright-holder',
						}),
					),
				),
			),
			'files-from': v.optional(
				v.pipe(
					v.string(
						gtx._x("The field '{field}' must be a string!", {
							field: 'package.files-from',
						}),
					),
					v.nonEmpty(
						gtx._x("The field '{field}' must not be empty!", {
							field: 'package.files-from',
						}),
					),
				),
			),
		}),
	),
	po: v.optional(
		v.strictObject({
			directory: v.optional(
				v.pipe(
					v.string(
						gtx._x("The field '{field}' must be a string!", {
							field: 'po.directory',
						}),
					),
					v.nonEmpty(
						gtx._x("The field '{field}' must not be empty!", {
							field: 'po.directory',
						}),
					),
				),
			),
			locales: v.optional(
				v.array(
					v.pipe(
						v.string(gtx._("The entries in 'po.locales' must be strings!")),
						v.nonEmpty(gtx._("The entries in 'po.locales' must not be empty!")),
					),
				),
			),
		}),
	),
	install: v.optional(
		v.strictObject({
			directory: v.optional(
				v.string("The field 'install.directory' must be a string!"),
			),
		}),
	),
	programs: v.optional(
		v.strictObject({
			msgmerge: v.optional(programSchema('msgmerge')),
			msgfmt: v.optional(programSchema('msgfmt')),
		}),
	),
	files: v.optional(v.array(v.string())),
});

export type Configuration = v.InferInput<typeof ConfigurationSchema>;

export class ConfigurationFactory {
	private static instance: Configuration;

	private constructor() {}

	public static async create(
		jsConfigFiles: Array<string>,
		pkgJsonFile: string,
		lang: string | undefined,
	): Promise<Configuration | null> {
		if (ConfigurationFactory.instance) {
			return ConfigurationFactory.instance;
		}

		if (lang && !lang.match(/^zh-/)) {
			lang = lang.replace(/-.*/, '');
		}
		let jsConfigFile;
		let msgidBugsAddressFile;
		let nameFile;
		let copyrightHolderFile;
		let versionFile;

		const rootPath = process.cwd();

		let configuration: Configuration | null = null;

		for (const file of jsConfigFiles) {
			const filePath = path.join(rootPath, file);
			if (fs.existsSync(filePath)) {
				const data = await this.loadFile(filePath);
				if (data) {
					configuration = data;
					configuration.files = [file];
					jsConfigFile = file;

					if (configuration.package?.['msgid-bugs-address']) {
						msgidBugsAddressFile = filePath;
					}

					if (configuration.package?.name) {
						nameFile = filePath;
					}

					if (configuration.package?.['copyright-holder']) {
						copyrightHolderFile = filePath;
					}

					if (configuration.package?.version) {
						versionFile = filePath;
					}

					break;
				} else {
					return null;
				}
			}
		}

		// Fallback to `package.json` configuration.  We also try to read
		// msgid-bugs-address from package.json if not set.
		if (
			!configuration ||
			!configuration.package ||
			!configuration.package['msgid-bugs-address'] ||
			!configuration.package['name'] ||
			!configuration.package['copyright-holder'] ||
			!configuration.package['version']
		) {
			const packageJson = await ConfigurationFactory.getPackageJson();
			let fileUsed = false;
			if (!configuration && packageJson.esgettext) {
				configuration = packageJson.esgettext as Configuration;
				configuration.files = [];
				fileUsed = true;
			}

			if (!configuration) configuration = { files: [] };

			if (!configuration.package?.['msgid-bugs-address']) {
				if (packageJson.bugs?.url) {
					configuration.package ??= {};
					configuration.package['msgid-bugs-address'] = packageJson.bugs.url;
					msgidBugsAddressFile = 'package.json: bugs.url';
					fileUsed = true;
				} else if (packageJson.bugs?.email) {
					configuration.package ??= {};
					configuration.package['msgid-bugs-address'] = packageJson.bugs.email;
					msgidBugsAddressFile = 'package.json: bugs.email';
					fileUsed = true;
				} else if (packageJson.people?.author?.email) {
					configuration.package ??= {};
					configuration.package['msgid-bugs-address'] =
						packageJson.people.author.email;
					msgidBugsAddressFile = 'package.json: people.author';
					fileUsed = true;
				}
			}

			if (!configuration.package?.name) {
				if (packageJson.name) {
					configuration.package ??= {};
					configuration.package.name = packageJson.name;
					nameFile = 'package.json';
					fileUsed = true;
				}
			}

			if (!configuration.package?.['copyright-holder']) {
				if (packageJson.people?.author) {
					configuration.package ??= {};
					configuration.package['copyright-holder'] =
						packageJson.people.author.name;
					if (packageJson.people.author.email) {
						configuration.package['copyright-holder'] +=
							` <${packageJson.people.author.email}>`;
					}
					if (packageJson.people.author.url) {
						configuration.package['copyright-holder'] +=
							` <${packageJson.people.author.url}>`;
					}
					copyrightHolderFile = 'package.json';
					fileUsed = true;
				}
			}

			if (!configuration.package?.version) {
				if (packageJson.version) {
					configuration.package ??= {};
					configuration.package.version = packageJson.version;
					nameFile = 'package.json';
					fileUsed = true;
				}
			}

			if (fileUsed) {
				configuration.files.push('package.json');
			}
		}

		if (!configuration) configuration = {};

		if (
			!this.validate(
				configuration,
				{
					msgidBugsAddressFile: msgidBugsAddressFile as string,
					nameFile: nameFile as string,
					copyrightHolderFile: copyrightHolderFile as string,
					versionFile: versionFile as string,
					jsConfigFile: jsConfigFile as string,
				},
				lang,
			)
		) {
			return null;
		}

		return configuration;
	}

	public static validate(
		configuration: Configuration,
		files: {
			msgidBugsAddressFile: string;
			nameFile: string;
			copyrightHolderFile: string;
			versionFile: string;
			jsConfigFile: string;
		},
		lang?: string,
	): boolean {
		const result = v.safeParse(ConfigurationSchema, configuration, { lang });

		if (!result.success) {
			const issues = result.issues;
			console.error(
				gtx._nx(
					'There is one configuration error:',
					'There are {num} configuration errors:',
					issues.length,
					{ num: issues.length },
				),
			);

			for (const issue of issues) {
				const path = v.getDotPath(issue) || gtx._('[path not set]');

				const message = issue.issues ? issue.issues[0].message : issue.message;

				let filename;
				switch (path) {
					case 'package.msgid-bugs-address':
						filename = files.msgidBugsAddressFile;
						break;
					case 'name':
						filename = files.nameFile;
						break;
					case 'copyright-holder':
						filename = files.copyrightHolderFile;
						break;
					case 'version':
						filename = files.versionFile;
						break;
					default:
						filename = files.jsConfigFile;
						break;
				}

				console.error(
					'\t',
					gtx._x('{programName}: Error: {filename}: {variable}: {message}.', {
						variable: path,
						programName: 'esgettext',
						filename,
						message,
					}),
				);
			}
			return false;
		}

		return true;
	}

	public static async getPackageJson(): Promise<PackageJson> {
		try {
			const data = await NpmCliPackageJson.load(process.cwd());
			normalizePackageData(data.content);
			return data.content as PackageJson;
		} catch (error) {
			return {} as PackageJson;
		}
	}

	private static async loadFile(
		filePath: string,
	): Promise<Configuration | null> {
		const extension = path.extname(filePath);
		if (extension === '.mjs' || extension === '.cjs' || extension === '.js') {
			return import(filePath)
				.then(module => module.default)
				.catch(error => {
					console.error(
						gtx._x(
							'{programName}: {filename}: error reading configuration: {error}',
							{
								programName: Package.getName(),
								filename: path.basename(filePath),
								error,
							},
						),
					);

					return null;
				});
		} else if (extension === '.json') {
			try {
				return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Configuration;
			} catch {
				return null;
			}
		} else {
			throw new Error(
				gtx._x(
					"{programName}: Error: {filename}: Configuration file name must end in '.mjs', '.cjs', '.js', or '.json'!",
					{
						programName: Package.getName(),
						filename: filePath,
					},
				),
			);
		}
	}
}
