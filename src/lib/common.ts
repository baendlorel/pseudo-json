export function $stringifySymbol(value: symbol): string {
  if (!Symbol.keyFor(value)) {
    return `Symbol.for(${JSON.stringify(value.description)})`;
  }

  if (value.description === undefined) {
    return 'Symbol()';
  } else {
    return `Symbol(${JSON.stringify(value.description)})`;
  }
}
