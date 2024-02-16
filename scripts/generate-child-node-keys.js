import { writeFile } from 'node:fs/promises';
import { AST_NODES } from './ast-types.js';
import { lintFile } from './helpers.js';

const childNodeKeysFile = new URL('../src/ast/childNodeKeys.ts', import.meta.url);

/** @type {Record<string, Set<string>>} */
const childNodeKeysByAstType = {};
for (const [name, node] of Object.entries(AST_NODES)) {
	const astType = node.astType || name;
	const keySet = (childNodeKeysByAstType[astType] ||= new Set());
	for (const [fieldName, fieldType] of (node.hasSameFieldsAs
		? AST_NODES[node.hasSameFieldsAs].fields
		: node.fields) || []) {
		if (['NodeList', 'Node', 'OptionalNode'].includes(fieldType)) {
			keySet.add(fieldName);
		}
	}
}

const childNodeKeys = `// This file is generated by scripts/generate-ast-converters.js.
// Do not edit this file directly.

export const childNodeKeys: Record<string, string[]> = {
  ${Object.entries(childNodeKeysByAstType)
		.sort(([astType1], [astType2]) => astType1.localeCompare(astType2))
		.map(([astType, keys]) => `${astType}: [${[...keys].map(key => `'${key}'`).join(', ')}]`)
		.join(',\n  ')}
};
`;

await writeFile(childNodeKeysFile, childNodeKeys);
await lintFile(childNodeKeysFile);
