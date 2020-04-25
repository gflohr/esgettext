import * as gtx from './gtx';

/* eslint no-underscore-dangle: "off" */

describe('translation functions', () => {
	describe('_', () => {
		it('should echo its argument', () => {
			expect(gtx._('foobar')).toEqual('foobar');
		});
	});
	describe('_x', () => {
		it('should expand placeholders', () => {
			expect(gtx._x('Hello, {name}!', { name: 'world' })).toEqual(
				'Hello, world!',
			);
		});
	});
});
