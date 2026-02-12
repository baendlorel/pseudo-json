import { describe, it, expect } from 'vitest';
import { PseudoJSON } from '../src/pseudo-json.js';

describe('PseudoJSON.parse export stripping', () => {
  it('should parse export default with extra whitespace', () => {
    const js = new PseudoJSON();
    const result = js.parse('  export\t\tdefault   { a: 1, b: 2 }');
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should parse export default with array value', () => {
    const js = new PseudoJSON();
    const result = js.parse('\n\t export   default\t [1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse module.exports with equals and spacing', () => {
    const js = new PseudoJSON();
    const result = js.parse('  module   .  exports    =   { name: "app", flag: true }');
    expect(result).toEqual({ name: 'app', flag: true });
  });

  it('should parse module.exports without equals', () => {
    const js = new PseudoJSON();
    const result = js.parse('module.exports   { a: 1 }');
    expect(result).toEqual({ a: 1 });
  });

  it('should parse module.exports with primitive', () => {
    const js = new PseudoJSON();
    const result = js.parse('module\t.\texports\t=\t42');
    expect(result).toBe(42);
  });
});
