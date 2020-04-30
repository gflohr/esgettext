/**
 * Function for germanic plural. Returns singular (0) for 1 item, and
 * 1 for everything else.
 *
 * @param numItems - number of items
 * @returns the index into the plural translations
 */
export function germanicPlural(numItems: number): number {
	return numItems === 1 ? 0 : 1;
}
