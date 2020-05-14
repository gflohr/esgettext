import { PoParser } from './po';

describe('parse po files', () => {
	describe('simple file', () => {
		it('should parse', () => {
			const input = `# Translations for smell-o-vision.
# Copyright (C) 2020 SmellOVision Inc.
# This file is distributed under the same license as the smell-o-vision package.
# John Doe <john.doe@example.com>, 2020.
#
msgid ""
msgstr ""
"Project-Id-Version: smell-o-vision 0.1.1\\n"
"Report-Msgid-Bugs-To: jane.appleseed@example.com\\n"
"POT-Creation-Date: 2020-04-23 08:50+0300\\n"
"PO-Revision-Date: 2020-04-25 23:04+0300\\n"
"Last-Translator: John Doe <John.Doe@example.com>\\n"
"Language-Team: Finnish <fi@li.org>\\n"
"Language: Finnish\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=utf-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

msgid "no comment"
msgstr ""
`;
			// eslint-disable-next-line no-console
			const parser = new PoParser(console.warn);
			const result = parser.parse(input, 'example.js');
			console.log(result.toString());

			expect(result).toBeDefined();
		});
	});
});
