import * as yargs from 'yargs';
import { Gtx } from '../gtx-i18n-runtime';

const gtx = new Gtx('gtx-i18n-tools');

const usage = gtx._('Usage: $0 [OPTIONS] INPUTFILE...\n')
	+ '\n'
	+ gtx._('Extract translatable strings from given input files\n')
	+ '\n'
	+ gtx._('Mandatory arguments to long options are mandatory for short options too.\n')
	+ gtx._('Similarly for optional arguments.');

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
.group(['version', 'help'], 'Informative output')
.version(require(__dirname + '/../../package.json').version)
.alias('version', 'v')
.help()
.alias('help', 'h')
.epilogue(gtx._('Report bugs at https://github.com/gflohr/gtx-i18-tools/issues'))
.argv;
