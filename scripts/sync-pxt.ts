#!/usr/bin/env node
// Run with: bun scripts/sync-pxt.ts
//           npx tsx scripts/sync-pxt.ts

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function scanTs(dir: string): string[] {
    const results: string[] = [];
    try {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            if (statSync(full).isDirectory()) {
                results.push(...scanTs(full));
            } else if (entry.endsWith('.ts')) {
                results.push(relative(ROOT, full).replace(/\\/g, '/'));
            }
        }
    } catch {
        // directory doesn't exist — skip silently
    }
    return results.sort();
}

const pxtPath = join(ROOT, 'pxt.json');
const pxt = JSON.parse(readFileSync(pxtPath, 'utf-8'));

const srcFiles = scanTs(join(ROOT, 'src'));
const testFiles = scanTs(join(ROOT, 'test'));

// Preserve non-.ts entries already in files (e.g. README.md)
const staticFiles: string[] = (pxt.files as string[]).filter((f: string) => !f.endsWith('.ts'));
const newFiles = [...srcFiles, ...staticFiles];
const newTestFiles = testFiles;

// Diff for reporting
const oldAll: string[] = [...(pxt.files ?? []), ...(pxt.testFiles ?? [])];
const newAll: string[] = [...newFiles, ...newTestFiles];
const added = newAll.filter(f => !oldAll.includes(f));
const removed = oldAll.filter(f => !newAll.includes(f));

pxt.files = newFiles;
pxt.testFiles = newTestFiles;

writeFileSync(pxtPath, JSON.stringify(pxt, null, 4) + '\n');

if (added.length === 0 && removed.length === 0) {
    console.log('pxt.json already up to date.');
} else {
    added.forEach(f => console.log(`  + ${f}`));
    removed.forEach(f => console.log(`  - ${f}`));
    console.log('\npxt.json updated.');
}
