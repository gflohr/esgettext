import { Textdomain } from '@esgettext/runtime';

const gtx = Textdomain.getInstance('esgettext-tools');

/**
 * This is a direct port of Locale::XGettext::Util::Keyword
 * (https://github.com/gflohr/Locale-XGettext/blob/master/lib/Locale/XGettext/Util/Keyword.pm)
 * to JavaScript. See
 * https://github.com/gflohr/Locale-XGettext/blob/master/lib/Locale/XGettext/Util/Keyword.pod
 * for more information!
 */
export class Keyword {
	private _singular: number;
	private _plural: number;
	private _context: number;
	private _totalArgs: number;
	private _comment: string;

	constructor(private readonly method: string, args?: Array<string>) {
		if (!args) {
			args = new Array<string>();
		}

		const argRe = new RegExp(/^([1-9][0-9]*)([ct]?)$/);
		const commentRe = new RegExp(/"(.*)"/);

		const seen = new Array<number>();

		args.forEach((arg) => {
			if (typeof arg === 'undefined' || arg === '') {
				arg = '1';
			}
			const argMatch = argRe.exec(arg);
			if (argMatch) {
				const pos = Number.parseInt(argMatch[1], 10);
				const isCtx = argMatch[2] === 'c' ? true : false;
				const isTotal = argMatch[2] === 't' ? true : false;

				if (seen.includes(pos) && !isTotal) {
					throw new Error(
						gtx._x(
							'Multiple meanings for argument #{num} for function "{function}"!',
							{ function: method, num: pos },
						),
					);
				}
				seen.push(pos);

				if (isCtx) {
					if (this._context) {
						throw new Error(
							gtx._x('Multiple context arguments for function "{function}"', {
								function: method,
							}),
						);
					}
					this._context = pos;
				} else if (isTotal) {
					if (this._totalArgs) {
						throw new Error(
							gtx._x('Multiple total arguments for function "{function}"', {
								function: method,
							}),
						);
					}
					this._totalArgs = pos;
				} else if (this.plural) {
					throw new Error(
						gtx._x('Too many forms for "{function}"!', { function: method }),
					);
				} else if (this.singular) {
					this._plural = pos;
				} else {
					this._singular = pos;
				}
			}

			if (!argMatch) {
				const commentMatch = commentRe.exec(arg);
				if (commentMatch) {
					if (typeof this._context !== 'undefined') {
						throw new Error(
							gtx._x('Multiple automatic comments for function "{function}"!', {
								function: method,
							}),
						);
					}
					this._comment = commentMatch[1];
				} else {
					throw new Error(
						gtx._x(
							'Invalid argument specification "{spec}" for function "{function}"!',
							{ spec: arg, function: method },
						),
					);
				}
			}
		});

		if (!this._singular) {
			this._singular = 1;
		}
	}

	static from(spec: string): Keyword {
		const tokens = new Array<string>();
		let commentSeen = false;
		let formsSeen = 0;
		let contextSeen = false;
		let totalSeen = false;
		let ready = false;

		// Strip off tokens from the end of the string until a colon is
		// encountered.
		while (tokens.length < 5 && spec.length) {
			let remainder = spec.replace(
				/([,:])[\s]*([1-9][0-9]*[ct]?)[\s]*$/,
				(_, sep, token) => {
					if (token.endsWith('c')) {
						if (contextSeen) {
							spec += `:${token}`;
						}
						contextSeen = true;
					} else if (token.endsWith('t')) {
						if (totalSeen) {
							spec += `:${token}`;
						}
						totalSeen = true;
					} else {
						if (formsSeen >= 2) {
							spec += `:${token}`;
							ready = true;
						}
						++formsSeen;
					}
					if (!ready) {
						tokens.unshift(token);
					}

					if (sep === ':') {
						ready = true;
					}

					return '';
				},
			);

			if (ready) {
				break;
			}

			if (spec !== remainder) {
				spec = remainder;
			}

			remainder = spec.replace(/([,:])[\s]*"(.*)"[\s]*$/, (_, sep, token) => {
				if (commentSeen) {
					spec += `:${token}`;
					ready = true;
				} else {
					// GNU xgettext simply strips off quotes.
					token = token
						.split('')
						.filter((c: string) => c !== '"')
						.join('');
					tokens.unshift(`"${token}"`);
					commentSeen = true;
				}

				if (':' === sep) {
					ready = true;
				}

				return '';
			});

			if (ready || remainder === spec) {
				break;
			}
		}

		let method = spec;
		if (!method.length) {
			method = tokens[0];
			tokens.unshift();
		}
		return new Keyword(method, tokens);
	}

	dump(): string {
		let dump = this.method + ':';
		if (this.context) {
			dump += this.context + 'c,';
		}
		dump += this.singular + ',';
		if (this.plural) {
			dump += this.plural + ',';
		}
		if (this.totalArgs) {
			dump += this.totalArgs + 't,';
		}

		return dump.substr(0, dump.length - 1);
	}

	get singular(): number {
		return this._singular;
	}

	get plural(): number {
		return this._plural;
	}

	get context(): number {
		return this._context;
	}

	get comment(): string {
		return this._comment;
	}

	get totalArgs(): number {
		return this._totalArgs;
	}
}
