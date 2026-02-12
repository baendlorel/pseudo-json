import { describe, it, expect } from 'vitest';
import { PseudoJSON } from '../src/pseudo-json.js';

describe('PseudoJSON.parse complex scenarios', () => {
  it('should parse a complex module with logic and rich types', () => {
    const js = new PseudoJSON();
    const code = [
      'const base = 10;',
      'const make = (n) => ({ n, list: [n, n + 1], inner: { ok: true } });',
      'const now = new Date(1728000000000);',
      'const exp = /ab+c/gi;',
      'const map = new Map([["a", 1], [2, "b"], ["c", 3]]);',
      'const set = new Set([1, "x", true, null]);',
      'const data = {',
      '  str: "hello",',
      '  num: base + 2,',
      '  bool: base > 5,',
      '  nil: null,',
      '  undef: undefined,',
      '  nan: NaN,',
      '  inf: Infinity,',
      '  ninf: -Infinity,',
      '  arr: [1, { deep: make(3) }, [4, 5]],',
      '  obj: { a: make(1), b: make(2) },',
      '  date: now,',
      '  regex: exp,',
      '  map,',
      '  set',
      '};',
      'export default data',
    ].join('\n');

    const result = js.parse(code);

    const expected = {
      str: 'hello',
      num: 12,
      bool: true,
      nil: null,
      undef: undefined,
      nan: NaN,
      inf: Infinity,
      ninf: -Infinity,
      arr: [1, { deep: { n: 3, list: [3, 4], inner: { ok: true } } }, [4, 5]],
      obj: {
        a: { n: 1, list: [1, 2], inner: { ok: true } },
        b: { n: 2, list: [2, 3], inner: { ok: true } },
      },
      date: new Date(1728000000000),
      regex: /ab+c/gi,
      map: new Map([
        ['a', 1],
        [2, 'b'],
        ['c', 3],
      ]),
      set: new Set([1, 'x', true, null]),
    };

    expect(result).toEqual(expected);
  });
});
