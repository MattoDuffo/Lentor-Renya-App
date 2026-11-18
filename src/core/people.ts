export const PEOPLE = ['Mat', 'Lesley', 'Renya'] as const;
export type Person = (typeof PEOPLE)[number];
