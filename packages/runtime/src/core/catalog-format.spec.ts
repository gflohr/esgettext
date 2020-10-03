import { Textdomain } from '../index';

/* eslint no-underscore-dangle: "off" */

describe('format', () => {
	const gtx = Textdomain.getInstance('mytest');
	describe('default', () => {
		it('should default to json', () => {
			expect(gtx.catalogFormat).toEqual('json');
		});
	});

	describe('setting', () => {
		it('should accept json', () => {
			gtx.catalogFormat = 'json';
			expect(gtx.catalogFormat).toEqual('json');
		});
		it('should accept mo', () => {
			gtx.catalogFormat = 'mo';
			expect(gtx.catalogFormat).toEqual('mo');
		});
		it('should reject me', () => {
			expect(() => (gtx.catalogFormat = 'me')).toThrowError();
		});
	});

	describe('normalize', () => {
		it('should lowercase jSoN', () => {
			gtx.catalogFormat = 'jSoN';
			expect(gtx.catalogFormat).toEqual('json');
		});
		it('should lowercase mO', () => {
			gtx.catalogFormat = 'mO';
			expect(gtx.catalogFormat).toEqual('mo');
		});
	});
});
