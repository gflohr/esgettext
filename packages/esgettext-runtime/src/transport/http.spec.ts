import mock from 'xhr-mock';
import { TransportHttp } from './http';

const success = new TextEncoder().encode('success').buffer;
const transport = new TransportHttp();

describe('XMLHttpRequest', () => {
	beforeEach(() => mock.setup());

	afterEach(() => mock.teardown());

	it('should work with success', async () => {
		mock.get('/success', {
			status: 200,
			body: success,
		});

		const data = await transport.loadFile('/success');
		expect(data).toEqual(success);
	});
});
