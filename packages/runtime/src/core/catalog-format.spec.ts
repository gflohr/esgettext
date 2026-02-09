import { Textdomain } from '../index';

/* eslint no-underscore-dangle: "off" */

describe('format', () => {
	const gtx = Textdomain.getInstance('mytest');
	describe('default', () => {
		it('should default to mo.json', () => {
			expect(gtx.catalogFormat).toEqual('mo.json');
		});
	});

	describe('setting', () => {
		it('should accept json', () => {
			gtx.catalogFormat = 'mo.json';
			expect(gtx.catalogFormat).toEqual('mo.json');
		});
		it('should accept mo', () => {
			gtx.catalogFormat = 'mo';
			expect(gtx.catalogFormat).toEqual('mo');
		});
		it('should reject me', () => {
			expect(() => (gtx.catalogFormat = 'me')).toThrow();
		});
	});

	describe('normalize', () => {
		it('should lowercase mO.jSoN', () => {
			gtx.catalogFormat = 'mO.jSoN';
			expect(gtx.catalogFormat).toEqual('mo.json');
		});
		it('should lowercase mO', () => {
			gtx.catalogFormat = 'mO';
			expect(gtx.catalogFormat).toEqual('mo');
		});
	});
});
