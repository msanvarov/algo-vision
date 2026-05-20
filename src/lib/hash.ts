/** FNV-1a 32-bit. Fast, decent distribution, fine for visualization. */
export function fnv1a(input: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** MurmurHash3 32-bit. Better avalanche than FNV; used to build "different" hash functions from one input. */
export function murmur3(input: string, seed = 0): number {
  let h = seed >>> 0;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let i = 0;
  const blocks = input.length & ~3;

  while (i < blocks) {
    let k =
      (input.charCodeAt(i) & 0xff) |
      ((input.charCodeAt(i + 1) & 0xff) << 8) |
      ((input.charCodeAt(i + 2) & 0xff) << 16) |
      ((input.charCodeAt(i + 3) & 0xff) << 24);
    i += 4;

    k = Math.imul(k, c1);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, c2);

    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) | 0;
  }

  let tail = 0;
  const rem = input.length & 3;
  if (rem === 3) tail ^= (input.charCodeAt(i + 2) & 0xff) << 16;
  if (rem >= 2) tail ^= (input.charCodeAt(i + 1) & 0xff) << 8;
  if (rem >= 1) {
    tail ^= input.charCodeAt(i) & 0xff;
    tail = Math.imul(tail, c1);
    tail = (tail << 15) | (tail >>> 17);
    tail = Math.imul(tail, c2);
    h ^= tail;
  }

  h ^= input.length;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Cheap way to derive k hash functions: h_i(x) = h1(x) + i * h2(x) (double hashing). */
export function kHashes(input: string, k: number, modulo: number): number[] {
  const h1 = murmur3(input, 0x9747b28c);
  const h2 = fnv1a(input);
  const out: number[] = [];
  for (let i = 0; i < k; i++) {
    out.push((h1 + i * h2) % modulo);
  }
  return out;
}

/** Count leading zeros in the low `bits` bits of n. Used by HyperLogLog. */
export function leadingZeros(n: number, bits: number): number {
  if (n === 0) return bits + 1;
  let count = 1;
  let mask = 1 << (bits - 1);
  while ((n & mask) === 0 && mask > 0) {
    count++;
    mask >>>= 1;
  }
  return count;
}
