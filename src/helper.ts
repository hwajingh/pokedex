import { PokemonType } from "./App";

export const getTypeString = (types: PokemonType["types"]) => {
  let names = "";
  let i = 0;
  while (i < types.length) {
    names = names + " " + makeUpper(types[i].type.name) + ",";
    i += 1;
  }
  return names;
};

export const makeUpper = (name: string) => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};
