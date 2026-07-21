import type { Activity } from './db';

export type GlobalBlockProps = {
	expandedActivityId: Activity['id'] | null;
	expandActivity: (activityId: Activity['id'] | null) => void;
};

export type Alert = {
	id: string;

	type: 'success' | 'error' | 'warning' | 'info';
	content: string;

	timeout: number;
	dismissedAt: number;
};

export type AddAlertFunction = (
	alert: Omit<Alert, 'id' | 'dismissedAt' | 'timeout'> & { timeout?: number }
) => void;
