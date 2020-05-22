import { FilesCollector } from './files-collector';

describe('File collector', () => {
	describe('errors', () => {
		it('should throw an exception if no input files given', () => {
			expect(() => new FilesCollector(undefined, [])).toThrow(
				new Error('no input file given'),
			);
		});
	});
});
