import { Textdomain } from '@esgettext/runtime';

const gtx = Textdomain.getInstance('esgettext-tools');

export interface POTEntryProperties {
	msgid: string;
	msgidPlural?: string;
	msgctxt?: string;
	msgstr?: string;
	translatorComments?: Array<string>;
	extractedComments?: Array<string>;
	flags?: Array<string>;
	automatic?: Array<string>;
	references?: Array<string>;
	noWarnings?: boolean;
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
	/**
	 * Create an entry.
	 *
	 * @param properties - the properties of the entry
	 * @param options - options for wrapping
	 */
	constructor(readonly properties: POTEntryProperties) {
		if (/[\u0000-\u0006\u000e-\u001f]/.exec(properties.msgid)) {
			throw new Error(gtx._('msgid must not contain control characters.'));
		}

		if (typeof this.properties.msgidPlural !== 'undefined') {
			if (/[\u0000-\u0006\u000e-\u001f]/.exec(properties.msgidPlural)) {
				throw new Error(
					gtx._('msgid_plural must not contain control characters.'),
				);
			}
		}

		if (
			this.properties.msgid === '' &&
			(typeof this.properties.msgctxt === 'undefined' ||
				this.properties.msgctxt === '')
		) {
			this.warning(
				gtx._(
					'Empty msgid.  It is reserved by esgettext.\n' +
						"Calling gettext('') returns the header " +
						'entry with meta information, not the empty ' +
						'string.\n' +
						'Consider adding a message context, if this ' +
						'is done intentionally.',
				),
			);
		}

		// Order matters here. This is most likely the order of appearance
		// in the source file.
		this.checkDeprecatedControls(this.properties.msgctxt);
		this.checkDeprecatedControls(this.properties.msgid);
		this.checkDeprecatedControls(this.properties.msgidPlural);

		// See https://savannah.gnu.org/bugs/index.php?58356
		this.checkReferences();
		this.checkFlags();
	}

	static build(): POTEntry {
		const entry = new POTEntry({ msgid: 'ignore' });
		delete entry.properties.msgid;

		return entry;
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

		if (typeof this.properties.extractedComments !== 'undefined') {
			for (let comment of this.properties.extractedComments) {
				comment = comment.replace(/\n/g, '\n#. ');
				out += `#. ${comment}\n`;
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
				.map((reference) => reference.toString())
				.join(' ');
			if (width > 0) {
				const wrapped = this.wrap(references, width - 3);
				for (const line of wrapped) {
					out += `#: ${line.trimRight().replace(/ $/, '')}\n`;
				}
			} else {
				out += `#: ${references}\n`;
			}
		}

		if (typeof this.properties.flags !== 'undefined') {
			const flags = Array.from(new Set(this.properties.flags)).join(', ');
			out += `#, ${flags}\n`;
		}

		if (typeof this.properties.msgctxt !== 'undefined') {
			out +=
				this.serializeMsgId(this.properties.msgctxt, width, 'msgctxt') + '\n';
		}
		out += this.serializeMsgId(this.properties.msgid, width) + '\n';

		if (typeof this.properties.msgidPlural === 'undefined') {
			if (typeof this.properties.msgstr !== 'undefined') {
				out +=
					this.serializeMsgId(this.properties.msgstr, width, 'msgstr') + '\n';
			} else {
				out += 'msgstr ""\n';
			}
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
		if (other.properties.flags) {
			if (!this.properties.flags) {
				this.properties.flags = new Array<string>();
			}

			other.properties.flags.forEach((flag) => {
				let negated = flag.replace(/^no-/, '');
				if (negated === flag) {
					negated = 'no-' + flag;
				}

				if (this.properties.flags.includes(negated)) {
					other.warning(
						gtx._x('flag "{flag}" conflicts with previous flag "{negated}"', {
							flag,
							negated,
						}),
					);
					const refs = this.properties.references;
					if (refs) {
						other.warning(
							gtx._nx(
								'The conflicting flag "{negated}" may stem from this location:',
								'The conflicting flag "{negated}" may stem from one of these locations:',
								refs.length,
								{ flag, negated },
							),
						);
						refs.forEach((ref) => {
							/* eslint-disable-next-line no-console */
							console.warn(`\t${ref}`);
						});
					}
				}
			});
			this.properties.flags.push(...other.properties.flags);
		}
		if (other.properties.references) {
			if (!this.properties.references) {
				this.properties.references = new Array<string>();
			}
			this.properties.references.push(...other.properties.references);
		}
	}

	/**
	 * Add an extracted comment line.  These are comments starting with "#.".
	 *
	 * @param line - one comment line to add
	 */
	addExtractedCommentLine(line: string): void {
		if (!this.properties.extractedComments) {
			this.properties.extractedComments = [];
		}
		this.properties.extractedComments.push(line);
	}

	/**
	 * Add a normal comment line.
	 *
	 * @param line - one comment line to add
	 */
	addTranslatorCommentLine(line: string): void {
		if (!this.properties.translatorComments) {
			this.properties.translatorComments = [];
		}
		this.properties.translatorComments.push(line);
	}

	/**
	 * Add a flag.
	 *
	 * @param flags - the flag to add
	 */
	addFlag(flag: string): void {
		if (!this.properties.flags) {
			this.properties.flags = [];
		}
		this.properties.flags.push(flag);
	}

	/**
	 * Add a reference.
	 *
	 * @param reference - the reference to add
	 */
	addReference(reference: string): void {
		if (!this.properties.references) {
			this.properties.references = [];
		}
		this.properties.references.push(reference);
	}

	/**
	 * Add a string chunk to the msgid.
	 *
	 * @param chunk - the chunk to add
	 */
	addToMsgid(chunk: string): void {
		if (typeof this.properties.msgid === 'undefined') {
			this.properties.msgid = '';
		}
		this.properties.msgid += chunk;
	}

	/**
	 * Add a string chunk to the msgid_plural.
	 *
	 * @param chunk - the chunk to add
	 */
	addToMsgidPlural(chunk: string): void {
		if (typeof this.properties.msgidPlural === 'undefined') {
			this.properties.msgidPlural = '';
		}
		this.properties.msgidPlural += chunk;
	}

	/**
	 * Add a string chunk to the msgstr.
	 *
	 * @param chunk - the chunk to add
	 */
	addToMsgstr(chunk: string): void {
		if (typeof this.properties.msgstr === 'undefined') {
			this.properties.msgstr = '';
		}
		this.properties.msgstr += chunk;
	}

	/**
	 * Add a string chunk to the msgctxt.
	 *
	 * @param chunk - the chunk to add
	 */
	addToMsgctxt(chunk: string): void {
		if (typeof this.properties.msgctxt === 'undefined') {
			this.properties.msgctxt = '';
		}
		this.properties.msgctxt += chunk;
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
			'\\': '\\\\',
		};

		return input.replace(/([\u0007-\u000d"\\])/gs, (m) => {
			return escapes[m[0]];
		});
	}

	private checkDeprecatedControls(str: string): void {
		if (typeof str === 'undefined') {
			return;
		}

		const deprecated = RegExp('[\u0007\u0008\u000b-\u000e]', 'gs');
		const escapes: { [key: string]: string } = {
			'\u0007': '\\a',
			'\b': '\\b',
			'\v': '\\v',
			'\f': '\\f',
			'\r': '\\r',
		};
		let matches: Array<string>;

		while ((matches = deprecated.exec(str)) !== null) {
			const escape = escapes[matches[0]];
			if (!escape) {
				continue;
			}
			delete escapes[matches[0]];
			this.warning(
				gtx._x(
					'internationalized messages should not ' +
						"contain the '{escape}' escape sequence",
					{ escape },
				),
			);
		}
	}

	private checkReferences(): void {
		if (typeof this.properties.references === 'undefined') {
			return;
		}

		this.properties.references.forEach((ref) => {
			if (/[ \n]/.exec(ref)) {
				this.error(gtx._('filenames must not contain space or newlines'));
			}
		});
	}

	private checkFlags(): void {
		if (typeof this.properties.flags === 'undefined') {
			return;
		}

		this.properties.flags.forEach((flag) => {
			if (/[,\n]/.exec(flag)) {
				this.error(gtx._('flags must not contain commas or newlines'));
			}
		});
	}

	private error(msg: string): void {
		let location = gtx._('[in memory]');
		if (typeof this.properties.references !== 'undefined') {
			location = this.properties.references[0].toString();
		}

		throw new Error(gtx._x('{location}: error: {msg}', { location, msg }));
	}

	private warning(msg: string): void {
		if (!this.properties.noWarnings) {
			let location = gtx._('[in memory]');
			if (typeof this.properties.references !== 'undefined') {
				location = this.properties.references[0].toString();
			}

			// eslint-disable-next-line no-console
			console.warn(gtx._x('{location}: warning: {msg}', { location, msg }));
		}
	}
}
