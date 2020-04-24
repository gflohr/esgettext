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
.option('files-from', {
	alias: 'f',
	type: 'string',
})
.version(require(__dirname + '/../../package.json').version)
.alias('version', 'v')
.help()
.alias('help', 'h')
.argv;
