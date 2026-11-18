import type { ComponentType } from 'react';

export interface SearchItem {
  title: string;
  /** Short line under the title. */
  snippet?: string;
  /** Extra text matched by search but not shown. */
  text?: string;
  /** Route to open, e.g. /guide/abc */
  to: string;
}

export interface SearchSource<T = any> {
  path: string;
  empty: T;
  items(data: T): SearchItem[];
}

/**
 * A section of the app. Every module lives in src/modules/<id>/ and is listed
 * once in src/modules/index.ts. The shell builds tabs, routes, the Today
 * screen and search from these manifests, so modules never know about each other.
 */
export interface AppModule {
  id: string;
  title: string;
  /** A single emoji keeps icons dependency-free. */
  icon: string;
  /** One line shown in the More menu. */
  description?: string;
  /** Main screen. Rendered at /<id>/* so a module can have its own sub-routes. */
  Page: ComponentType;
  /** Optional card on the Today screen. Return null to hide it for the day. */
  TodayCard?: ComponentType;
  /** Lower comes first on Today. Defaults to 100. */
  todayOrder?: number;
  /** Files this module makes searchable. */
  search?: SearchSource[];
}

export function defineModule(m: AppModule): AppModule {
  return m;
}
