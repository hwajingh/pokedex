import { PokemonType } from "./App";

export const getTypeString = (types: PokemonType["types"]) => {
  return types.map((t) => makeUpper(t.type.name)).join(", ");
};

export const makeUpper = (name: string) => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// Edit distance between two strings: the smallest number of single-letter
// insertions, deletions, and substitutions that turns one into the other.
export const levenshtein = (a: string, b: string) => {
  const rows = b.length + 1;
  const cols = a.length + 1;
  const grid: number[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (r === 0 ? c : c === 0 ? r : 0))
  );
  for (let r = 1; r < rows; r += 1) {
    for (let c = 1; c < cols; c += 1) {
      const cost = a[c - 1] === b[r - 1] ? 0 : 1;
      grid[r][c] = Math.min(
        grid[r - 1][c] + 1,
        grid[r][c - 1] + 1,
        grid[r - 1][c - 1] + cost
      );
    }
  }
  return grid[b.length][a.length];
};

// The closest real name to a mistyped query, for "Did you mean …?".
// Two edits cover a swapped or missing letter ("charazard", "squirtel");
// anything further away is a different word, not a typo. Exact matches
// return null — they are already answered by the prefix dropdown.
export const closestPokemonName = (
  names: string[],
  query: string,
  maxDistance = 2
) => {
  const q = query.trim().toLowerCase();
  if (q.length < 3) {
    return null;
  }
  let best: string | null = null;
  let bestDistance = maxDistance + 1;
  for (const name of names) {
    const distance = levenshtein(q, name);
    if (distance > 0 && distance < bestDistance) {
      best = name;
      bestDistance = distance;
    }
  }
  return best;
};

// Prefix match for the search dropdown, alphabetical like a catalog
// listing, capped so the list stays short.
export const filterPokemonNames = (
  names: string[],
  query: string,
  limit: number
) => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  return names
    .filter((name) => name.startsWith(q))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, limit);
};
