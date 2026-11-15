declare module "js-yaml" {
  export function load(str: string, opts?: unknown): any;
  export function dump(obj: unknown, opts?: unknown): string;
  const yaml: {
    load: (str: string, opts?: unknown) => any;
    dump: (obj: unknown, opts?: unknown) => string;
  };
  export default yaml;
}
