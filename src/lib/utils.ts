/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Action } from 'svelte/action';

export const clickOutside: Action<
	HTMLElement,
	{ callback: (e: MouseEvent) => void; capture?: boolean }
> = function (
	node,
	param = {
		callback: () => {}
	}
) {
	function handleClick(e: MouseEvent) {
		if (!node.contains(e.target as Node)) {
			param.callback(e);
		}
	}

	window.addEventListener('click', handleClick, {
		capture: param.capture || false
	});

	return {
		destroy() {
			// the node has been removed from the DOM
			window.removeEventListener('click', handleClick, {
				capture: param.capture || false
			});
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
