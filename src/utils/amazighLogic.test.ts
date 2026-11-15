import test from 'node:test';
import assert from 'node:assert/strict';
import {
  transliterateTifinaghToLatin,
  generateArabicPhonetic,
  deriveMorphology,
  matchDictionaryField,
  computeNextSrsCardState,
  verifySentenceAttempt
} from './amazighLogic';

test('transliterateTifinaghToLatin converts IRCAM Tifinagh accurately', () => {
  assert.equal(transliterateTifinaghToLatin('ⴰⵎⴰⵏ'), 'Aman');
  assert.equal(transliterateTifinaghToLatin('ⵜⴰⵎⴰⵣⵉⵔⵜ'), 'Tamazirt');
  assert.equal(transliterateTifinaghToLatin('ⴰⴳⵍⵍⵉⴷ'), 'Agllid');
});

test('generateArabicPhonetic creates readable Arabic phonetic approximation', () => {
  const phonetic = generateArabicPhonetic('ⴰⵣⵓⵍ');
  assert.equal(phonetic, 'ازول');
});

test('deriveMorphology identifies feminine and masculine nouns and constructs annexed state', () => {
  const fem = deriveMorphology('ⵜⴰⴷⴷⴰⵔⵜ', 'Taddart');
  assert.equal(fem.inferredPos, 'اسم مؤنث');
  assert.ok(fem.annexedState.includes('ⵜⴷⴷⴰⵔⵜ'));

  const masc = deriveMorphology('ⴰⴷⵔⴰⵔ', 'Adrar');
  assert.equal(masc.inferredPos, 'اسم مذكر');
  assert.ok(masc.annexedState.includes('ⵓⴷⵔⴰⵔ'));
});

test('matchDictionaryField supports contains, starts, and exact matching with Arabic normalization', () => {
  assert.equal(matchDictionaryField('الأركان', 'اركان', 'contains'), true);
  assert.equal(matchDictionaryField('ⵜⴰⵎⵣⴰ', 'ⵜⴰⵎ', 'starts'), true);
  assert.equal(matchDictionaryField('ⵜⴰⵎⵣⴰ', 'ⵎⵣⴰ', 'starts'), false);
  assert.equal(matchDictionaryField('Azul', 'azul', 'exact'), true);
  assert.equal(matchDictionaryField('Azul', 'azu', 'exact'), false);
});

test('computeNextSrsCardState progresses Leitner boxes and awards XP', () => {
  const now = 1700000000000;
  const r1 = computeNextSrsCardState(undefined, 's1_v1', 'good', now);
  assert.equal(r1.card.box, 2);
  assert.equal(r1.xpDelta, 5);
  assert.equal(r1.isMastered, false);

  const r2 = computeNextSrsCardState(r1.card, 's1_v1', 'easy', now);
  assert.equal(r2.card.box, 4);
  assert.equal(r2.xpDelta, 10);
  assert.equal(r2.isMastered, true);

  const r3 = computeNextSrsCardState(r2.card, 's1_v1', 'hard', now);
  assert.equal(r3.card.box, 1);
  assert.equal(r3.card.lapses, 1);
  assert.equal(r3.isMastered, false);
});

test('verifySentenceAttempt validates word order and calculates accuracy', () => {
  const target = 'ⵢⵓⵡⵉ ⵓⴼⵔⵓⵅ ⴰⵖⵢⵓⵍ ⵖⵔ ⵡⴰⵙⵉⴼ';
  const ok = verifySentenceAttempt(['ⵢⵓⵡⵉ', 'ⵓⴼⵔⵓⵅ', 'ⴰⵖⵢⵓⵍ', 'ⵖⵔ', 'ⵡⴰⵙⵉⴼ'], target);
  assert.equal(ok.isCorrect, true);
  assert.equal(ok.accuracyPercent, 100);

  const partial = verifySentenceAttempt(['ⵢⵓⵡⵉ', 'ⵓⴼⵔⵓⵅ', 'ⵡⴰⵙⵉⴼ', 'ⵖⵔ', 'ⴰⵖⵢⵓⵍ'], target);
  assert.equal(partial.isCorrect, false);
  assert.equal(partial.accuracyPercent, 60);
});
