import { readFileSync, writeFileSync } from 'fs';
import { Textdomain , parseMoCatalog } from '@esgettext/esgettext-runtime';
import { OptionGroup, Getopt } from './getopt';


const gtx = Textdomain.getInstance('esgettext-tools');
gtx.resolve().then(() => {
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
	const catalog = parseMoCatalog(input);
	const json = JSON.stringify(catalog);

	const outputFilename = options['output'];
	if (typeof outputFilename === 'undefined') {
		process.stdout.write(json);
	} else {
		writeFileSync(outputFilename, json);
	}
});
