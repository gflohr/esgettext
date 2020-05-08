import { Textdomain } from '@esgettext/runtime';

export interface POTEntryProperties {
	msgid: string;
	msgidPlural?: string;
	msgctxt?: string;
	translatorComments?: Array<string>;
	flags?: Array<string>;
	automatic?: Array<string>;
	references?: Array<string>;
}

/**
 * Class representing one entry in a POT file. This is simpler than a PO
 * entry because a couple of things can be ignored:
 *
 * - no translations
 * - no obsolete entries
 * - no previous translations
 */
export class POTEntry {
	private readonly gtx = Textdomain.getInstance('esgettext-runtime');

	/**
	 * Create an entry.
	 *
	 * @param properties - the properties of the entry
	 * @param options - options for wrapping
	 */
	constructor(private readonly properties: POTEntryProperties) {
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
	}

	/**
	 * Serialize the entry to a string that can be put into a POT file.
	 *
	 * (Some) long lines are wrapped to `width` characters. If `width` is
	 * less or equal to zero, lines are not wrapped
	 *
	 * @param width - the requested page width
	 */
	toString(width = 76): string {
		let out = '';

		if (typeof this.properties.translatorComments !== 'undefined') {
			for (let comment of this.properties.translatorComments) {
				comment = comment.replace(/\n/g, '\n# ');
				out += `# ${comment}\n`;
			}
		}

		if (typeof this.properties.automatic !== 'undefined') {
			for (let comment of this.properties.automatic) {
				comment = comment.replace(/\n/g, '\n#. ');
				out += `#. ${comment}\n`;
			}
		}

		if (typeof this.properties.references !== 'undefined') {
			const references = Array.from(new Set(this.properties.references))
				.map((reference) => reference.replace(/\n/g, '\\n#, '))
				.join(', ');
			if (width > 0) {
				const wrapped = this.wrap(references, width - 3);
				for (const line of wrapped) {
					out += `#: ${line.trimRight().replace(/,$/, '')}\n`;
				}
			} else {
				out += `#: ${references}\n`;
			}
		}

		if (typeof this.properties.flags !== 'undefined') {
			const flags = Array.from(new Set(this.properties.flags))
				.map((flag) => flag.replace(/\n/g, '\n#, '))
				.join(', ');
			out += `#, ${flags}\n`;
		}

		if (typeof this.properties.msgctxt !== 'undefined') {
			out +=
				this.serializeMsgId(this.properties.msgctxt, width, 'msgctxt') + '\n';
		}
		out += this.serializeMsgId(this.properties.msgid, width) + '\n';

		if (typeof this.properties.msgidPlural === 'undefined') {
			out += 'msgstr ""\n';
		} else {
			out +=
				this.serializeMsgId(
					this.properties.msgidPlural,
					width,
					'msgid_plural',
				) + '\n';
			out += 'msgstr[0] ""\nmsgstr[1] ""\n';
		}

		return out;
	}

	/**
	 * Merge to POT entries into one. It is a assumed that both entries share
	 * the same `msgid`, `msgidPlural`, and `msgContext`.
	 *
	 * @param other - the other POT entry
	 */
	public merge(other: POTEntry): void {
		if (other.properties.translatorComments) {
			if (!this.properties.translatorComments) {
				this.properties.translatorComments = new Array<string>();
			}
			this.properties.translatorComments.push(
				...other.properties.translatorComments,
			);
		}
		if (other.properties.automatic) {
			if (!this.properties.automatic) {
				this.properties.automatic = new Array<string>();
			}
			this.properties.automatic.push(...other.properties.automatic);
		}
		if (other.properties.references) {
			if (!this.properties.references) {
				this.properties.references = new Array<string>();
			}
			this.properties.references.push(...other.properties.references);
		}
		if (other.properties.flags) {
			if (!this.properties.flags) {
				this.properties.flags = new Array<string>();
			}
			this.properties.flags.push(...other.properties.flags);
		}
	}

	private serializeMsgId(
		input: string,
		width: number,
		prefix = 'msgid',
	): string {
		if (width <= 0) {
			const escaped = this.escape(input);
			return `${prefix} "${escaped}"`;
		}

		const output = new Array<string>();
		const preWrapped = input.split('\n').map((str) => this.escape(str));
		if (
			preWrapped.length > 1 ||
			preWrapped[0].length > width - prefix.length - 3
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
				const wrapped = this.wrap(line, width - 2);
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

		output.push(input);

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
