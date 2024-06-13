import { Command as Program } from 'commander';
import { Command } from '../command';
import { Textdomain } from '@esgettext/runtime';

const gtx = Textdomain.getInstance('com.cantanea.esgettext');

export class Install implements Command {
	configure(commonDescription: string) {
		return new Program()
			.command(gtx._('install [OPTIONEN]'))
			.description(
				commonDescription + '\n\n' + gtx._('Install translation catalogs'),
			);
	}
}
