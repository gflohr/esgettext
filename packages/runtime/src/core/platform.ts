export const isNode =
	typeof process !== 'undefined' &&
	process.versions !== null &&
	process.versions.node !== null;

export const pathSeparator =
	isNode && process.platform === 'win32' ? '\\' : '/';
