import * as path from 'path';
import yargs from 'yargs';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';
import { Configuration } from '../configuration';
import { OptSpec } from '../optspec';

const gtx = Textdomain.getInstance('com.cantanea.esgettext-tools');

type AddLanguageOptions = {
	_: string[];
	textdomain: string;
	poDirectory: string;
	[key: string]: string | string[] | boolean | undefined;
};

export class AddLanguage implements Command {
	private options: AddLanguageOptions =
		undefined as unknown as AddLanguageOptions;
	private configuration: Configuration;

	constructor(configuration: Configuration) {
		this.configuration = configuration;
	}

	synopsis(): string {
		return '';
	}

	description(): string {
		return gtx._('Describe process for adding languages.');
	}

	aliases(): Array<string> {
		return [];
	}

	args(): { [key: string]: OptSpec } {
		return {
			textdomain: {
				alias: 't',
				type: 'string',
				describe: gtx._('The textdomain of your package'),
				demandOption: true,
				default: this.configuration.package?.textdomain,
			},
			'po-directory': {
				type: 'string',
				describe: gtx._('Directory where your po files are located'),
				demandOption: true,
				default: this.configuration.po?.directory,
			},
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	additional(_: yargs.Argv) {}

	private init(argv: yargs.Arguments) {
		const options = argv as unknown as AddLanguageOptions;
		this.options = options;
	}

	public run(argv: yargs.Arguments): Promise<number> {
		return new Promise(resolve => {
			this.init(argv);

			const potFile =
				`${this.options.poDirectory}/${this.options.textdomain}.pot`.replace(
					/\//g,
					path.sep,
				);

			console.log(gtx._('Please execute this command:\n'));

			// TRANSLATORS: Please replace 'll' with a two-letter abbreviation
			// for the word 'language' and 'CC' with a two-letter abbreviation
			// for the workd 'country'.
			const llCC = gtx._('ll_CC');
			console.log(`\tmsginit --input=${potFile} --locale=${llCC}\n`);

			console.log(
				gtx._x(
					"Replace '{placeholder}' with the two-letter" +
						' language code of the language, optionally' +
						' followed by an underscore and the two-letter' +
						' country code.',
					{ placeholder: llCC },
				),
			);
			console.log(
				gtx._(
					'If you prefer to separate language and country' +
						' by a hyphen, rename the file later.',
				),
			);
			console.log(
				gtx._x(
					'When you are done, update the list of locales' +
						" in the configuration file '{filename}'. The" +
						" variable name is '{varname}'.",
					{
						filename: this.configuration.files?.[0],
						varname: 'po.locales',
					},
				),
			);
			const redOn = '\x1b[31m';
			const redOff = '\x1b[0m';

			console.log(
				redOn,
				gtx._(
					'Warning! The command will open an' +
						' internet connection to download the plural' +
						' function and some other data for that language!',
				),
				redOff,
			);

			resolve(0);
		});
	}
}
