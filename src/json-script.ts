import { $jsonStringify, $fnToString, $ownKeys, $get, $isArray } from './lib/native.js';

/**
 * ## JSONScript
 * A creative class for stringifying JavaScript values to their literal representation
 *
 * Preserves special values like `NaN`, `undefined`, `Infinity`, `Symbol`, etc.
 *
 * __PKG_INFO__
 */
export class JSONScript {
  /** @internal */
  private readonly _indent: string;
  /** @internal */
  private readonly _exists = new Set<object>();

  constructor(options?: { indent?: string | number }) {
    const indent = options?.indent ?? '';
    this._indent = typeof indent === 'number' ? ' '.repeat(indent) : indent || '';
  }

  /** @internal */
  private _set(value: Set<any>, currentIndent: string): string {
    const vars: string[] = [];
    for (const item of value) {
      vars.push(this._stringify(item, currentIndent));
    }
    return `new Set([${vars.join(', ')}])`;
  }

  /** @internal */
  private _map(value: Map<any, any>, currentIndent: string): string {
    const vars: string[] = [];
    for (const [key, val] of value) {
      vars.push(`[${this._stringify(key, currentIndent)}, ${this._stringify(val, currentIndent)}]`);
    }
    return `new Map([${vars.join(', ')}])`;
  }

  /**
   * stringify a symbol and keep its description
   * @internal
   */
  private _symbol(value: symbol): string {
    if (Symbol.keyFor(value)) {
      return `Symbol.for(${JSON.stringify(value.description)})`;
    }

    if (value.description === undefined) {
      return 'Symbol()';
    } else {
      return `Symbol(${JSON.stringify(value.description)})`;
    }
  }

  /** @internal */
  private _cyclic(value: object) {
    if (this._exists.has(value)) {
      throw new TypeError('cyclic object value');
    }
    this._exists.add(value);
  }

  /** @internal */
  private _stringify(value: unknown, currentIndent = ''): string {
    const nextIndent = currentIndent + this._indent;

    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }

    switch (typeof value) {
      case 'string':
        return $jsonStringify(value);
      case 'number':
        if (Number.isNaN(value)) {
          return 'NaN';
        } else if (value === Infinity) {
          return 'Infinity';
        } else if (value === -Infinity) {
          return '-Infinity';
        }
        return String(value);
      case 'boolean':
        return String(value);
      case 'undefined':
        return 'undefined';
      case 'function':
        return $fnToString.call(value);
      case 'symbol':
        return this._symbol(value);
      case 'bigint':
        return value.toString();
      case 'object':
      default:
        break;
    }

    if (value instanceof Date) {
      return `new Date(${value.getTime()})`;
    }

    if (value instanceof RegExp) {
      return value.toString();
    }

    if (value instanceof Error) {
      return `((e)=>{e.name=${$jsonStringify(value.name)};e.stack=${$jsonStringify(value.stack ?? '')}return e;})(new Error(${$jsonStringify(value.message)}))`;
    }

    this._cyclic(value);

    if (value instanceof Map) {
      return this._map(value, currentIndent);
    }

    if (value instanceof Set) {
      return this._set(value, currentIndent);
    }

    if ($isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }

      const items = value.map((item) => this._stringify(item, nextIndent));

      if (!this._indent) {
        return `[${items.join(', ')}]`;
      }

      return `[\n${nextIndent}${items.join(`,\n${nextIndent}`)}\n${currentIndent}]`;
    }

    const keys = $ownKeys(value);

    if (keys.length === 0) {
      return '{}';
    }

    const pairs = keys.map((key: string | symbol | number) => {
      const val = $get(value, key as any);
      const keyStr = typeof key === 'string' ? key : `[${this._symbol(key as symbol)}]`;
      const valueStr = this._stringify(val, nextIndent);
      return `${keyStr}: ${valueStr}`;
    });

    if (!this._indent) {
      return `{${pairs.join(', ')}}`;
    }

    return `{\n${nextIndent}${pairs.join(`,\n${nextIndent}`)}\n${currentIndent}}`;
  }

  /**
   * Convert a JavaScript value to its literal string representation, basically returns what they look like in a .js file
   *
   * - will not preserve custom properties on Function, Date, RegExp, etc.
   * - keeps special values like `NaN`, `undefined`, `Infinity`, `Symbol`, etc.
   * - `symbol`: distinguishes global symbols and local symbols
   * - `Error`: preserve `name` and `stack`.
   * - `Map`/`Set`: preserve entries, and entries are also stringified.
   * - `Date`: only preserve the evaluated date value. So it won't give `new Date()` but `new Date(1700929823)`
   *
   * @param value The value to stringify
   * @returns String representation of the value
   */
  stringify(value: unknown): string {
    const result = this._stringify(value);
    this._exists.clear();
    return result;
  }

  /**
   * Generate a complete JavaScript module string with export default
   * @param data The data to export
   * @returns `export default something`
   */
  generateExportModule(data: unknown): string {
    const dataStr = this.stringify(data);
    return `export default ${dataStr}\n`;
  }

  /**
   * Parse the code string generated by this class
   * @param code code string
   * @returns executed result of the code
   * @throws when code has syntax error or it's broken
   */
  parse<T extends any = any>(code: string): T {
    const cleaned = code.replace(/(\s)*(export default|module.exports)[\s]+/, '');
    return Function(`"use strict"; return (${cleaned})`)();
  }
}
