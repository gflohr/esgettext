import { Textdomain } from '@esgettext/runtime';
import { options } from 'yargs';
import { Options } from '../cli/getopt';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');

export class MsgmergeAll {
	private readonly refPot: string;
	private readonly locales: Array<string>;

	constructor(private readonly options: Options) {
		if (!options._.length) {
			throw new Error(gtx._("no input file given"));
		} else if (options._.length !== 1) {
			throw new Error(gtx._("exactly one input file is required"));
		}

		this.refPot = options._;

		if (!options.locale || !options.locale.length) {
			throw new Error(gtx._("no locales given"))
		}

		this.locales = [];

		for (let i = 0; i < options.locale.length; ++i) {
			const locales = options.locale[i].split(/[ \t]*,[ \t]*/);
			for (let j = 0; j < locales.length; ++j) {
				this.locales.push(locales[j]);
			}
		}

		console.log(this.locales);
	}

	public run(): number {
		const exitCode = 0;

		return exitCode;
	}
}
