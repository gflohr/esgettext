import { Textdomain } from '@esgettext/runtime';
import * as fs from 'fs';
import * as path from 'path';
import * as v from 'valibot';
import '@valibot/i18n/de';
import { Package } from './package';

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

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
		path: v.pipe(
			v.string(),
			v.nonEmpty(
				gtx._x("The field '{field}' must not be empty!", {
					field: `programs.${program}.path`,
				}),
			),
		),
		options: v.array(
			v.pipe(
				v.string(),
				v.regex(new RegExp('^(?:[A-Z]|[-a-z]{2,})')),
				v.nonEmpty(),
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
	files: v.array(v.string()),
});

export type Configuration = v.InferInput<typeof ConfigurationSchema>;

type PackageJson = {
	name?: string;
	version?: string;
	bugs?: {
		url?: string;
		email?: string;
	};
	people: {
		author: string;
	};
	esgettext: Configuration;
};

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
		let jsConfigFilePath;
		let msgidBugsAddressFilePath;
		let nameFilePath;
		let copyrightHolderFilePath;
		let versionFilePath;

		const rootPath = process.cwd();

		let configuration: Configuration | null = null;

		for (const file of jsConfigFiles) {
			const filePath = path.join(rootPath, file);
			if (fs.existsSync(filePath)) {
				const data = await this.loadFile(filePath);
				if (data) {
					configuration = data;
					configuration.files = [file];
					jsConfigFilePath = file;

					if (configuration.package?.['msgid-bugs-address']) {
						msgidBugsAddressFilePath = filePath;
					}

					if (configuration.package?.name) {
						nameFilePath = filePath;
					}

					if (configuration.package?.['copyright-holder']) {
						copyrightHolderFilePath = filePath;
					}

					if (configuration.package?.version) {
						versionFilePath = filePath;
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
			const packageJsonPath = pkgJsonFile;
			if (fs.existsSync(packageJsonPath)) {
				const packageJson = JSON.parse(
					fs.readFileSync(packageJsonPath, 'utf-8'),
				) as PackageJson;
				let fileUsed = false;
				if (!configuration && packageJson.esgettext) {
					configuration = packageJson.esgettext as Configuration;
					configuration.files = [];
					fileUsed = true;
				}

				if (!configuration) configuration = { files: [] };

				if (!configuration.package?.['msgid-bugs-address']) {
					if (packageJson.bugs?.email) {
						configuration.package ??= {};
						configuration.package['msgid-bugs-address'] =
							packageJson.bugs.email;
						msgidBugsAddressFilePath = 'package.json';
						fileUsed = true;
					} else if (packageJson.bugs?.url) {
						configuration.package ??= {};
						configuration.package['msgid-bugs-address'] = packageJson.bugs.url;
						msgidBugsAddressFilePath = 'package.json';
						fileUsed = true;
					}
				}

				if (!configuration.package?.name) {
					if (packageJson.name) {
						configuration.package ??= {};
						configuration.package.name = packageJson.name;
						nameFilePath = 'package.json';
						fileUsed = true;
					}
				}

				if (!configuration.package?.['copyright-holder']) {
					if (packageJson.people?.author) {
						configuration.package ??= {};
						configuration.package['copyright-holder'] =
							packageJson.people.author;
						copyrightHolderFilePath = 'package.json';
						fileUsed = true;
					}
				}

				if (!configuration.package?.version) {
					if (packageJson.version) {
						configuration.package ??= {};
						configuration.package.version = packageJson.version;
						nameFilePath = 'package.json';
						fileUsed = true;
					}
				}

				if (fileUsed) {
					configuration.files.push('package.json');
				}
			}
		}

		if (!configuration) configuration = { files: [] };

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
						filename = msgidBugsAddressFilePath;
						break;
					case 'name':
						filename = nameFilePath;
						break;
					case 'copyright-holder':
						filename = copyrightHolderFilePath;
						break;
					case 'version':
						filename = versionFilePath;
						break;
					default:
						filename = jsConfigFilePath;
						break;
				}

				console.error(
					'  ' +
						gtx._x('{programName}: error: {filename}: {variable}: {message}.', {
							variable: path,
							programName: 'esgettext',
							filename,
							message,
						}),
				);
			}

			return null;
		}

		return configuration;
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
