import * as gtx from './gtx/index';

/* eslint no-underscore-dangle: "off" */

describe('translation functions', () => {
	describe('normal gettext (_)', () => {
		it('should echo its argument', () => {
			expect(gtx._('foobar')).toEqual('foobar');
		});
	});

	describe('gettext with expansion (_x)', () => {
		it('should expand placeholders', () => {
			expect(gtx._x('Hello, {name}!', { name: 'world' })).toEqual(
				'Hello, world!',
			);
		});
		it('should preserve unknown placeholders', () => {
			expect(gtx._x('Hello, {name}!', {})).toEqual('Hello, {name}!');
		});
	});
});
