import { $jsonStrfy, $fnToStr, $ownKeys, $get, $isArray, $isNaN } from './lib/native.js';

interface GenerateModuleOptions {
  /**
   * Module type to generate, either 'esm' for ES Modules or 'cjs' for CommonJS. Default is 'esm'.
   * - 'esm': generates `export default something`
   * - 'cjs': generates `module.exports = something`
   * @default 'esm'
   */
  type?: 'esm' | 'cjs';

  /**
   * Additional code to include above the export statement, such as imports or helper functions. This code will be included as-is and should be valid JavaScript.
   * @example
   * ```js
   * const pseudoJson = new PseudoJSON();
   * const moduleCode = pseudoJson.generateExportModule({ a: getNumber() }, {
   *   codeAboveExport: 'import { getNumber } from "./helper.js";'
   * });
   * console.log(moduleCode);
   * // Output:
   * // import { helper } from "./helper.js";
   * // export default { a: 1 }
   * ```
   */
  codeAboveExport?: string;
}

/**
 * ## PseudoJSON
 * A creative class for stringifying JavaScript values to their literal representation
 *
 * Preserves special values like `NaN`, `undefined`, `Infinity`, `Symbol`, etc.
 *
 * __PKG_INFO__
 */
export class PseudoJSON {
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
      return `Symbol.for(${$jsonStrfy(value.description)})`;
    }

    if (value.description === undefined) {
      return 'Symbol()';
    } else {
      return `Symbol(${$jsonStrfy(value.description)})`;
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
        return $jsonStrfy(value);
      case 'number':
        if ($isNaN(value)) {
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
        return $fnToStr.call(value);
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
      return `((e)=>{e.name=${$jsonStrfy(value.name)};e.stack=${$jsonStrfy(value.stack ?? '')}return e;})(new Error(${$jsonStrfy(value.message)}))`;
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
   * @param jsonCode The jsonCode to export
   * @param options Options for module generation, including module type and additional code above export
   * @returns `export default something`
   */
  generateExportModule(jsonCode: unknown, options?: GenerateModuleOptions): string {
    const moduleType = options?.type ?? 'esm';
    const codeAboveExport = options?.codeAboveExport ? options.codeAboveExport : '';

    if (typeof codeAboveExport !== 'string') {
      throw new TypeError('codeAboveExport must be a string');
    }

    const dataStr = this.stringify(jsonCode);
    if (moduleType === 'esm') {
      return `export default ${dataStr}\n`;
    } else if (moduleType === 'cjs') {
      return `module.exports = ${dataStr}\n`;
    } else {
      throw new Error(`Unsupported module type: ${moduleType}`);
    }
  }

  /**
   * Parse the code string generated by this class
   * @param code code string
   * @returns executed result of the code
   * @throws when code has syntax error or it's broken
   * @note This parser executes the code using the Function constructor and does NOT support `import` statements. Only pass trusted code and avoid module imports in the input.
   */
  parse<T extends any = any>(code: string): T {
    // todo 这里要改成匹配行首，因为可能会有上半部分有代码的情况
    const cleaned = code.replace(/^\s*(?:export\s+default|module\s*\.\s*exports)\s*(?:=\s*)?/, '');
    return Function(`"use strict"; return (${cleaned})`)();
  }
}
