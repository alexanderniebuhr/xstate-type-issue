import { createMachine, assign, createActor, fromPromise } from 'xstate';

const homeFetcher = fromPromise<{ D1: unknown[]; R2: unknown[] }>(async () => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({ D1: ['D1', 'D2'], R2: [] });
		}, 1000);
	});
});

const d1Fetcher = fromPromise(async () => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true);
		}, 1000);
	});
});

const machine = createMachine(
	{
		context: {
			lastView: 'HOME',
			bindings: {
				D1: [],
				R2: [],
			},
		},
		id: 'Dev Overlay Plugin',
		initial: 'Disabled',
		states: {
			Disabled: {
				on: {
					toggle: [
						{
							target: 'Home',
							guard: 'lastView = HOME',
						},
						{
							target: 'D1 (Overview)',
							guard: 'lastView = D1',
						},
					],
				},
			},
			Home: {
				description: 'Dashboard page, where the user selects type or binding',
				initial: 'Opened',
				states: {
					Opened: {
						entry: assign({ lastView: 'HOME' }),
						always: {
							target: 'Loading',
						},
					},
					Loading: {
						invoke: {
							src: 'loadHomeData',
							id: 'invoke-2cik3',
							onDone: [
								{
									target: 'Waiting',
									actions: assign({
										bindings: ({ context, event }) => (context.bindings = event.output),
									}),
								},
							],
						},
					},
					Waiting: {
						on: {
							SELECTED: {
								target: '#Dev Overlay Plugin.D1 (Overview)',
							},
						},
					},
					Closed: {
						always: {
							target: '#Dev Overlay Plugin.Disabled',
						},
					},
				},
				on: {
					CLOSE: {
						target: '.Closed',
						reenter: false,
					},
				},
			},
			'D1 (Overview)': {
				description: 'D1 page, where the user selects exact D1 database',
				initial: 'Opened',
				states: {
					Opened: {
						entry: assign({ lastView: 'D1' }),
						always: {
							target: 'Loading',
						},
					},
					Loading: {
						invoke: {
							src: 'loadD1Data',
							id: 'invoke-7ubtp',
							onDone: [
								{
									target: 'Waiting',
								},
							],
						},
					},
					Waiting: {},
					Closed: {
						always: {
							target: '#Dev Overlay Plugin.Disabled',
						},
					},
				},
				on: {
					CLOSE: {
						target: '.Closed',
					},
				},
			},
		},
		types: {
			actors: {} as
				| { src: 'loadHomeData'; logic: typeof homeFetcher }
				| { src: 'loadD1Data'; logic: typeof d1Fetcher },
			events: {} as { type: 'toggle' } | { type: '' } | { type: 'CLOSE' } | { type: 'SELECTED' },
			context: {} as { lastView: string; bindings: { D1: unknown[]; R2: unknown[] } },
		},
	},
	{
		actions: {},
		actors: {
			loadHomeData: homeFetcher,
			loadD1Data: d1Fetcher,
		},
		guards: {
			'lastView = HOME': ({ context }) => {
				return Boolean(context.lastView === 'HOME');
			},
			'lastView = D1': ({ context }) => {
				return Boolean(context.lastView === 'D1');
			},
		},
		delays: {},
	}
);

export const actor = createActor(machine);

actor.subscribe((state) => {
	console.log(JSON.stringify(state));
});
