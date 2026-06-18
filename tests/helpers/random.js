export function seededRandom(seed = 1) {
  let value = Number(seed) >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

export function withRandom(randomFn, callback) {
  const original = Math.random;
  Math.random = randomFn;
  try {
    return callback();
  } finally {
    Math.random = original;
  }
}
