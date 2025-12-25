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
