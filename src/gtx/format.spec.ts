import * as gtx from '../index';

/* eslint no-underscore-dangle: "off" */

describe('format', () => {
	describe('default', () => {
		it('should default to json', () => {
			expect(gtx.format()).toEqual('json');
		});
	});

	describe('setting', () => {
		it('should accept json', () => {
			expect(gtx.format('json')).toEqual('json');
		});
		it('should accept mo', () => {
			expect(gtx.format('mo')).toEqual('mo');
		});
		it('should reject me', () => {
			const old = gtx.format();
			expect(gtx.format('me')).toEqual(old);
		});
	});

	describe('normalize', () => {
		it('should lowercase jSoN', () => {
			expect(gtx.format('jSoN')).toEqual('json');
		})
		it('should lowercase mO', () => {
			expect(gtx.format('mO')).toEqual('mo');
		})
	});
});
