/**
 * Minimal client-side cordis context face used by this plugin's settings
 * section. Kept local so the bundle has no build-time dependency on a specific
 * `@deepseek-ai/dsh-client-*` package name.
 */
export interface ClientContext {
  get(name: string): unknown;
  effect(factory: () => void | (() => void), name?: string): () => void;
}
