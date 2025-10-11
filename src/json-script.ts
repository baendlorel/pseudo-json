import { $get, $ownKeys, $stringifySymbol } from './lib/common.js';

/**
 * JsonScript - A creative class for stringifying JavaScript values to their literal representation
 * Preserves special values like NaN, undefined, Infinity, Symbol, etc.
 */
export class JsonScript {
  private readonly indent: string;

  constructor(options: { indent?: string | number } = {}) {
    this.indent =
      typeof options.indent === 'number' ? ' '.repeat(options.indent) : options.indent || '';
  }

  /**
   * Convert a JavaScript value to its literal string representation
   * @param value - The value to stringify
   * @param currentIndent - Current indentation level (internal use)
   * @returns String representation of the value
   */
  stringify(value: unknown, currentIndent = ''): string {
    const nextIndent = currentIndent + this.indent;

    // Handle primitives and special values
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }

    switch (typeof value) {
      case 'string':
        return JSON.stringify(value);
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
        return value.toString();
      case 'symbol':
        return $stringifySymbol(value as symbol);
      case 'object':
      default:
        break;
    }

    // Handle Date objects
    if (value instanceof Date) {
      return `new Date(${value.getTime()})`;
    }

    // Handle RegExp objects
    if (value instanceof RegExp) {
      return value.toString();
    }

    // Handle Arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }

      const items = value.map((item) => this.stringify(item, nextIndent));

      if (!this.indent) {
        return `[${items.join(', ')}]`;
      }

      return `[\n${nextIndent}${items.join(`,\n${nextIndent}`)}\n${currentIndent}]`;
    }

    // Handle Objects
    const keys = $ownKeys(value);

    if (keys.length === 0) {
      return '{}';
    }

    const pairs = keys.map((key: string | symbol | number) => {
      const val = $get(value, key as any);
      const keyStr = typeof key === 'string' ? key : `[${$stringifySymbol(key as symbol)}]`;
      const valueStr = this.stringify(val, nextIndent);
      return `${keyStr}: ${valueStr}`;
    });

    if (!this.indent) {
      return `{${pairs.join(', ')}}`;
    }

    return `{\n${nextIndent}${pairs.join(`,\n${nextIndent}`)}\n${currentIndent}}`;
  }

  /**
   * Generate a complete JavaScript module string with export default
   * @param data - The data to export
   * @returns Complete JavaScript module string
   */
  generateExportModule(data: unknown): string {
    const dataStr = this.stringify(data);
    return `export default ${dataStr}\n`;
  }

  parse(code: string): any {
    return Function(`"use strict"; ${code.replace(/[\s]+export default[\s]+/, 'return ')}`)();
  }
}
