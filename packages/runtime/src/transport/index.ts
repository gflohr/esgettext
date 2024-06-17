import { isNode } from '../core/platform';

export * from './transport.interface';
export * from './http';
export * from './fs';

if (isNode) {
	import('./fs')
		.then(module => {
			Object.assign(exports, module);
		})
		.catch(() => {
			// Cannot happen.
		});
}
