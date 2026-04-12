import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function enableMocking() {
	if (process.env.NEXT_PUBLIC_ENABLE_MOCK_API !== 'true') {
		return;
	}

	await worker.start({ onUnhandledRequest: 'bypass' });
}
