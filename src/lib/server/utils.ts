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
