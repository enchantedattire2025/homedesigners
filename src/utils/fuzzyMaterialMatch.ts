export interface FuzzyMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  base_price: number;
  discount_price?: number | null;
  is_discounted?: boolean;
}

export interface FuzzyMatch {
  material: FuzzyMaterial;
  score: number;
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\u0900-\u097f ]/g, '').trim();
}

function tokenise(text: string): string[] {
  return normalise(text).split(/\s+/).filter(Boolean);
}

function commonChars(a: string, b: string): number {
  const setA = new Set(a.split(''));
  let count = 0;
  for (const ch of b) {
    if (setA.has(ch)) count++;
  }
  return count;
}

function score(query: string, candidate: string): number {
  const q = normalise(query);
  const c = normalise(candidate);

  if (!q || !c) return 0;

  // Exact match
  if (q === c) return 1;

  // Starts-with bonus
  let s = 0;
  if (c.startsWith(q) || q.startsWith(c)) s += 0.5;

  // Contains bonus
  if (c.includes(q) || q.includes(c)) s += 0.4;

  // Token overlap
  const qTokens = tokenise(query);
  const cTokens = tokenise(candidate);
  let tokenMatches = 0;
  for (const qt of qTokens) {
    if (cTokens.some(ct => ct.includes(qt) || qt.includes(ct))) tokenMatches++;
  }
  s += (tokenMatches / Math.max(qTokens.length, 1)) * 0.3;

  // Character overlap ratio
  const charOverlap = commonChars(q, c) / Math.max(q.length, c.length);
  s += charOverlap * 0.2;

  return Math.min(s, 1);
}

export function fuzzyMaterialMatch(query: string, materials: FuzzyMaterial[], limit = 5): FuzzyMatch[] {
  if (!query.trim() || materials.length === 0) return [];

  const scored = materials.map(m => ({
    material: m,
    score: Math.max(
      score(query, m.name),
      score(query, m.category) * 0.6,
    ),
  }));

  return scored
    .filter(m => m.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function bestMaterialMatch(query: string, materials: FuzzyMaterial[], threshold = 0.55): FuzzyMaterial | null {
  const results = fuzzyMaterialMatch(query, materials, 1);
  if (results.length > 0 && results[0].score >= threshold) {
    return results[0].material;
  }
  return null;
}
