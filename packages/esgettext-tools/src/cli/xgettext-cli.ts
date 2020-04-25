import * as yargs from 'yargs';
import { Gtx } from '../gtx-i18n-runtime';
import * as camelCase from 'camelcase';

const gtx = new Gtx('gtx-i18n-tools');

interface OptionFlags {
	multiple?: boolean,
}

interface Option {
	name: string,
	flags?: OptionFlags,
	yargsOptions: yargs.Options,
}

interface OptionGroup {
	description: string,
	options: Array<Option>,
}

const optionGroups: Array<OptionGroup> = [
	{
		description: gtx._('Input file location:'),
		options: [
			{
				name: 'files-from',
				yargsOptions: {
					alias: 'f',
					type: 'string',
					describe: gtx._('get list of input files from FILE'),
				},
			},
			{
				name: 'directory',
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
					type: 'string',
					describe: gtx._('join messages with existing file'),
				}
			},
			{
				name: 'exclude-file',
				yargsOptions: {
					alias: 'x',
					type: 'string',
					describe: gtx._('entries from FILE.po are not extracted'),
				}
			},
			{
				name: 'add-comments',
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
				flags: {
					multiple: true,
				},
				yargsOptions: {
					alias: 'k',
					type: 'string',
					describe: gtx._('look for WORD as an additional keyword')
				},
			},
			{
				name: 'flag',
				yargsOptions: {
					alias: 'f',
					type: 'string',
					describe: gtx._('argument: WORD:ARG:FLAG, additional flag for strings inside the argument number ARG of keyword WORD')
				},
			},
		]
	},
];

const usage = gtx._('Usage: $0 [OPTIONS] INPUTFILE...\n')
	+ '\n'
	+ gtx._('Extract translatable strings from given input files\n')
	+ '\n'
	+ gtx._('Mandatory arguments to long options are mandatory for short options too.\n')
	+ gtx._('Similarly for optional arguments.\n')
	+ '\n'
	+ gtx._('Argumts to options are refered to in CAPS in the description.')

let cli = yargs;
cli.usage(usage);

let allowedKeys = new Map();
allowedKeys.set('help', true);
allowedKeys.set('h', true);
allowedKeys.set('version', true);
allowedKeys.set('v', true);
allowedKeys.set('_', true);
allowedKeys.set('$0': true);

for (let i = 0; i < optionGroups.length; ++i) {
	const group = optionGroups[i];
	const options = group.options;
	const optionKeys = options.map(option => option.name);
	optionKeys.map(key => {
		allowedKeys.set(key, true);
		allowedKeys.set(camelCase(key), true);
	});
	options
	.filter(option => option.yargsOptions.alias)
	.map(option => allowedKeys.set(option.yargsOptions.alias, true));

	cli = cli.group(optionKeys, group.description);
	for (let j = 0; j < options.length; ++j) {
		cli = cli.option(options[j].name, options[j].yargsOptions);
	}
}

cli = cli
.group(['version', 'help'], 'Informative output')
.version(require(__dirname + '/../../package.json').version)
.alias('version', 'v')
.help()
.alias('help', 'h')
.epilogue(gtx._('Report bugs at https://github.com/gflohr/gtx-i18-tools/issues'));

console.log(cli.argv);

console.log(allowedKeys);
