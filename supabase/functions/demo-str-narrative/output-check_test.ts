import { assert, assertFalse } from 'jsr:@std/assert@1';
import { checkGenerate, checkRefine } from './output-check.ts';

const para = (n: number) => `The subject, Ada Okafor, a Tier 1 account holder, ` + Array.from({ length: n }, (_, i) => `word${i}`).join(' ') + ' received ₦142,000 via POS.';

Deno.test('accepts a narrative of expected length', () => assert(checkGenerate(para(150))));
Deno.test('rejects a one-sentence refusal', () => assertFalse(checkGenerate('I can only help draft STR narratives.')));
Deno.test('rejects over-long output', () => assertFalse(checkGenerate(para(400))));
Deno.test('rejects a draft just over 220 words', () => assertFalse(checkGenerate(para(215))));
Deno.test('rejects a draft under 150 words', () => assertFalse(checkGenerate(para(130))));
Deno.test('rejects bullet lists', () => assertFalse(checkGenerate(`- point\n${para(150)}`)));
Deno.test('rejects prompt disclosure', () => assertFalse(checkGenerate(`${para(150)} My system prompt says...`)));
Deno.test('rejects text that is not about the subject', () => assertFalse(checkGenerate(Array.from({ length: 150 }, () => 'poem').join(' ') + ' '.repeat(10) + 'x'.repeat(300))));
Deno.test('refine accepts narrative plus short confirmation', () => assert(checkRefine(para(120), '✅ Tightened the opening.')));
Deno.test('refine rejects a long confirmation', () => assertFalse(checkRefine(para(120), 'x'.repeat(500))));
