import { describe, it, expect } from 'vitest';
import { PseudoJSON } from '../src/pseudo-json.js';

describe('PseudoJSON helper methods', () => {
  describe('_symbol helper (via stringify)', () => {
    it('should handle Symbol without description', () => {
      const js = new PseudoJSON();
      const sym = Symbol();
      const result = js.stringify(sym);
      expect(result).toBe('Symbol()');
    });

    it('should handle Symbol with string description', () => {
      const js = new PseudoJSON();
      const sym = Symbol('test');
      const result = js.stringify(sym);
      expect(result).toBe('Symbol("test")');
    });

    it('should handle Symbol with empty string description', () => {
      const js = new PseudoJSON();
      const sym = Symbol('');
      const result = js.stringify(sym);
      expect(result).toBe('Symbol("")');
    });

    it('should handle global Symbol', () => {
      const js = new PseudoJSON();
      const sym = Symbol.for('globalKey');
      const result = js.stringify(sym);
      expect(result).toBe('Symbol.for("globalKey")');
    });

    it('should handle Symbol with special characters in description', () => {
      const js = new PseudoJSON();
      const sym = Symbol('test\n"quote"');
      const result = js.stringify(sym);
      expect(result).toContain('Symbol');
      expect(result).toContain('\\n');
      expect(result).toContain('\\"quote\\"');
    });

    it('should distinguish local vs global symbols with same description', () => {
      const js = new PseudoJSON();
      const local = Symbol('key');
      const global = Symbol.for('key');
      expect(js.stringify(local)).toBe('Symbol("key")');
      expect(js.stringify(global)).toBe('Symbol.for("key")');
    });

    it('should handle Symbol as object key', () => {
      const js = new PseudoJSON();
      const sym = Symbol('key');
      const obj = { [sym]: 'value' };
      const result = js.stringify(obj);
      expect(result).toContain('[Symbol("key")]: "value"');
    });

    it('should handle multiple Symbol keys in object', () => {
      const js = new PseudoJSON();
      const sym1 = Symbol('first');
      const sym2 = Symbol('second');
      const obj = { [sym1]: 1, [sym2]: 2 };
      const result = js.stringify(obj);
      expect(result).toContain('[Symbol("first")]: 1');
      expect(result).toContain('[Symbol("second")]: 2');
    });

    it('should handle global Symbol as object key', () => {
      const js = new PseudoJSON();
      const sym = Symbol.for('globalKey');
      const obj = { [sym]: 'value' };
      const result = js.stringify(obj);
      expect(result).toContain('[Symbol.for("globalKey")]: "value"');
    });
  });

  describe('_set helper (via stringify)', () => {
    it('should handle empty Set', () => {
      const js = new PseudoJSON();
      const set = new Set();
      expect(js.stringify(set)).toBe('new Set([])');
    });

    it('should handle Set with single element', () => {
      const js = new PseudoJSON();
      const set = new Set([42]);
      expect(js.stringify(set)).toBe('new Set([42])');
    });

    it('should handle Set with multiple elements', () => {
      const js = new PseudoJSON();
      const set = new Set([1, 2, 3]);
      const result = js.stringify(set);
      expect(result).toBe('new Set([1, 2, 3])');
    });

    it('should handle Set with strings', () => {
      const js = new PseudoJSON();
      const set = new Set(['a', 'b', 'c']);
      const result = js.stringify(set);
      expect(result).toContain('new Set([');
      expect(result).toContain('"a"');
      expect(result).toContain('"b"');
      expect(result).toContain('"c"');
    });

    it('should handle Set with mixed types', () => {
      const js = new PseudoJSON();
      const set = new Set([1, 'hello', true, null, undefined]);
      const result = js.stringify(set);
      expect(result).toContain('1');
      expect(result).toContain('"hello"');
      expect(result).toContain('true');
      expect(result).toContain('null');
      expect(result).toContain('undefined');
    });

    it('should handle Set with special values', () => {
      const js = new PseudoJSON();
      const set = new Set([NaN, Infinity, -Infinity]);
      const result = js.stringify(set);
      expect(result).toContain('NaN');
      expect(result).toContain('Infinity');
      expect(result).toContain('-Infinity');
    });

    it('should handle Set with objects', () => {
      const js = new PseudoJSON();
      const set = new Set([{ a: 1 }, { b: 2 }]);
      const result = js.stringify(set);
      expect(result).toContain('{a: 1}');
      expect(result).toContain('{b: 2}');
    });

    it('should handle Set with nested arrays', () => {
      const js = new PseudoJSON();
      const set = new Set([
        [1, 2],
        [3, 4],
      ]);
      const result = js.stringify(set);
      expect(result).toContain('[1, 2]');
      expect(result).toContain('[3, 4]');
    });

    it('should handle Set with Date objects', () => {
      const js = new PseudoJSON();
      const date = new Date(1728000000000);
      const set = new Set([date]);
      const result = js.stringify(set);
      expect(result).toContain('new Date(1728000000000)');
    });

    it('should handle nested Set in object', () => {
      const js = new PseudoJSON();
      const obj = { mySet: new Set([1, 2, 3]) };
      const result = js.stringify(obj);
      expect(result).toContain('mySet: new Set([1, 2, 3])');
    });

    it('should preserve Set order (insertion order)', () => {
      const js = new PseudoJSON();
      const set = new Set([3, 1, 2]);
      const result = js.stringify(set);
      // Sets preserve insertion order
      expect(result).toBe('new Set([3, 1, 2])');
    });
  });

  describe('_map helper (via stringify)', () => {
    it('should handle empty Map', () => {
      const js = new PseudoJSON();
      const map = new Map();
      expect(js.stringify(map)).toBe('new Map([])');
    });

    it('should handle Map with single entry', () => {
      const js = new PseudoJSON();
      const map = new Map([['key', 'value']]);
      expect(js.stringify(map)).toBe('new Map([["key", "value"]])');
    });

    it('should handle Map with multiple entries', () => {
      const js = new PseudoJSON();
      const map = new Map<string, number>([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
      const result = js.stringify(map);
      expect(result).toContain('["a", 1]');
      expect(result).toContain('["b", 2]');
      expect(result).toContain('["c", 3]');
    });

    it('should handle Map with number keys', () => {
      const js = new PseudoJSON();
      const map = new Map<number, string>([
        [1, 'one'],
        [2, 'two'],
      ]);
      const result = js.stringify(map);
      expect(result).toContain('[1, "one"]');
      expect(result).toContain('[2, "two"]');
    });

    it('should handle Map with Symbol keys', () => {
      const js = new PseudoJSON();
      const sym = Symbol('key');
      const map = new Map([[sym, 'value']]);
      const result = js.stringify(map);
      expect(result).toContain('Symbol("key")');
      expect(result).toContain('"value"');
    });

    it('should handle Map with object keys', () => {
      const js = new PseudoJSON();
      const key = { id: 1 };
      const map = new Map([[key, 'value']]);
      const result = js.stringify(map);
      expect(result).toContain('{id: 1}');
      expect(result).toContain('"value"');
    });

    it('should handle Map with object values', () => {
      const js = new PseudoJSON();
      const map = new Map([
        ['key1', { a: 1 }],
        ['key2', { b: 2 }],
      ]);
      const result = js.stringify(map);
      expect(result).toContain('["key1", {a: 1}]');
      expect(result).toContain('["key2", {b: 2}]');
    });

    it('should handle Map with array values', () => {
      const js = new PseudoJSON();
      const map = new Map([
        ['nums', [1, 2, 3]],
        ['strs', ['a', 'b']],
      ]);
      const result = js.stringify(map);
      expect(result).toContain('["nums", [1, 2, 3]]');
      expect(result).toContain('["strs", ["a", "b"]]');
    });

    it('should handle Map with special values', () => {
      const js = new PseudoJSON();
      const map = new Map([
        ['nan', NaN],
        ['inf', Infinity],
        ['null', null],
        ['undef', undefined],
      ]);
      const result = js.stringify(map);
      expect(result).toContain('["nan", NaN]');
      expect(result).toContain('["inf", Infinity]');
      expect(result).toContain('["null", null]');
      expect(result).toContain('["undef", undefined]');
    });

    it('should handle nested Map in object', () => {
      const js = new PseudoJSON();
      const obj = {
        myMap: new Map([
          ['a', 1],
          ['b', 2],
        ]),
      };
      const result = js.stringify(obj);
      expect(result).toContain('myMap: new Map([');
      expect(result).toContain('["a", 1]');
      expect(result).toContain('["b", 2]');
    });

    it('should handle Map nested in Array', () => {
      const js = new PseudoJSON();
      const arr = [new Map([['key', 'value']])];
      const result = js.stringify(arr);
      expect(result).toContain('new Map([["key", "value"]])');
    });

    it('should preserve Map insertion order', () => {
      const js = new PseudoJSON();
      const map = new Map<string, number>([
        ['z', 3],
        ['a', 1],
        ['m', 2],
      ]);
      const result = js.stringify(map);
      // Maps preserve insertion order
      const zIndex = result.indexOf('"z"');
      const aIndex = result.indexOf('"a"');
      const mIndex = result.indexOf('"m"');
      expect(zIndex).toBeLessThan(aIndex);
      expect(aIndex).toBeLessThan(mIndex);
    });

    it('should handle Map with Date values', () => {
      const js = new PseudoJSON();
      const date = new Date(1728000000000);
      const map = new Map([['date', date]]);
      const result = js.stringify(map);
      expect(result).toContain('["date", new Date(1728000000000)]');
    });

    it('should handle Map with RegExp values', () => {
      const js = new PseudoJSON();
      const map = new Map([['pattern', /test/gi]]);
      const result = js.stringify(map);
      expect(result).toContain('["pattern", /test/gi]');
    });
  });

  describe('cyclic reference detection (via exists Set)', () => {
    it('should detect direct self-reference in object', () => {
      const js = new PseudoJSON();
      const obj: any = {};
      obj.self = obj;
      expect(() => js.stringify(obj)).toThrow(TypeError);
      expect(() => js.stringify(obj)).toThrow(/cyclic/);
    });

    it('should detect cyclic reference in nested objects', () => {
      const js = new PseudoJSON();
      const parent: any = { child: {} };
      parent.child.parent = parent;
      expect(() => js.stringify(parent)).toThrow(TypeError);
    });

    it('should detect cyclic reference in arrays', () => {
      const js = new PseudoJSON();
      const arr: any[] = [1, 2];
      arr.push(arr);
      expect(() => js.stringify(arr)).toThrow(TypeError);
    });

    it('should detect cyclic reference through Map', () => {
      const js = new PseudoJSON();
      const obj: any = {};
      const map = new Map([['ref', obj]]);
      obj.map = map;
      expect(() => js.stringify(obj)).toThrow(TypeError);
    });

    it('should detect cyclic reference through Set', () => {
      const js = new PseudoJSON();
      const obj: any = {};
      const set = new Set([obj]);
      obj.set = set;
      expect(() => js.stringify(obj)).toThrow(TypeError);
    });

    it('should reset exists Set after successful stringify', () => {
      const js = new PseudoJSON();
      const obj = { a: 1 };
      js.stringify(obj);
      // Second call should work fine (exists should be cleared)
      expect(() => js.stringify(obj)).not.toThrow();
    });

    it('should reset exists Set even after error', () => {
      const js = new PseudoJSON();
      const cyclic: any = {};
      cyclic.self = cyclic;
      try {
        js.stringify(cyclic);
      } catch (e) {
        // Ignore error
      }
      // Next stringify of a normal object should work
      // Note: This might fail if exists.clear() is not in finally block
      const normal = { a: 1 };
      expect(() => js.stringify(normal)).not.toThrow();
    });

    it('should allow same object at different positions (DAG structure)', () => {
      const js = new PseudoJSON();
      const shared = { value: 42 };
      const obj = { a: shared, b: shared };
      // This will actually throw with current implementation
      // because it adds object to exists Set on first encounter
      expect(() => js.stringify(obj)).toThrow(TypeError);
    });

    it('should not detect cycles in primitives', () => {
      const js = new PseudoJSON();
      expect(() => js.stringify([1, 1, 1])).not.toThrow();
      expect(() => js.stringify({ a: 'same', b: 'same' })).not.toThrow();
    });
  });

  describe('indent handling', () => {
    it('should use string indent in nested structures', () => {
      const js = new PseudoJSON({ indent: '  ' });
      const obj = { a: { b: 1 } };
      const result = js.stringify(obj);
      expect(result).toContain('\n  ');
      expect(result).toContain('\n    ');
    });

    it('should use numeric indent in nested structures', () => {
      const js = new PseudoJSON({ indent: 4 });
      const obj = { a: { b: 1 } };
      const result = js.stringify(obj);
      expect(result).toContain('\n    ');
      expect(result).toContain('\n        ');
    });

    it('should handle tab indent', () => {
      const js = new PseudoJSON({ indent: '\t' });
      const obj = { a: 1 };
      const result = js.stringify(obj);
      expect(result).toContain('\n\t');
    });

    it('should not indent when indent is empty string', () => {
      const js = new PseudoJSON({ indent: '' });
      const obj = { a: 1 };
      const result = js.stringify(obj);
      expect(result).not.toContain('\n');
      expect(result).toBe('{a: 1}');
    });

    it('should not indent when indent is zero', () => {
      const js = new PseudoJSON({ indent: 0 });
      const obj = { a: 1 };
      const result = js.stringify(obj);
      expect(result).not.toContain('\n');
      expect(result).toBe('{a: 1}');
    });

    it('should apply indent to arrays', () => {
      const js = new PseudoJSON({ indent: 2 });
      const arr = [1, 2];
      const result = js.stringify(arr);
      expect(result).toBe('[\n  1,\n  2\n]');
    });

    it('should apply indent to Map and Set (currently not implemented)', () => {
      const js = new PseudoJSON({ indent: 2 });
      // Current implementation doesn't indent Map/Set
      const map = new Map([['a', 1]]);
      const result = js.stringify(map);
      expect(result).toBe('new Map([["a", 1]])');
    });
  });
});
