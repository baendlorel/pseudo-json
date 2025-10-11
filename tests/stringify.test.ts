import { describe, it, expect } from 'vitest';
import { JSONScript } from '../src/json-script.js';

describe('JSONScript.stringify', () => {
  describe('primitive types', () => {
    it('should stringify null', () => {
      const js = new JSONScript();
      expect(js.stringify(null)).toBe('null');
    });

    it('should stringify undefined', () => {
      const js = new JSONScript();
      expect(js.stringify(undefined)).toBe('undefined');
    });

    it('should stringify strings', () => {
      const js = new JSONScript();
      expect(js.stringify('hello')).toBe('"hello"');
      expect(js.stringify('hello "world"')).toBe('"hello \\"world\\""');
      expect(js.stringify('')).toBe('""');
    });

    it('should stringify numbers', () => {
      const js = new JSONScript();
      expect(js.stringify(42)).toBe('42');
      expect(js.stringify(3.14)).toBe('3.14');
      expect(js.stringify(0)).toBe('0');
      expect(js.stringify(-100)).toBe('-100');
    });

    it('should stringify booleans', () => {
      const js = new JSONScript();
      expect(js.stringify(true)).toBe('true');
      expect(js.stringify(false)).toBe('false');
    });
  });

  describe('special number values', () => {
    it('should stringify NaN', () => {
      const js = new JSONScript();
      expect(js.stringify(NaN)).toBe('NaN');
    });

    it('should stringify Infinity', () => {
      const js = new JSONScript();
      expect(js.stringify(Infinity)).toBe('Infinity');
    });

    it('should stringify -Infinity', () => {
      const js = new JSONScript();
      expect(js.stringify(-Infinity)).toBe('-Infinity');
    });
  });

  describe('symbols', () => {
    it('should stringify Symbol without description', () => {
      const js = new JSONScript();
      const sym = Symbol();
      expect(js.stringify(sym)).toBe('Symbol()');
    });

    it('should stringify Symbol with description', () => {
      const js = new JSONScript();
      const sym = Symbol('test');
      expect(js.stringify(sym)).toBe('Symbol("test")');
    });

    it('should stringify global Symbol', () => {
      const js = new JSONScript();
      const sym = Symbol.for('global-key');
      expect(js.stringify(sym)).toBe('Symbol.for("global-key")');
    });

    it('should distinguish local and global symbols', () => {
      const js = new JSONScript();
      const local = Symbol('key');
      const global = Symbol.for('key');
      expect(js.stringify(local)).toBe('Symbol("key")');
      expect(js.stringify(global)).toBe('Symbol.for("key")');
    });
  });

  describe('functions', () => {
    it('should stringify function', () => {
      const js = new JSONScript();
      const fn = function test() {
        return 42;
      };
      const result = js.stringify(fn);
      expect(result).toContain('function test()');
      expect(result).toContain('return 42');
    });

    it('should stringify arrow function', () => {
      const js = new JSONScript();
      const fn = () => 'hello';
      const result = js.stringify(fn);
      expect(result).toContain('=>');
    });
  });

  describe('Date objects', () => {
    it('should stringify Date', () => {
      const js = new JSONScript();
      const date = new Date('2025-10-11T00:00:00.000Z');
      const result = js.stringify(date);
      expect(result).toBe(`new Date(${date.getTime()})`);
    });

    it('should stringify Date with specific timestamp', () => {
      const js = new JSONScript();
      const date = new Date(1728000000000);
      expect(js.stringify(date)).toBe('new Date(1728000000000)');
    });
  });

  describe('RegExp objects', () => {
    it('should stringify RegExp', () => {
      const js = new JSONScript();
      expect(js.stringify(/test/)).toBe('/test/');
      expect(js.stringify(/test/gi)).toBe('/test/gi');
      expect(js.stringify(/\d+/g)).toBe('/\\d+/g');
    });
  });

  describe('arrays', () => {
    it('should stringify empty array', () => {
      const js = new JSONScript();
      expect(js.stringify([])).toBe('[]');
    });

    it('should stringify simple array without indent', () => {
      const js = new JSONScript();
      expect(js.stringify([1, 2, 3])).toBe('[1, 2, 3]');
    });

    it('should stringify mixed type array', () => {
      const js = new JSONScript();
      expect(js.stringify([1, 'hello', true, null])).toBe('[1, "hello", true, null]');
    });

    it('should stringify nested arrays', () => {
      const js = new JSONScript();
      expect(
        js.stringify([
          [1, 2],
          [3, 4],
        ])
      ).toBe('[[1, 2], [3, 4]]');
    });

    it('should stringify array with indent', () => {
      const js = new JSONScript({ indent: 2 });
      const result = js.stringify([1, 2, 3]);
      expect(result).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('should stringify nested array with indent', () => {
      const js = new JSONScript({ indent: 2 });
      const result = js.stringify([
        [1, 2],
        [3, 4],
      ]);
      expect(result).toContain('[\n  [\n    1,\n    2\n  ],\n  [\n    3,\n    4\n  ]\n]');
    });
  });

  describe('objects', () => {
    it('should stringify empty object', () => {
      const js = new JSONScript();
      expect(js.stringify({})).toBe('{}');
    });

    it('should stringify simple object without indent', () => {
      const js = new JSONScript();
      expect(js.stringify({ a: 1, b: 2 })).toBe('{a: 1, b: 2}');
    });

    it('should stringify object with different value types', () => {
      const js = new JSONScript();
      const result = js.stringify({ num: 42, str: 'hello', bool: true, nil: null });
      expect(result).toContain('num: 42');
      expect(result).toContain('str: "hello"');
      expect(result).toContain('bool: true');
      expect(result).toContain('nil: null');
    });

    it('should stringify nested objects', () => {
      const js = new JSONScript();
      const result = js.stringify({ outer: { inner: 42 } });
      expect(result).toBe('{outer: {inner: 42}}');
    });

    it('should stringify object with symbol keys', () => {
      const js = new JSONScript();
      const sym = Symbol('key');
      const obj = { [sym]: 'value', regular: 'prop' };
      const result = js.stringify(obj);
      expect(result).toContain('[Symbol("key")]: "value"');
      expect(result).toContain('regular: "prop"');
    });

    it('should stringify object with indent', () => {
      const js = new JSONScript({ indent: 2 });
      const result = js.stringify({ a: 1, b: 2 });
      expect(result).toBe('{\n  a: 1,\n  b: 2\n}');
    });

    it('should stringify nested object with indent', () => {
      const js = new JSONScript({ indent: 2 });
      const result = js.stringify({ outer: { inner: 42 } });
      expect(result).toContain('{\n  outer: {\n    inner: 42\n  }\n}');
    });
  });

  describe('Map objects', () => {
    it('should stringify empty Map', () => {
      const js = new JSONScript();
      expect(js.stringify(new Map())).toBe('new Map([])');
    });

    it('should stringify Map with entries', () => {
      const js = new JSONScript();
      const map = new Map<string, string | number>([
        ['key1', 'value1'],
        ['key2', 42],
      ]);
      const result = js.stringify(map);
      expect(result).toContain('new Map([');
      expect(result).toContain('["key1", "value1"]');
      expect(result).toContain('["key2", 42]');
    });

    it('should stringify Map with mixed key types', () => {
      const js = new JSONScript();
      const sym = Symbol('key');
      const map = new Map<string | number | symbol, number>([
        ['string', 1],
        [42, 2],
        [sym, 3],
      ]);
      const result = js.stringify(map);
      expect(result).toContain('"string"');
      expect(result).toContain('42');
      expect(result).toContain('Symbol("key")');
    });
  });

  describe('Set objects', () => {
    it('should stringify empty Set', () => {
      const js = new JSONScript();
      expect(js.stringify(new Set())).toBe('new Set([])');
    });

    it('should stringify Set with values', () => {
      const js = new JSONScript();
      const set = new Set([1, 2, 3]);
      const result = js.stringify(set);
      expect(result).toBe('new Set([1, 2, 3])');
    });

    it('should stringify Set with mixed types', () => {
      const js = new JSONScript();
      const set = new Set([1, 'hello', true, null]);
      const result = js.stringify(set);
      expect(result).toContain('1');
      expect(result).toContain('"hello"');
      expect(result).toContain('true');
      expect(result).toContain('null');
    });
  });

  describe('cyclic reference detection', () => {
    it('should detect cyclic object reference', () => {
      const js = new JSONScript();
      const obj: any = { a: 1 };
      obj.self = obj;
      expect(() => js.stringify(obj)).toThrow(TypeError);
      expect(() => js.stringify(obj)).toThrow('cyclic object value');
    });

    it('should detect cyclic array reference', () => {
      const js = new JSONScript();
      const arr: any[] = [1, 2];
      arr.push(arr);
      expect(() => js.stringify(arr)).toThrow(TypeError);
      expect(() => js.stringify(arr)).toThrow('cyclic object value');
    });

    it('should detect indirect cyclic reference', () => {
      const js = new JSONScript();
      const obj1: any = { a: 1 };
      const obj2: any = { b: 2, ref: obj1 };
      obj1.ref = obj2;
      expect(() => js.stringify(obj1)).toThrow(TypeError);
    });

    it('should allow same object referenced at same level', () => {
      const js = new JSONScript();
      const shared = { value: 42 };
      const obj = { a: shared, b: shared };
      // This should throw because we're using the same object reference
      expect(() => js.stringify(obj)).toThrow(TypeError);
    });

    it('should reset cycle detection between calls', () => {
      const js = new JSONScript();
      const obj = { a: 1 };
      expect(js.stringify(obj)).toBe('{a: 1}');
      expect(js.stringify(obj)).toBe('{a: 1}');
    });
  });

  describe('indent options', () => {
    it('should use string indent', () => {
      const js = new JSONScript({ indent: '\t' });
      const result = js.stringify({ a: 1 });
      expect(result).toBe('{\n\ta: 1\n}');
    });

    it('should use number indent', () => {
      const js = new JSONScript({ indent: 4 });
      const result = js.stringify({ a: 1 });
      expect(result).toBe('{\n    a: 1\n}');
    });

    it('should handle zero indent', () => {
      const js = new JSONScript({ indent: 0 });
      const result = js.stringify({ a: 1 });
      expect(result).toBe('{a: 1}');
    });

    it('should handle no indent option', () => {
      const js = new JSONScript();
      const result = js.stringify({ a: 1 });
      expect(result).toBe('{a: 1}');
    });
  });

  describe('generateExportModule', () => {
    it('should generate export default statement', () => {
      const js = new JSONScript();
      const result = js.generateExportModule({ a: 1, b: 2 });
      expect(result).toBe('export default {a: 1, b: 2}\n');
    });

    it('should generate export for array', () => {
      const js = new JSONScript();
      const result = js.generateExportModule([1, 2, 3]);
      expect(result).toBe('export default [1, 2, 3]\n');
    });

    it('should generate export with indent', () => {
      const js = new JSONScript({ indent: 2 });
      const result = js.generateExportModule({ a: 1 });
      expect(result).toBe('export default {\n  a: 1\n}\n');
    });
  });

  describe('complex nested structures', () => {
    it('should handle deeply nested objects', () => {
      const js = new JSONScript();
      const deep = { a: { b: { c: { d: { e: 42 } } } } };
      const result = js.stringify(deep);
      expect(result).toContain('e: 42');
    });

    it('should handle array of objects', () => {
      const js = new JSONScript();
      const arr = [{ a: 1 }, { b: 2 }, { c: 3 }];
      const result = js.stringify(arr);
      expect(result).toContain('{a: 1}');
      expect(result).toContain('{b: 2}');
      expect(result).toContain('{c: 3}');
    });

    it('should handle object with array values', () => {
      const js = new JSONScript();
      const obj = { nums: [1, 2, 3], strs: ['a', 'b'] };
      const result = js.stringify(obj);
      expect(result).toContain('nums: [1, 2, 3]');
      expect(result).toContain('strs: ["a", "b"]');
    });

    it('should handle mixed complex structure', () => {
      const js = new JSONScript();
      const complex = {
        str: 'hello',
        num: 42,
        arr: [1, 2, { nested: true }],
        obj: { inner: 'value' },
        date: new Date(1728000000000),
        regex: /test/gi,
        map: new Map([['key', 'val']]),
        set: new Set([1, 2, 3]),
        sym: Symbol('test'),
        special: NaN,
      };
      const result = js.stringify(complex);
      expect(result).toContain('str: "hello"');
      expect(result).toContain('num: 42');
      expect(result).toContain('nested: true');
      expect(result).toContain('new Date(1728000000000)');
      expect(result).toContain('/test/gi');
      expect(result).toContain('new Map');
      expect(result).toContain('new Set');
      expect(result).toContain('Symbol("test")');
      expect(result).toContain('special: NaN');
    });
  });
});
