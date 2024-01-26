import * as fs from 'fs';
import { FilesCollector } from './files-collector';

jest.mock('fs');

const reader = fs.readFileSync as jest.Mock;

describe('File collector', () => {
	describe('files-from', () => {
		afterEach(() => {
			reader.mockClear();
		});

		it('should read files from a file and ignore comments and empty lines', () => {
			const file1 = `foo
bar
baz
`;
			const file2 = `
# Ignore comment.
Huey # The first.

Dewey # The second.

Louie # The third.
`;

			reader.mockReturnValueOnce(file1).mockReturnValueOnce(file2);
			const collector = new FilesCollector(['file1', 'file2'], []);
			expect(collector.filenames).toEqual([
				'foo',
				'bar',
				'baz',
				'Huey',
				'Dewey',
				'Louie',
			]);
		});

		it('should take files from command-line arguments', () => {
			const collector = new FilesCollector([], ['file1', 'file2']);
			expect(collector.filenames).toEqual(['file1', 'file2']);
		});

		it('should mix files in the right order', () => {
			const potfiles = `
foo
bar
baz
`;
			reader.mockReturnValueOnce(potfiles);
			const collector = new FilesCollector(['POTFILES'], ['hubba', 'bubba']);
			expect(collector.filenames).toEqual([
				'foo',
				'bar',
				'baz',
				'hubba',
				'bubba',
			]);
		});

		it('should make input files unique', () => {
			const potfiles = `
foo
bar
baz
`;
			reader.mockReturnValueOnce(potfiles);
			const collector = new FilesCollector(
				['POTFILES'],
				['foo', 'bar', 'bazoo'],
			);
			expect(collector.filenames).toEqual(['foo', 'bar', 'baz', 'bazoo']);
		});
	});

	describe('errors', () => {
		it('should throw an exception if no input files given', () => {
			expect(
				() => new FilesCollector(undefined as unknown as string[], []),
			).toThrow(new Error('no input file given'));
		});
	});
});
