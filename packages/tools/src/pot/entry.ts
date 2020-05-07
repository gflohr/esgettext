import { Textdomain } from '@esgettext/runtime';

export interface POTEntryLocation {
	filename: string;
	lineno: number;
}

export interface POTEntryProperties {
	msgid: string;
	msgidPlural?: string;
	flags?: {
		[key: string]: string;
	};
	references?: Array<POTEntryLocation>;
}

export interface POTEntryOptions {
	width?: number;
	noWrap?: boolean;
}

export class POTEntry {
	private readonly gtx = Textdomain.getInstance('esgettext-runtime');

	constructor(
		private readonly properties: POTEntryProperties,
		private readonly options: POTEntryOptions = {},
	) {
		if (/[\u0000-\u0006\u000e-\u001f]/.exec(properties.msgid)) {
			throw new Error(this.gtx._('msgid must not contain control characters'));
		}
		if (typeof this.properties.msgidPlural !== 'undefined') {
			if (/[\u0000-\u0006\u000e-\u001f]/.exec(properties.msgidPlural)) {
				throw new Error(
					this.gtx._('msgid_plural must not contain control characters'),
				);
			}
		}

		if (typeof this.options.width === 'undefined') {
			this.options.width = 76;
		}
	}

	serialize(): string {
		let out = this.serializeMsgId(this.properties.msgid) + '\n';

		if (typeof this.properties.msgidPlural === 'undefined') {
			out += 'msgstr ""\n';
		} else {
			out +=
				this.serializeMsgId(this.properties.msgidPlural, 'msgid_plural') + '\n';
			out += 'msgstr[0] ""\nmsgstr[1] ""\n';
		}

		return out;
	}

	private serializeMsgId(input: string, prefix = 'msgid'): string {
		if (this.options.noWrap) {
			const escaped = this.escape(input);
			return `${prefix} "${escaped}"\n`;
		}

		const output = new Array<string>();
		const preWrapped = input.split('\n').map((str) => this.escape(str));
		if (
			preWrapped.length > 1 ||
			preWrapped[0].length > this.options.width - prefix.length - 3
		) {
			output.push(`${prefix} ""`);
		} else {
			const chunk = preWrapped.shift();
			output.push(`${prefix} "${chunk}"`);
		}

		preWrapped.forEach((line, index) => {
			if (index < preWrapped.length - 1) {
				line += '\\n';
			}
			if (line.length) {
				const wrapped = this.wrap(line, this.options.width - 2);
				wrapped.forEach((inner) => {
					output.push(`"${inner}"`);
				});
			}
		});

		return output.join('\n');
	}

	private wrap(input: string, width: number): Array<string> {
		const output = new Array<string>();

		while (input.length > width) {
			let i = input.lastIndexOf(' ', width);
			if (i < 0) {
				i = input.indexOf(' ', width);
			}
			if (i < 0) {
				break;
			}
			output.push(input.substr(0, i + 1));
			input = input.substr(i + 1);
		}

		if (input.length) {
			output.push(input);
		}

		return output;
	}

	private escape(input: string): string {
		const escapes: { [key: string]: string } = {
			'\u0007': '\\a',
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\v': '\\v',
			'\f': '\\f',
			'\r': '\\r',
			'"': '\\"',
		};

		return input.replace(/([\u0007-\u000d"])/gs, (m) => {
			return escapes[m[0]];
		});
	}
}
