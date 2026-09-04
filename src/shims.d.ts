declare module "@deepseek-ai/cordis" {
  export interface Context {
    logger(name: string): {
      info(...args: unknown[]): void;
      warn(...args: unknown[]): void;
      error(...args: unknown[]): void;
    };
    effect(factory: () => void | (() => void), name?: string): () => void;
  }
}

declare module "@deepseek-ai/schemastery" {
  type Schema<T = unknown> = {
    default(value: T): Schema<T>;
    description(text: string): Schema<T>;
    hidden(): Schema<T>;
    role(name: string): Schema<T>;
  };
  interface SchemaCtor {
    <T>(value?: T): Schema<T>;
    object(shape: Record<string, Schema<unknown>>): Schema<Record<string, unknown>>;
    boolean(): Schema<boolean>;
    string(): Schema<string>;
    number(): Schema<number>;
    array<T>(item: Schema<T>): Schema<T[]>;
    intersect(schemas: Schema<unknown>[]): Schema<unknown>;
  }
  const Schema: SchemaCtor;
  export default Schema;
}

declare module "@deepseek-ai/dsh-client-runtime/client" {
  export interface ClientContext {
    get(name: string): unknown;
    effect(factory: () => void | (() => void), name?: string): () => void;
  }
}
