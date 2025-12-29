/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Action } from 'svelte/action';

export const clickOutside: Action<HTMLElement, { callback: (e: MouseEvent) => void }> = function (
	node,
	param = {
		callback: () => {}
	}
) {
	window.addEventListener('click', handleClick);

	function handleClick(e: MouseEvent) {
		if (!node.contains(e.target as Node)) {
			param.callback(e);
		}
	}

	return {
		destroy() {
			// the node has been removed from the DOM
			window.removeEventListener('click', handleClick);
		}
	};
};

export function logFunctions(prefix: string) {
	return {
		debug: (...args: any[]) => console.debug(`[${prefix}]`, ...args),
		info: (...args: any[]) => console.info(`[${prefix}]`, ...args),
		warn: (...args: any[]) => console.warn(`[${prefix}]`, ...args),
		error: (...args: any[]) => console.error(`[${prefix}]`, ...args),
		time: (label: string) => console.time(`[${prefix}] ${label}`),
		timeEnd: (label: string) => console.timeEnd(`[${prefix}] ${label}`),
		trace: (...args: any[]) => console.trace(`[${prefix}]`, ...args)
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonResponse(data: any = {}, status = 200) {
	return new Response(
		JSON.stringify({
			...data,
			success: status >= 200 && status < 300
		}),
		{
			status,
			headers: { 'Content-Type': 'application/json' }
		}
	);
}

export function jsonError(message: string, status: number) {
	if (status < 400 || status >= 600) {
		throw new Error('jsonError called with invalid status code: ' + status);
	}
	return jsonResponse({ error: message }, status);
}
