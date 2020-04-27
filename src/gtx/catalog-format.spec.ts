import { catalogFormat } from '../index';

/* eslint no-underscore-dangle: "off" */

describe('format', () => {
	describe('default', () => {
		it('should default to json', () => {
			expect(catalogFormat()).toEqual('json');
		});
	});

	describe('setting', () => {
		it('should accept json', () => {
			expect(catalogFormat('json')).toEqual('json');
		});
		it('should accept mo', () => {
			expect(catalogFormat('mo')).toEqual('mo');
		});
		it('should reject me', () => {
			const old = catalogFormat();
			expect(catalogFormat('me')).toEqual(old);
		});
	});

	describe('normalize', () => {
		it('should lowercase jSoN', () => {
			expect(catalogFormat('jSoN')).toEqual('json');
		});
		it('should lowercase mO', () => {
			expect(catalogFormat('mO')).toEqual('mo');
		});
	});
});
