import { Textdomain } from '@esgettext/runtime';

const gtx = Textdomain.getInstance('tools');

/**
 * This is a direct port of Locale::XGettext::Util::Keyword
 * (https://github.com/gflohr/Locale-XGettext/blob/master/lib/Locale/XGettext/Util/Keyword.pm)
 * to JavaScript. See
 * https://github.com/gflohr/Locale-XGettext/blob/master/lib/Locale/XGettext/Util/Keyword.pod
 * for more information!
 */
export class Keyword {
	private readonly _method: string;
	private _singular: number;
	private _plural: number;
	private _context: number;
	private _totalArgs: number;
	private _comment: string;

	constructor(method: string, args?: Array<string>) {
		this._method = method;

		if (!args) {
			args = new Array<string>();
		}

		const argRe = new RegExp(/^([1-9][0-9]*)([ct]?)$/);
		const commentRe = new RegExp(/"([^"]*)"/);

		const seen = new Array<number>();

		args.forEach(arg => {
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
							gtx._x('Multiple context arguments for function "{function}"!', {
								function: method,
							}),
						);
					}
					this._context = pos;
				} else if (isTotal) {
					if (this._totalArgs) {
						throw new Error(
							gtx._x('Multiple total arguments for function "{function}"!', {
								function: method,
							}),
						);
					}
					this._totalArgs = pos;
				} else if (this.plural) {
					throw new Error(
						gtx._x('Too many forms for function "{function}"!', {
							function: method,
						}),
					);
				} else if (this._singular) {
					this._plural = pos;
				} else {
					this._singular = pos;
				}
			}

			if (!argMatch) {
				const commentMatch = commentRe.exec(arg);
				if (commentMatch) {
					if (typeof this._comment !== 'undefined') {
						throw new Error(
							gtx._x('Multiple extracted comments for function "{function}"!', {
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

		this._singular ??= 1;
		this._plural ??= 0;
		this._totalArgs ??= 0;
		this._comment ??= '';
		this._context ??= 0;
	}

	static from(spec: string): Keyword {
		const tokens = new Array<string>();
		let ready = false;

		while (spec.length) {
			let modified = false;

			let remainder = spec.replace(
				/([,:])[\s]*([1-9][0-9]*[ct]?)[\s]*$/,
				(_, sep, token: string) => {
					modified = true;

					tokens.unshift(token);

					if (sep === ':') {
						ready = true;
					}

					return '';
				},
			);

			spec = remainder;

			if (ready) {
				break;
			}

			remainder = spec.replace(
				/([,:])[\s]*("[^"]*")[\s]*$/,
				(_, sep, token: string) => {
					modified = true;
					tokens.unshift(token);

					if (':' === sep) {
						ready = true;
					}

					return '';
				},
			);

			spec = remainder;

			if (ready || !modified) {
				break;
			}
		}

		return new Keyword(spec, tokens);
	}

	toString(): string {
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
		if (typeof this.comment !== 'undefined') {
			dump += `"${this.comment}",`;
		}

		dump = dump.substr(0, dump.length - 1);
		if (dump === `${this.method}:1`) {
			return this.method;
		} else {
			return dump;
		}
	}

	get method(): string {
		return this._method;
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
