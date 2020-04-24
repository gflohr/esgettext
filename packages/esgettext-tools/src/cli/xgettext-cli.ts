import * as yargs from 'yargs';
import { Gtx } from '../gtx-i18n-runtime';

const gtx = new Gtx('gtx-i18n-tools');

const usage = gtx._('Usage: $0 [OPTIONS] INPUTFILE...\n')
	+ '\n'
	+ gtx._('Extract translatable strings from given input files\n')
	+ '\n'
	+ gtx._('Mandatory arguments to long options are mandatory for short options too.\n')
	+ gtx._('Similarly for optional arguments.\n')
	+ '\n'
	+ gtx._('Argumts to options are refered to in CAPS in the description.')

export const cli = yargs
.usage(usage)
.group(['files-from', 'directory'], gtx._('Input file location:'))
.option('files-from', {
	alias: 'f',
	type: 'string',
	describe: gtx._('get list of input files from FILE'),
})
.option('directory', {
	alias: 'D',
	type: 'string',
	describe: gtx._('add DIRECTORY to list for input files search\nIf input file is -, standard input is read.')
})
.group(['default-domain', 'output', 'output-dir'], gtx._('Output file location'))
.option('default-domain', {
	alias: 'd',
	type: 'string',
	describe: gtx._('use NAME.po for output (instead of messages.po)'),
})
.options('output', {
	alias: 'o',
	type: 'string',
	describe: gtx._('write output to specified file'),
})
.option('output-dir', {
	alias: 'p',
	type: 'string',
	describe: gtx._('output files will be placed in directory DIR\nIf output file is -, output is written to standard output.'),
})
.group(['language'], gtx._('Choice of input file language'))
.option('language' {
	alias: 'L',
	type: 'string',
	describe: gtx._('recognise the specified language (JavaScript, TypeScript, HTML)\nDefault is to auto-detect language based on filename extension.')
})
.group('from-code', gtx._('Interpretation of input files.'))
.option('from-code', {
	type: 'string',
	describe: gtx._('encoding of input files'),
	default: 'ASCII',
})
.group(['join-existing', 'exclude-file', 'add-comments', 'add-all-comments'], gtx._('Operation mode'))
.option('join-existing', {
	alias: 'j',
	type: 'string',
	describe: gtx._('join messages with existing file'),
})
.option('exclude-file', {
	alias: 'x',
	type: 'string',
	describe: gtx._('entries from FILE.po are not extracted'),
})
.option('add-comments', {
	alias: 'c',
	type: 'string',
	describe: gtx._('place comment blocks starting with TAG and preceding keyword lines in output file'),
})
.option('add-all-comments', {
	describe: gtx._('place all comment blocks preceding keyword lines in output file'),
	type: 'boolean',
})
.group(['version', 'help'], 'Informative output')
.version(require(__dirname + '/../../package.json').version)
.alias('version', 'v')
.help()
.alias('help', 'h')
.epilogue(gtx._('Report bugs at https://github.com/gflohr/gtx-i18-tools/issues'))
.argv;
