import { Textdomain } from '../index';

/* eslint no-underscore-dangle: "off" */

describe('format', () => {
	const gtx = Textdomain.getInstance('mytest');
	describe('default', () => {
		it('should default to json', () => {
			expect(gtx.catalogFormat()).toEqual('json');
		});
	});

	describe('setting', () => {
		it('should accept json', () => {
			expect(gtx.catalogFormat('json')).toEqual('json');
		});
		it('should accept mo', () => {
			expect(gtx.catalogFormat('mo')).toEqual('mo');
		});
		it('should reject me', () => {
			expect(() => gtx.catalogFormat('me')).toThrowError();
		});
	});

	describe('normalize', () => {
		it('should lowercase jSoN', () => {
			expect(gtx.catalogFormat('jSoN')).toEqual('json');
		});
		it('should lowercase mO', () => {
			expect(gtx.catalogFormat('mO')).toEqual('mo');
		});
	});
});
