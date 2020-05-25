import * as fs from 'fs';
import { XGettext } from './xgettext';

jest.mock('fs');

const date = '2020-04-23 08:50+0300';
const readFileSync = fs.readFileSync as jest.Mock;
const writeFileSync = fs.writeFileSync as jest.Mock;

const baseArgv = {
	$0: 'esgettext-xgettext',
};

function clearMocks() {
	readFileSync.mockClear();
	writeFileSync.mockClear();
}

describe('xgettext', () => {
	describe('defaults', () => {
		afterEach(() => {
			clearMocks();
		});

		it('should extract strings from javascript files', () => {
			const hello = `
console.log(gtx._('Hello, world!'));
`;
			const goodbye = `
console.log(gtx._('Goodbye, world!'));
`;

			readFileSync.mockReturnValueOnce(hello).mockReturnValueOnce(goodbye);

			const argv = { ...baseArgv, _: ['hello.js', 'goodbye.js'] };
			const xgettext = new XGettext(argv, date);
			expect(xgettext.run()).toEqual(0);
			expect(writeFileSync).toHaveBeenCalledTimes(1);

			const call = writeFileSync.mock.calls[0];
			expect(call[0]).toEqual('messages.po');
			expect(call[1]).toMatchSnapshot();
		});
	});
});
