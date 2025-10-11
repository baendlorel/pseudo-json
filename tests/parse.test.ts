import { describe, it, expect } from 'vitest';
import { PseudoJSON } from '../src/pseudo-json.js';

describe('PseudoJSON.parse', () => {
  describe('primitive types', () => {
    it('should parse null', () => {
      const js = new PseudoJSON();
      expect(js.parse('null')).toBe(null);
    });

    it('should parse undefined', () => {
      const js = new PseudoJSON();
      expect(js.parse('undefined')).toBe(undefined);
    });

    it('should parse strings', () => {
      const js = new PseudoJSON();
      expect(js.parse('"hello"')).toBe('hello');
      expect(js.parse('"hello \\"world\\""')).toBe('hello "world"');
      expect(js.parse('""')).toBe('');
    });

    it('should parse numbers', () => {
      const js = new PseudoJSON();
      expect(js.parse('42')).toBe(42);
      expect(js.parse('3.14')).toBe(3.14);
      expect(js.parse('0')).toBe(0);
      expect(js.parse('-100')).toBe(-100);
    });

    it('should parse booleans', () => {
      const js = new PseudoJSON();
      expect(js.parse('true')).toBe(true);
      expect(js.parse('false')).toBe(false);
    });
  });

  describe('special number values', () => {
    it('should parse NaN', () => {
      const js = new PseudoJSON();
      expect(Number.isNaN(js.parse('NaN'))).toBe(true);
    });

    it('should parse Infinity', () => {
      const js = new PseudoJSON();
      expect(js.parse('Infinity')).toBe(Infinity);
    });

    it('should parse -Infinity', () => {
      const js = new PseudoJSON();
      expect(js.parse('-Infinity')).toBe(-Infinity);
    });
  });

  describe('symbols', () => {
    it('should parse Symbol without description', () => {
      const js = new PseudoJSON();
      const result = js.parse('Symbol()');
      expect(typeof result).toBe('symbol');
      expect(result.description).toBe(undefined);
    });

    it('should parse Symbol with description', () => {
      const js = new PseudoJSON();
      const result = js.parse('Symbol("test")');
      expect(typeof result).toBe('symbol');
      expect(result.description).toBe('test');
    });

    it('should parse global Symbol', () => {
      const js = new PseudoJSON();
      const result = js.parse('Symbol.for("global-key")');
      expect(typeof result).toBe('symbol');
      expect(Symbol.keyFor(result)).toBe('global-key');
    });

    it('should differentiate local and global symbols', () => {
      const js = new PseudoJSON();
      const local = js.parse('Symbol("key")');
      const global = js.parse('Symbol.for("key")');
      expect(Symbol.keyFor(local)).toBe(undefined);
      expect(Symbol.keyFor(global)).toBe('key');
    });
  });

  describe('functions', () => {
    it('should parse function', () => {
      const js = new PseudoJSON();
      const fn = js.parse('function test() { return 42; }');
      expect(typeof fn).toBe('function');
      expect(fn()).toBe(42);
    });

    it('should parse arrow function', () => {
      const js = new PseudoJSON();
      const fn = js.parse('() => "hello"');
      expect(typeof fn).toBe('function');
      expect(fn()).toBe('hello');
    });
  });

  describe('Date objects', () => {
    it('should parse Date', () => {
      const js = new PseudoJSON();
      const date = js.parse('new Date(1728000000000)');
      expect(date instanceof Date).toBe(true);
      expect(date.getTime()).toBe(1728000000000);
    });
  });

  describe('RegExp objects', () => {
    it('should parse RegExp', () => {
      const js = new PseudoJSON();
      const regex = js.parse('/test/');
      expect(regex instanceof RegExp).toBe(true);
      expect(regex.source).toBe('test');
      expect(regex.flags).toBe('');
    });

    it('should parse RegExp with flags', () => {
      const js = new PseudoJSON();
      const regex = js.parse('/test/gi');
      expect(regex instanceof RegExp).toBe(true);
      expect(regex.source).toBe('test');
      expect(regex.flags).toBe('gi');
    });
  });

  describe('arrays', () => {
    it('should parse empty array', () => {
      const js = new PseudoJSON();
      const result = js.parse('[]');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should parse simple array', () => {
      const js = new PseudoJSON();
      const result = js.parse('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should parse mixed type array', () => {
      const js = new PseudoJSON();
      const result = js.parse('[1, "hello", true, null]');
      expect(result).toEqual([1, 'hello', true, null]);
    });

    it('should parse nested arrays', () => {
      const js = new PseudoJSON();
      const result = js.parse('[[1, 2], [3, 4]]');
      expect(result).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('should parse array with indent', () => {
      const js = new PseudoJSON();
      const result = js.parse('[\n  1,\n  2,\n  3\n]');
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('objects', () => {
    it('should parse empty object', () => {
      const js = new PseudoJSON();
      const result = js.parse('{}');
      expect(result).toEqual({});
    });

    it('should parse simple object', () => {
      const js = new PseudoJSON();
      const result = js.parse('{a: 1, b: 2}');
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should parse object with different value types', () => {
      const js = new PseudoJSON();
      const result = js.parse('{num: 42, str: "hello", bool: true, nil: null}');
      expect(result).toEqual({ num: 42, str: 'hello', bool: true, nil: null });
    });

    it('should parse nested objects', () => {
      const js = new PseudoJSON();
      const result = js.parse('{outer: {inner: 42}}');
      expect(result).toEqual({ outer: { inner: 42 } });
    });

    it('should parse object with symbol keys', () => {
      const js = new PseudoJSON();
      const result = js.parse('{[Symbol("key")]: "value", regular: "prop"}');
      expect(result.regular).toBe('prop');
      const symKey = Object.getOwnPropertySymbols(result)[0];
      expect(typeof symKey).toBe('symbol');
      expect(result[symKey]).toBe('value');
    });

    it('should parse object with indent', () => {
      const js = new PseudoJSON();
      const result = js.parse('{\n  a: 1,\n  b: 2\n}');
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe('Map objects', () => {
    it('should parse empty Map', () => {
      const js = new PseudoJSON();
      const result = js.parse('new Map([])');
      expect(result instanceof Map).toBe(true);
      expect(result.size).toBe(0);
    });

    it('should parse Map with entries', () => {
      const js = new PseudoJSON();
      const result = js.parse('new Map([["key1", "value1"], ["key2", 42]])');
      expect(result instanceof Map).toBe(true);
      expect(result.get('key1')).toBe('value1');
      expect(result.get('key2')).toBe(42);
    });

    it('should parse Map with mixed key types', () => {
      const js = new PseudoJSON();
      const result = js.parse('new Map([["string", 1], [42, 2], [Symbol("key"), 3]])');
      expect(result instanceof Map).toBe(true);
      expect(result.get('string')).toBe(1);
      expect(result.get(42)).toBe(2);
    });
  });

  describe('Set objects', () => {
    it('should parse empty Set', () => {
      const js = new PseudoJSON();
      const result = js.parse('new Set([])');
      expect(result instanceof Set).toBe(true);
      expect(result.size).toBe(0);
    });

    it('should parse Set with values', () => {
      const js = new PseudoJSON();
      const result = js.parse('new Set([1, 2, 3])');
      expect(result instanceof Set).toBe(true);
      expect([...result]).toEqual([1, 2, 3]);
    });

    it('should parse Set with mixed types', () => {
      const js = new PseudoJSON();
      const result = js.parse('new Set([1, "hello", true, null])');
      expect(result instanceof Set).toBe(true);
      expect(result.has(1)).toBe(true);
      expect(result.has('hello')).toBe(true);
      expect(result.has(true)).toBe(true);
      expect(result.has(null)).toBe(true);
    });
  });

  describe('export default syntax', () => {
    it('should parse export default with object', () => {
      const js = new PseudoJSON();
      const result = js.parse('export default {a: 1, b: 2}');
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should parse export default with array', () => {
      const js = new PseudoJSON();
      const result = js.parse('export default [1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should parse export default with value', () => {
      const js = new PseudoJSON();
      expect(js.parse('export default 42')).toBe(42);
      expect(js.parse('export default "hello"')).toBe('hello');
    });
  });

  describe('round-trip (stringify -> parse)', () => {
    it('should round-trip primitive values', () => {
      const js = new PseudoJSON();
      expect(js.parse(js.stringify(null))).toBe(null);
      expect(js.parse(js.stringify(undefined))).toBe(undefined);
      expect(js.parse(js.stringify('hello'))).toBe('hello');
      expect(js.parse(js.stringify(42))).toBe(42);
      expect(js.parse(js.stringify(true))).toBe(true);
    });

    it('should round-trip special numbers', () => {
      const js = new PseudoJSON();
      expect(Number.isNaN(js.parse(js.stringify(NaN)))).toBe(true);
      expect(js.parse(js.stringify(Infinity))).toBe(Infinity);
      expect(js.parse(js.stringify(-Infinity))).toBe(-Infinity);
    });

    it('should round-trip arrays', () => {
      const js = new PseudoJSON();
      const arr = [1, 2, 'hello', true, null];
      expect(js.parse(js.stringify(arr))).toEqual(arr);
    });

    it('should round-trip objects', () => {
      const js = new PseudoJSON();
      const obj = { a: 1, b: 'hello', c: true, d: null };
      expect(js.parse(js.stringify(obj))).toEqual(obj);
    });

    it('should round-trip Date', () => {
      const js = new PseudoJSON();
      const date = new Date(1728000000000);
      const parsed = js.parse(js.stringify(date));
      expect(parsed instanceof Date).toBe(true);
      expect(parsed.getTime()).toBe(date.getTime());
    });

    it('should round-trip RegExp', () => {
      const js = new PseudoJSON();
      const regex = /test/gi;
      const parsed = js.parse(js.stringify(regex));
      expect(parsed instanceof RegExp).toBe(true);
      expect(parsed.source).toBe(regex.source);
      expect(parsed.flags).toBe(regex.flags);
    });

    it('should round-trip Map', () => {
      const js = new PseudoJSON();
      const map = new Map<string, number>([
        ['a', 1],
        ['b', 2],
      ]);
      const parsed = js.parse(js.stringify(map));
      expect(parsed instanceof Map).toBe(true);
      expect(parsed.get('a')).toBe(1);
      expect(parsed.get('b')).toBe(2);
    });

    it('should round-trip Set', () => {
      const js = new PseudoJSON();
      const set = new Set([1, 2, 3]);
      const parsed = js.parse(js.stringify(set));
      expect(parsed instanceof Set).toBe(true);
      expect([...parsed]).toEqual([1, 2, 3]);
    });

    it('should round-trip complex nested structure', () => {
      const js = new PseudoJSON();
      const complex = {
        str: 'hello',
        num: 42,
        arr: [1, 2, { nested: true }],
        obj: { inner: 'value' },
        date: new Date(1728000000000),
        regex: /test/gi,
        map: new Map([['key', 'val']]),
        set: new Set([1, 2, 3]),
        special: NaN,
      };
      const parsed = js.parse(js.stringify(complex));
      expect(parsed.str).toBe(complex.str);
      expect(parsed.num).toBe(complex.num);
      expect(parsed.arr).toEqual(complex.arr);
      expect(parsed.obj).toEqual(complex.obj);
      expect(parsed.date.getTime()).toBe(complex.date.getTime());
      expect(parsed.regex.toString()).toBe(complex.regex.toString());
      expect(parsed.map.get('key')).toBe('val');
      expect([...parsed.set]).toEqual([...complex.set]);
      expect(Number.isNaN(parsed.special)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw on invalid syntax', () => {
      const js = new PseudoJSON();
      expect(() => js.parse('{')).toThrow();
      expect(() => js.parse('[')).toThrow();
      expect(() => js.parse('invalid code')).toThrow();
    });

    it('should throw on undefined variables', () => {
      const js = new PseudoJSON();
      expect(() => js.parse('undefinedVariable')).toThrow();
    });
  });
});
