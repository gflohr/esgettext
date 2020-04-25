let useFormat = 'json';

/**
 * Query or set the format to use.
 *
 * @param format one of 'json' or 'mo'
 * @return the format selected
 */
export function format(format?: string): string {
	if (typeof format !== 'undefined') {
		format = format.toLowerCase();
		if (format === 'json') {
			useFormat = 'json';
		} else if (format === 'mo') {
			useFormat = 'mo';
		}
	}

	return useFormat;
}
