# PseudoJSON 代码评估报告

## 总体评价

`PseudoJSON` 类的设计整体清晰，功能完整，代码结构合理。通过 `native.ts` 抽离了底层 API 引用，有利于维护和潜在的 polyfill 替换。

---

## 发现的问题

### 1. **循环引用检测逻辑不完整**

**位置**: `_stringify` 方法，第 80-84 行

**问题描述**:

- 当对象类型为 `object` 时才添加到 `exists` Set 中进行循环检测
- 但是 `Map` 和 `Set` 实例会在类型检测之前就被添加到 `exists`
- 问题：如果 `Map/Set` 内部包含循环引用，检测可能不够完整
- 更严重的是：`Array` 在 `case 'object'` 之后才处理，但 `exists.add(value)` 在前面就执行了，这导致所有对象（包括 Date、RegExp）都会被加入检测集合

**建议**:

```typescript
// 应该只对可能包含循环引用的容器类型（Object, Array, Map, Set）进行检测
// Date, RegExp 等不可能有循环引用，不应加入 exists
if (typeof value === 'object') {
  // 先判断是否是不可变类型
  if (value instanceof Date || value instanceof RegExp) {
    // 处理 Date/RegExp，不需要循环检测
  } else if (this.exists.has(value)) {
    throw new TypeError('cyclic object value');
  } else {
    this.exists.add(value);
  }
}
```

---

### 2. **`stringify` 公共方法中的 `currentIndent` 参数暴露问题**

**位置**: `stringify` 方法签名，第 153 行

**问题描述**:

- 公共 API `stringify` 接受 `currentIndent` 参数，但这是一个内部实现细节
- 用户可能误传该参数导致输出格式混乱
- 文档说明这是 "internal use"，但方法本身是公共的

**建议**:

- 要么移除该参数（推荐）：`stringify(value: unknown): string`
- 要么明确标记为私有内部方法，公开一个不带 `currentIndent` 的包装方法

---

### 3. **`_symbol` 方法的逻辑错误**

**位置**: `_symbol` 方法，第 37-45 行

**问题描述**:

```typescript
if (!Symbol.keyFor(value)) {
  return `Symbol.for(${JSON.stringify(value.description)})`;
}
```

**逻辑完全错误**: `Symbol.keyFor()` 返回字符串或 `undefined`。当前代码：

- 如果返回 `undefined`（局部 symbol），却生成 `Symbol.for(...)`
- 如果返回字符串（全局 symbol），却生成 `Symbol(...)`

这正好反了！

**正确逻辑应该是**:

```typescript
const key = Symbol.keyFor(value);
if (key !== undefined) {
  // 这是全局 symbol，使用 Symbol.for
  return `Symbol.for(${JSON.stringify(key)})`;
} else {
  // 这是局部 symbol，使用 Symbol()
  if (value.description === undefined) {
    return 'Symbol()';
  } else {
    return `Symbol(${JSON.stringify(value.description)})`;
  }
}
```

**当前代码会导致**:

- 局部 `Symbol('test')` 被错误地序列化为 `Symbol.for("test")`
- 全局 `Symbol.for('test')` 被错误地序列化为 `Symbol("test")`
- parse 后会得到完全不同的对象类型

**测试结果**: 所有 Symbol 相关测试失败（局部和全局 Symbol 完全反了）

---

### 4. **循环引用检测完全失效**

**位置**: `_stringify` 方法

**严重问题**:

1. **检测逻辑位置错误**: 在数组处理之前就添加到 `exists`，但数组元素递归时调用的是 `this.stringify()` 而非 `this._stringify()`
2. **`this.stringify()` 在每次调用后清空 `exists`**: 第 112 行调用 `this.stringify(item, nextIndent)` 导致每个数组元素处理完后 `exists` 被清空
3. **同样问题在对象处理中**: 第 131 行也调用了 `this.stringify(val, nextIndent)`

**结果**:

- 循环引用检测完全失效
- 导致栈溢出（RangeError: Maximum call stack size exceeded）而不是预期的 TypeError

**测试结果**: 所有循环引用测试失败，抛出 `RangeError` 而非 `TypeError`

**正确修复**:

```typescript
// 在数组处理中（第 112 行）
const items = value.map((item) => this._stringify(item, nextIndent));

// 在对象处理中（第 131 行）
const valueStr = this._stringify(val, nextIndent);
```

---

### 5. **`parse` 方法无法解析对象字面量**

**位置**: `parse` 方法，第 170 行

**问题描述**:
当前实现：

```typescript
return Function(`"use strict"; ${code.replace(/[\s]+export default[\s]+/, 'return ')}`)();
```

这无法解析 `{a: 1, b: 2}` 这样的对象字面量，因为：

- JavaScript 中 `{a: 1}` 被解析为语句块而不是对象
- 需要用括号包裹：`({a: 1})`
- 或者使用 `return {a: 1}`

**测试结果**: 大量 parse 测试失败，抛出 `SyntaxError: Unexpected token ':'`

**建议修复**:

```typescript
parse(code: string): any {
  const cleaned = code.replace(/[\s]+export default[\s]+/, '');
  // 如果以 { 开头且不是 {[ 或其他明确的语法，包裹括号
  if (cleaned.trim().startsWith('{') && !cleaned.trim().startsWith('{[')) {
    return Function(`"use strict"; return (${cleaned})`)();
  }
  return Function(`"use strict"; return ${cleaned}`)();
}
```

或更简单的方案（但可能有边界情况）:

```typescript
parse(code: string): any {
  const cleaned = code.replace(/[\s]+export default[\s]+/, '');
  try {
    return Function(`"use strict"; return (${cleaned})`)();
  } catch {
    return Function(`"use strict"; return ${cleaned})`)();
  }
}
```

---

### 6. **`stringify` 方法也会调用数组/对象处理导致循环检测失效**

### 7. **`exists.clear()` 缺少异常安全保障**

**问题描述**:

- 如果 `_stringify` 抛出异常（如循环引用），`exists.clear()` 不会执行
- 这会导致下一次调用 `stringify` 时，`exists` Set 中仍然残留上次的对象
- 可能导致误判或内存泄漏

**建议**:
使用 `try...finally` 确保清理：

```typescript
stringify(value: unknown, currentIndent = ''): string {
  try {
    return this._stringify(value, currentIndent);
  } finally {
    this.exists.clear();
  }
}
```

---

## 代码风格建议

### 2. **类型标注**

- `parse` 方法返回 `any`，可以考虑使用泛型 `parse<T = any>(code: string): T`
- `$get` 的 `key as any` 类型断言不够安全，可以改进类型定义

---

## 功能完整性评估

### 已支持的类型

✅ 基本类型: `null`, `undefined`, `string`, `number`, `boolean`, `symbol`
✅ 特殊数值: `NaN`, `Infinity`, `-Infinity`
✅ 对象类型: `Object`, `Array`, `Date`, `RegExp`, `Map`, `Set`
✅ 函数: `Function`

### 未支持但可能需要的类型

❌ `BigInt`: 当前未处理，会作为 `object` 类型走默认逻辑（可能报错）
❌ `TypedArray`: `Uint8Array`, `Int32Array` 等
❌ `ArrayBuffer`, `DataView`
❌ `Error` 对象: 会丢失 `message` 和 `stack`
❌ `Promise`: 无法序列化异步对象
❌ `WeakMap`, `WeakSet`: 不可枚举，理论上无法序列化

**建议**: 为 `BigInt` 添加支持，至少应该抛出友好的错误信息而不是崩溃。

---

## 安全性问题

### 1. **`parse` 方法使用 `Function` 构造器**

**风险**:

- 类似 `eval`，可以执行任意代码
- 如果 `code` 来自不可信来源，存在代码注入风险

**建议**:

- 在文档中明确警告不要解析不可信的代码
- 或者考虑使用 AST 解析器（如 `@babel/parser`）进行安全解析（会增加依赖）

### 2. **没有对输入大小做限制**

超大对象可能导致：

- 栈溢出（深度嵌套）
- 内存耗尽
- 执行时间过长（DoS）

**建议**: 添加可选的深度限制或大小限制配置。

---

## 测试覆盖建议

需要测试的场景：

1. ✅ 基本类型序列化和反序列化
2. ✅ 特殊数值（NaN, Infinity）
3. ✅ Symbol（局部 vs 全局，有无 description）
4. ✅ 循环引用检测
5. ✅ 嵌套对象、数组
6. ✅ Map 和 Set
7. ✅ 带缩进和不带缩进的格式化
8. ⚠️ BigInt（应该测试其行为或明确不支持）
9. ✅ 边界情况：空对象、空数组、空 Map/Set
10. ✅ Function 序列化

---

## 测试执行总结

已编写三个完整的测试套件：

1. **tests/stringify.test.ts** - 测试 stringify 方法（69 个测试用例）
2. **tests/parse.test.ts** - 测试 parse 方法（48 个测试用例）
3. **tests/helpers.test.ts** - 测试辅助方法 \_symbol, \_set, \_map 等（33 个测试用例）

**测试结果**: 共 150 个测试，**67 个失败，83 个通过**

### 主要失败原因

1. **Symbol 序列化逻辑完全错误** - 导致约 10 个测试失败
2. **循环引用检测失效** - 导致约 7 个测试失败（栈溢出）
3. **parse 方法无法解析对象字面量** - 导致约 30 个测试失败
4. **round-trip（往返）测试失败** - 因为上述问题的组合

### 通过的测试

- 基本类型（string, number, boolean, null, undefined）
- 特殊数值（部分，stringify 可以但 parse 不行）
- Date 和 RegExp 的 stringify
- 数组和对象的 stringify（无循环引用）
- Map 和 Set 的 stringify
- 缩进功能

---

## 总体评分

| 维度           | 评分 | 说明                                          |
| -------------- | ---- | --------------------------------------------- |
| **功能完整性** | 6/10 | 支持多种类型但有严重 bug                      |
| **代码正确性** | 3/10 | 核心逻辑（Symbol、循环检测、parse）有严重错误 |
| **代码质量**   | 7/10 | 结构清晰，但方法调用混乱                      |
| **测试覆盖**   | 8/10 | 现在有完整测试套件                            |
| **安全性**     | 4/10 | parse 使用 Function 构造器，存在代码注入风险  |
| **性能**       | 6/10 | 循环检测设计有问题，可能误判                  |
| **可维护性**   | 7/10 | 代码可读性好，但需要重构                      |

**综合评分**: **5.5/10** （有潜力但目前有严重bug）

---

### 必须修复的严重问题

1. **`_symbol` 方法的逻辑完全错误**（高优先级）
2. **数组/对象序列化时调用了错误的方法**（导致循环检测失效）
3. **`exists.clear()` 缺少异常处理**

### 建议优化

1. 改进循环引用检测的精确性
2. 公共 API 设计（`stringify` 的参数）
3. 添加 BigInt 支持或明确错误提示
4. 安全性文档和警告

### 代码质量

- 整体结构清晰，代码可读性好
- 使用 TypeScript 类型标注较好
- 抽离 `native.ts` 的设计合理

---

## 优先级排序

**P0 - 必须立即修复（功能错误）**:

1. `_symbol` 逻辑错误
2. 数组/对象序列化调用 `stringify` 而非 `_stringify`

**P1 - 高优先级（影响稳定性）**: 3. `exists.clear()` 异常安全 4. 循环引用检测优化

**P2 - 中优先级（改进设计）**: 5. 公共 API 参数设计 6. BigInt 支持

**P3 - 低优先级（锦上添花）**: 7. 性能优化（Symbol 缓存）8. 安全性文档
