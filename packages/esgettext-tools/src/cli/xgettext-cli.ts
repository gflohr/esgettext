import { Textdomain } from '@esgettext/runtime';
import { XGettext } from '../xgettext/xgettext';
import { OptionGroup, Getopt } from './getopt';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('esgettext-tools');

gtx
	.resolve()
	.then(() => {
		const optionGroups: Array<OptionGroup> = [
			{
				description: gtx._('Input file location:'),
				options: [
					{
						name: 'files-from',
						flags: { multiple: true },
						yargsOptions: {
							type: 'string',
							describe: gtx._('get list of input files from FILE'),
						},
					},
					{
						name: 'directory',
						flags: { multiple: true },
						yargsOptions: {
							alias: 'D',
							type: 'string',
							describe: gtx._(
								'add DIRECTORY to list for input files search\nIf input file is -, standard input is read.',
							),
						},
					},
				],
			},
			{
				description: gtx._('Output file location:'),
				options: [
					{
						name: 'default-domain',
						yargsOptions: {
							alias: 'd',
							type: 'string',
							describe: gtx._(
								'use NAME.po for output (instead of messages.po)',
							),
						},
					},
					{
						name: 'output',
						yargsOptions: {
							alias: 'o',
							type: 'string',
							describe: gtx._('write output to specified file'),
						},
					},
					{
						name: 'output-dir',
						yargsOptions: {
							alias: 'p',
							type: 'string',
							describe: gtx._(
								'output files will be placed in directory DIR\nIf output file is -, output is written to standard output.',
							),
						},
					},
				],
			},
			{
				description: gtx._('Choice of input file language:'),
				options: [
					{
						name: 'language',
						yargsOptions: {
							alias: 'L',
							type: 'string',
							describe: gtx._(
								'recognise the specified language (JavaScript, TypeScript, HTML)\nDefault is to auto-detect language based on filename extension.',
							),
						},
					},
				],
			},
			{
				description: gtx._('Interpretation of input files.'),
				options: [
					{
						name: 'from-code',
						yargsOptions: {
							type: 'string',
							describe: gtx._('encoding of input files'),
							default: 'ASCII',
						},
					},
				],
			},
			{
				description: gtx._('Operation mode:'),
				options: [
					{
						name: 'join-existing',
						yargsOptions: {
							alias: 'j',
							type: 'boolean',
							describe: gtx._('join messages with existing file'),
						},
					},
					{
						name: 'exclude-file',
						flags: { multiple: true },
						yargsOptions: {
							alias: 'x',
							type: 'string',
							describe: gtx._('entries from FILE.po are not extracted'),
						},
					},
					{
						name: 'add-comments',
						flags: { multiple: true },
						yargsOptions: {
							alias: 'c',
							type: 'string',
							describe: gtx._(
								'place comment blocks starting with TAG and preceding keyword lines in output file',
							),
						},
					},
					{
						name: 'add-all-comments',
						yargsOptions: {
							describe: gtx._(
								'place all comment blocks preceding keyword lines in output file',
							),
							type: 'boolean',
						},
					},
				],
			},
			{
				description: gtx._('Language specific options:'),
				options: [
					{
						name: 'extract-all',
						yargsOptions: {
							alias: 'a',
							type: 'boolean',
							describe: gtx._('extract all strings'),
						},
					},
					{
						name: 'keyword',
						flags: { multiple: true },
						yargsOptions: {
							alias: 'k',
							type: 'string',
							describe: gtx._('look for WORD as an additional keyword'),
						},
					},
					{
						name: 'flag',
						flags: { multiple: true },
						yargsOptions: {
							type: 'string',
							describe: gtx._(
								'argument: WORD:ARG:FLAG, additional flag for strings inside the argument number ARG of keyword WORD',
							),
						},
					},
					{
						name: 'instance',
						flags: { multiple: true },
						yargsOptions: {
							type: 'string',
							describe: gtx._(
								'only accept method calls of specified instance names',
							),
						},
					},
				],
			},
			{
				description: gtx._('Output details'),
				options: [
					{
						name: 'force-po',
						yargsOptions: {
							type: 'boolean',
							describe: gtx._('write PO file even if empty'),
						},
					},
					{
						name: 'no-location',
						yargsOptions: {
							type: 'boolean',
							describe: gtx._('do not write "#: filename:line" lines'),
						},
					},
					{
						name: 'location',
						yargsOptions: {
							type: 'boolean',
							describe: gtx._('generate "#: filename:line" lines (default)'),
						},
					},
					{
						name: 'width',
						yargsOptions: {
							alias: 'w',
							type: 'number',
							describe: gtx._('set output page width'),
						},
					},
					{
						name: 'no-wrap',
						yargsOptions: {
							type: 'boolean',
							describe: gtx._(
								'do not break long message lines,' +
									' longer than' +
									' the output page width, into' +
									' several lines',
							),
						},
					},
					{
						name: 'sort-output',
						yargsOptions: {
							alias: 's',
							type: 'boolean',
							describe: gtx._('generate sorted output'),
						},
					},
					{
						name: 'omit-header',
						yargsOptions: {
							type: 'boolean',
							describe: gtx._("don't write header with msgid '\"\"' header"),
						},
					},
					{
						name: 'sort-by-file',
						yargsOptions: {
							alias: 'F',
							type: 'boolean',
							describe: gtx._('sort output by file location'),
						},
					},
					{
						name: 'copyright-holder',
						yargsOptions: {
							type: 'string',
							describe: gtx._('set copyright holder in output'),
						},
					},
					{
						name: 'foreign-user',
						yargsOptions: {
							type: 'string',
							describe: gtx._('omit FSF copyright in output for foreign user'),
						},
					},
					{
						name: 'package-name',
						yargsOptions: {
							type: 'string',
							describe: gtx._('set package name in output'),
						},
					},
					{
						name: 'package-name',
						yargsOptions: {
							type: 'string',
							describe: gtx._('set package version in output'),
						},
					},
					{
						name: 'msgstr-prefix',
						yargsOptions: {
							alias: 'm',
							type: 'string',
							describe: gtx._('use STRING or "" as prefix for msgstr values'),
						},
					},
					{
						name: 'msgstr-suffix',
						yargsOptions: {
							alias: 'M',
							type: 'string',
							describe: gtx._('use STRING or "" as suffix for msgstr values'),
						},
					},
				],
			},
		];

		const usage = gtx._x('[OPTIONS] [INPUTFILE]...', {
			progName: process.argv[1],
		});

		const description = gtx._(
			'Extract translatable strings from given input files',
		);

		const getopt = new Getopt(usage, description, optionGroups, {
			hasVerboseOption: true,
		});
		let xgettext;

		try {
			xgettext = new XGettext(getopt.argv());
		} catch (error) {
			console.warn(
				gtx._x('{programName}: {error}', {
					error,
					programName: getopt.programName,
				}),
			);
			console.error(
				gtx._x('Try "{programName} --help" for more information!', {
					programName: getopt.programName,
				}),
			);
			process.exit(2);
		}

		process.exit(xgettext.run());
	})
	.catch(exception => {
		console.error(
			gtx._x('{programName}: unhandled exception: {exception}', {
				programName: 'exgettext-xgettext',
				exception,
			}),
		);
	});
