import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function assertSourceMaps(dist) {
  let checked = 0;
  for (const file of readdirSync(dist, { recursive: true })) {
    if (file.endsWith('.d.ts.map')) {
      throw new Error('Declaration maps point to unshipped source');
    }
    if (file.endsWith('.js.map')) {
      const map = JSON.parse(readFileSync(join(dist, file), 'utf8'));
      if (!map.sourcesContent?.length || map.sources.some((source) => source.startsWith('/'))) {
        throw new Error('Source maps must embed source and use relative paths');
      }
      checked += 1;
    }
  }
  return checked;
}
