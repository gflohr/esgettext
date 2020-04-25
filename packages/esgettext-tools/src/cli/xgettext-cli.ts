import * as yargs from 'yargs';
import { Gtx } from '../gtx-i18n-runtime';
import * as camelCase from 'camelcase';
import { OptionGroup, Getopt } from './getopt';

const gtx = new Gtx('gtx-i18n-tools');

const optionGroups: Array<OptionGroup> = [
	{
		description: gtx._('Input file location:'),
		options: [
			{
				name: 'files-from',
				flags: { multiple: true },
				yargsOptions: {
					alias: 'f',
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
					describe: gtx._('add DIRECTORY to list for input files search\nIf input file is -, standard input is read.')
				},
			},
		]
	},
	{
		description: gtx._('Output file location:'),
		options: [
			{
				name: 'default-domain',
				yargsOptions: {
					alias: 'd',
					type: 'string',
					describe: gtx._('use NAME.po for output (instead of messages.po)'),
				}
			},
			{
				name: 'output',
				yargsOptions: {
					alias: 'o',
					type: 'string',
					describe: gtx._('write output to specified file'),
				}
			},
			{
				name: 'output-dir',
				yargsOptions: {
					alias: 'p',
					type: 'string',
					describe: gtx._('output files will be placed in directory DIR\nIf output file is -, output is written to standard output.'),
				},
			},
		]
	},
	{
		description: gtx._('Choice of input file language:'),
		options: [
			{
				name: 'language',
				yargsOptions: {
					alias: 'L',
					type: 'string',
					describe: gtx._('recognise the specified language (JavaScript, TypeScript, HTML)\nDefault is to auto-detect language based on filename extension.')
				},
			},
		]
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
				}
			},
		]
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
				}
			},
			{
				name: 'exclude-file',
				flags: { multiple: true },
				yargsOptions: {
					alias: 'x',
					type: 'string',
					describe: gtx._('entries from FILE.po are not extracted'),
				}
			},
			{
				name: 'add-comments',
				flags: { multiple: true },
				yargsOptions: {
					alias: 'c',
					type: 'string',
					describe: gtx._('place comment blocks starting with TAG and preceding keyword lines in output file'),
				}
			},
			{
				name: 'add-all-comments',
				yargsOptions: {
					describe: gtx._('place all comment blocks preceding keyword lines in output file'),
					type: 'boolean',
				}
			},
		]
	},
	{
		description: gtx._('Language specific options:'),
		options: [
			{
				name: 'extract-all',
				yargsOptions: {
					alias: 'a',
					type: 'boolean',
					describe: gtx._('extract all strings')
				},
			},
			{
				name: 'keyword',
				flags: { multiple: true },
				yargsOptions: {
					alias: 'k',
					type: 'string',
					describe: gtx._('look for WORD as an additional keyword')
				},
			},
			{
				name: 'flag',
				flags: { multiple: true },
				yargsOptions: {
					alias: 'f',
					type: 'string',
					describe: gtx._('argument: WORD:ARG:FLAG, additional flag for strings inside the argument number ARG of keyword WORD')
				},
			},
		]
	},
];

const usage = gtx._('Usage: $0 [OPTIONS] INPUTFILE...');
const description = gtx._('Extract translatable strings from given input files');
const getopt = new Getopt(usage, description, optionGroups);
console.log(getopt.argv());
