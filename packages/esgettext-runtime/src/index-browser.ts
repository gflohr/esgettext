import { browserEnvironment } from './core/browser-environment';
browserEnvironment(true);
import { pathSeparator } from './core/path-separator';
pathSeparator('/');
export * from './core';
export { parseMoCatalog } from './parser';
