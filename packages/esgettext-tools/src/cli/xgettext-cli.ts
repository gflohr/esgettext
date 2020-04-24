import * as yargs from 'yargs';

const y = yargs.option('patterns', {
	alias: 'p',
	describe: 'Default patterns',
	type: 'array',
	default: ['/**/*.html', '/**/*.js', '/**/*.ts'],
	hidden: true
});

const parsed = y.parse();
export const cli = y
.usage('Extract strings from files for translation.\nUsage: $0 [options]')
.version(require(__dirname + '/../../package.json').version)
.alias('version', 'v')
.help('help')
.alias('help', 'h')
