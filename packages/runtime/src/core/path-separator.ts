let usePathSeparator = '/';

/*
 * Get/set the path separator to use.  This should only be imported from
 * the main entry point for the browser resp. node.
 */
export function pathSeparator(sep?: string): string {
	if (typeof sep !== 'undefined') {
		usePathSeparator = sep;
	}

	return usePathSeparator;
}
