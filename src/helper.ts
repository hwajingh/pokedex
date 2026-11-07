import { PokemonType } from "./App";

export const getTypeString = (types: PokemonType["types"]) => {
  return types.map((t) => makeUpper(t.type.name)).join(", ");
};

export const makeUpper = (name: string) => {
  return name.charAt(0).toUpperCase() + name.slice(1);
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
