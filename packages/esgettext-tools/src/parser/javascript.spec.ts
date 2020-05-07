import { JavaScriptParser } from './javascript';

describe('JavaScript parser', () => {
	it('should load', () => {
		expect(new JavaScriptParser().fortyTwo()).toEqual(42);
	});
});
