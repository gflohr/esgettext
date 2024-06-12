import { readFileSync, writeFileSync } from 'fs';
import { Textdomain, parseMoCatalog } from '@esgettext/runtime';
import { OptionGroup, Getopt } from './getopt';

/* eslint-disable no-console */

const gtx = Textdomain.getInstance('tools');
gtx
	.resolve()
	.then(() => {
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
							demandOption: gtx._("Error: the option '--input' is required."),
						},
					},
					{
						name: 'output',
						yargsOptions: {
							alias: 'o',
							type: 'string',
							describe: gtx._('location of the output JSON file'),
						},
					},
				],
			},
		];

		const usage = gtx._('[OPTIONS]');
		const description = gtx._('Convert .mo files into catalog json.');
		const getopt = new Getopt(usage, description, optionGroups);
		const options = getopt.argv();

		const inputFilename: string = options['input'] as string;
		const input = readFileSync(inputFilename);
		const catalog = parseMoCatalog(input);
		const json = JSON.stringify(catalog);

		const outputFilename = options['output'] as string;
		if (typeof outputFilename === 'undefined') {
			process.stdout.write(json);
		} else {
			writeFileSync(outputFilename, json);
		}
	})
	.catch((exception: Error) => {
		console.error(
			gtx._x('{programName}: unhandled exception: {exception}', {
				programName: 'esgettext-mo2json',
				exception,
			}),
		);
	});
