import { Textdomain } from '@esgettext/runtime';
import * as fs from 'fs';
import * as path from 'path';
import * as v from 'valibot';
import '@valibot/i18n/de';

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

export const ConfigurationSchema = v.strictObject({
	package: v.optional(
		v.strictObject({
			textdomain: v.optional(
				v.pipe(
					v.string(gtx._("The field 'package.textdomain' must be a string!")),
					v.nonEmpty(
						gtx._("The field 'package.textdomain' must not be empty!"),
					),
				),
			),
			'msgid-bugs-address': v.optional(bugsAddressSchema),
		}),
	),
	po: v.optional(
		v.strictObject({
			directory: v.optional(
				v.string("The field 'po.directory' must be a string!"),
			),
			locales: v.optional(
				v.array(
					v.pipe(v.string(), v.nonEmpty('Locale entries must not be empty!')),
				),
			),
		}),
	),
	locale: v.optional(
		v.strictObject({
			directory: v.optional(
				v.string("The field 'locale.directory' must be a string!"),
			),
		}),
	),
});

export type Configuration = v.InferInput<typeof ConfigurationSchema>;

export class ConfigurationFactory {
	private static instance: Configuration;

	private constructor() {}

	public static async create(
		lang: string | undefined,
	): Promise<Configuration | null> {
		if (ConfigurationFactory.instance) {
			return ConfigurationFactory.instance;
		}

		if (lang && !lang.match(/^zh-/)) {
			lang = lang.replace(/-.*/, '');
		}

		const jsConfigFiles = [
			'esgettext.config.mjs',
			'esgettext.config.cjs',
			'esgettext.config.js',
			'esgettext.config.json',
		];
		let jsConfigFilePath;
		let msgidBugsAddressPath;

		const rootPath = process.cwd();

		let configuration: Configuration | null = null;

		for (const file of jsConfigFiles) {
			const filePath = path.join(rootPath, file);
			if (fs.existsSync(filePath)) {
				const data = await this.loadFile(filePath);
				if (data) {
					configuration = data;
					jsConfigFilePath = filePath;
					if (
						configuration.package &&
						configuration.package['msgid-bugs-address']
					) {
						msgidBugsAddressPath = filePath;
					}
					break;
				}
			}
		}

		// Fallback to `package.json` configuration.  We also try to read
		// msgid-bugs-address from package.json if not set.
		if (
			!configuration ||
			!configuration.package ||
			typeof configuration.package['msgid-bugs-address'] === 'undefined'
		) {
			const packageJsonPath = path.join(rootPath, 'package.json');
			if (fs.existsSync(packageJsonPath)) {
				const packageJson = JSON.parse(
					fs.readFileSync(packageJsonPath, 'utf-8'),
				);
				if (
					!configuration &&
					packageJson.esgettext !== null &&
					typeof packageJson.esgettext === 'object'
				) {
					configuration = packageJson.esgettext;
				}

				if (!configuration) configuration = {};

				if (
					!configuration.package ||
					!configuration.package['msgid-bugs-address']
				) {
					if (packageJson.bugs) {
						if (packageJson.bugs.email) {
							configuration.package ??= {};
							configuration.package['msgid-bugs-address'] =
								packageJson.bugs.email;
							msgidBugsAddressPath = 'package.json';
						} else if (packageJson.bugs.url) {
							configuration.package ??= {};
							configuration.package['msgid-bugs-address'] =
								packageJson.bugs.url;
							msgidBugsAddressPath = 'package.json';
						}
					}
				}
			}
		}

		if (!configuration) configuration = {};

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
				let path;
				if (issue.path) {
					const keys = [];
					for (const s of issue.path) {
						// The type for v.IssuePathItem is broken at the moment.
						// It contains a 'key' but this is not typed.
						const segment = s as { key: string };
						keys.push(segment.key);
					}
					path = keys.join('.');
				} else {
					path = gtx._('[path not set');
				}

				const message = issue.issues ? issue.issues[0].message : issue.message;

				const filename =
					path === 'package.msgid-bugs-address'
						? msgidBugsAddressPath
						: jsConfigFilePath;

				console.error(
					'  ' +
						gtx._x('error: {filename}: {variable}: {message}.', {
							variable: path,
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
			return import(filePath).then(module => module.default).catch(() => null);
		} else if (extension === '.json') {
			try {
				return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Configuration;
			} catch {
				return null;
			}
		}
		return null;
	}
}
