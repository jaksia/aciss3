import { createContext } from 'svelte';
import type { EventState } from './state.svelte';
import type { Activity, AddAlertFunction } from './types';

export const [getEventState, setEventState] = createContext<EventState>();
export const [getAddAlert, setAddAlert] = createContext<AddAlertFunction>();

export const [getCreateActivity, setOpenActivityCreator] =
	createContext<(initial?: { startTime?: Date; endTime?: Date }) => void>();
export const [getEditActivity, setOpenActivityEditor] =
	createContext<(activityId: Activity['id']) => void>();
export const [getDeleteActivity, setOpenActivityDeletor] =
	createContext<(activityId: Activity['id']) => void>();
