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

	it('should fail on server errors', async () => {
		mock.get('/not-there', {
			status: 404,
			reason: 'not found',
			body: 'not found',
		});

		try {
			await transport.loadFile('/not-there');
		} catch (e) {
			expect(e).toBeDefined();
		}
	});

	// FIXME! This test succeeds but prints an ugly error message from
	// xhr-mock on console.error. So we temporarily mock console.error.
	it('should fail on xhr errors', async () => {
		mock.get('/error', () => Promise.reject(new Error()));

		// eslint-disable-next-line no-console
		const log = console.error;
		// eslint-disable-next-line no-console
		console.error = jest.fn();
		try {
			await transport.loadFile('/error').catch((e: string | undefined) => {
				throw new Error(e);
			});
		} catch (e) {
			expect(e).toBeDefined();
		}
		// eslint-disable-next-line no-console
		console.error = log;
	});
});
