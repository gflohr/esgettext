import { Gtx } from '../gtx-i18n-runtime';
import { Options, OptionGroup, Getopt } from './getopt';
import { readFileSync, writeFileSync } from 'fs';
import { parseMO } from 'gtx-i18n-runtime';

const gtx = new Gtx('gtx-i18n-tools');

const optionGroups: Array<OptionGroup> = [
	{
		description: gtx._('File locations:'),
		options: [
			{
				name: 'input',
				yargsOptions: {
					alias: 'i',
					type: 'string',
					describe: gtx._('location of the input MO file'),
					demandOption: gtx._('Error: the option \'--input\' is required.'),
				},
			},
			{
				name: 'output',
				yargsOptions: {
					alias: 'o',
					type: 'string',
					describe: gtx._('location of the output JSON file')
				},
			},
		]
	},
];

const usage = gtx._('Usage: $0 [OPTIONS]');
const description = gtx._('Convert .mo files into catalog json.');
const getopt = new Getopt(usage, description, optionGroups);
const options = getopt.argv();

const inputFilename = options['input'];
const input = readFileSync(inputFilename);
const catalog = parseMO(input);
const json = JSON.stringify(catalog);

const outputFilename = options['output'];
if (typeof outputFilename === 'undefined') {
	process.stdout.write(json);
} else {
	writeFileSync(outputFilename, json);
}
