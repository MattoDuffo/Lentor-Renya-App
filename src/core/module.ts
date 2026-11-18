import type { ComponentType } from 'react';

/**
 * A section of the app. Every module lives in src/modules/<id>/ and is listed
 * once in src/modules/index.ts. The shell builds tabs, routes and the Today
 * screen from these manifests, so modules never need to know about each other.
 */
export interface AppModule {
  id: string;
  title: string;
  /** A single emoji keeps icons dependency-free. */
  icon: string;
  /** Main screen. Rendered at /<id>/* so a module can have its own sub-routes. */
  Page: ComponentType;
  /** Optional card shown on the Today screen. */
  TodayCard?: ComponentType;
}

export function defineModule(m: AppModule): AppModule {
  return m;
}
