# PseudoJSON 📝

[![npm version](https://img.shields.io/npm/v/pseudo-json.svg)](https://www.npmjs.com/package/pseudo-json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 Write more flexible configuration files with JavaScript syntax. Synchronously load configs without `import()`.

This library is better suited for Node.js usage, especially when you want to load configs synchronously.

JSON is too simple and restrictive. **pseudo-json** lets you serialize and parse JavaScript objects exactly as they appear in JS files—with support for `Symbol`, `Map`, `Set`, `Date`, `RegExp`, `NaN`, `Infinity`, and more.

For more awesome packages, check out [my homepage 💛](https://baendlorel.github.io/?repoType=npm)

## 📦 Installation

```bash
npm install pseudo-json
# or
pnpm add pseudo-json
```

## 🔥 Quick Start

```typescript
import { PseudoJSON } from 'pseudo-json';

const js = new PseudoJSON({ indent: 2 });

// Stringify: JavaScript object → string
const config = {
  name: 'my-app',
  version: '1.0.0',
  timeout: Infinity,
  retries: NaN,
  createdAt: new Date(),
  pattern: /\.ts$/,
  secret: Symbol('api-key'),
  cache: new Map([['key', 'value']]),
  tags: new Set(['prod', 'v1']),
};

const code = js.stringify(config);
// Output: JavaScript literal syntax, not JSON!

// Parse: string → JavaScript object
const parsed = js.parse(code);
// All types preserved! Map is Map, Date is Date, Symbol is Symbol
```

## 📖 API

### `new PseudoJSON(options?)`

Create a new instance with optional formatting.

```typescript
const js = new PseudoJSON({
  indent: 2, // number or string, default: no indent
});
```

### `stringify(value: unknown): string`

Convert a JavaScript value to its literal string representation.

Note: `stringify` only captures the current value and cannot preserve runtime computation logic.

```typescript
js.stringify({ a: 1, b: NaN });
// → "{a: 1, b: NaN}"

js.stringify([1, 2, Symbol('key')]);
// → "[1, 2, Symbol(\"key\")]"
```

### `parse(code: string): any`

Parse a string back into a JavaScript value.

```typescript
js.parse('{ a: 1, b: NaN }');
// → { a: 1, b: NaN }

js.parse('new Map([["key", "value"]])');
// → Map { 'key' => 'value' }
```

> Note: `parse` executes the input via the Function constructor and does NOT support `import` statements. Only pass trusted code and avoid module imports in strings you feed to `parse`.

### `generateExportModule(data: unknown): string`

Generate a complete ES module with `export default`.

```typescript
js.generateExportModule({ config: 'value' });
// → "export default {config: \"value\"}\n"
```

## ⚠️ Limitations

**⚠️ Simple Use Cases Only**: This library is designed for **configuration files and simple data structures**.

**🚫 Not Recommended**:

- ❌ Objects with circular references (will cause stack overflow)
- ❌ Deeply nested structures (performance may degrade)
- ❌ Untrusted input (parse something not exported by this library)
- ❌ DAG structures (same object referenced multiple times)

**✅ Best For**:

- ✅ Configuration files
- ✅ Static data with rich types
- ✅ Small to medium-sized objects
- ✅ Trusted input only

## 📄 License

MIT © [Kasukabe Tsumugi](https://github.com/baendlorel)
