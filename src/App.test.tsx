import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import axios from 'axios';
import App from './App';
import {
  filterPokemonNames,
  getTypeString,
  levenshtein,
  closestPokemonName,
} from './helper';

// The app fetches PokeAPI on mount (one Pokémon plus the full name
// list); mock axios so tests never touch the network. axios 0.27's
// automock does not reliably provide a working .get, so assign the
// mock directly and route by URL (same pattern as Wordle).
const BULBASAUR = {
  id: 1,
  name: 'bulbasaur',
  sprites: { front_default: 'https://example.test/bulbasaur.png' },
  types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
  height: 7,
  weight: 69,
};
const CHARMANDER = {
  id: 4,
  name: 'charmander',
  sprites: { front_default: 'https://example.test/charmander.png' },
  types: [{ type: { name: 'fire' } }],
  height: 6,
  weight: 85,
};
const CHARIZARD = {
  id: 6,
  name: 'charizard',
  sprites: { front_default: 'https://example.test/charizard.png' },
  types: [{ type: { name: 'fire' } }, { type: { name: 'flying' } }],
  height: 17,
  weight: 905,
};
const NAME_LIST = {
  results: [
    { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
    { name: 'blastoise', url: 'https://pokeapi.co/api/v2/pokemon/9/' },
    { name: 'butterfree', url: 'https://pokeapi.co/api/v2/pokemon/12/' },
    { name: 'beedrill', url: 'https://pokeapi.co/api/v2/pokemon/15/' },
    { name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/' },
    { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
  ],
};

function mockAxios() {
  (axios as unknown as { get: unknown }).get = jest.fn((url: string) => {
    if (url.includes('pokemon?limit=')) {
      return Promise.resolve({ data: NAME_LIST });
    }
    if (url.endsWith('/pokemon/1')) {
      return Promise.resolve({ data: BULBASAUR });
    }
    if (url.endsWith('/pokemon/4') || url.endsWith('/pokemon/charmander')) {
      return Promise.resolve({ data: CHARMANDER });
    }
    if (url.endsWith('/pokemon/6') || url.endsWith('/pokemon/charizard')) {
      return Promise.resolve({ data: CHARIZARD });
    }
    return Promise.reject({ response: { status: 404 } });
  });
}

async function typeQuery(query: string) {
  fireEvent.change(screen.getByLabelText(/Pokemon Name/i), {
    target: { value: query },
  });
}

test('renders the search UI and footer', async () => {
  mockAxios();
  render(<App />);
  // Let the mount fetches settle before asserting.
  await screen.findByText('Bulbasaur');
  expect(screen.getByLabelText(/Pokemon Name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  expect(screen.getByText(/Made by Tiger Hong/i)).toBeInTheDocument();
});

test('types render without a trailing comma', async () => {
  mockAxios();
  render(<App />);
  expect(await screen.findByText('Grass, Poison')).toBeInTheDocument();
  expect(screen.queryByText(/Grass, Poison,/)).not.toBeInTheDocument();
});

test('typing a letter shows matching Pokémon alphabetically', async () => {
  mockAxios();
  render(<App />);
  await screen.findByText('Bulbasaur');
  await typeQuery('b');
  const options = await screen.findAllByRole('option');
  expect(options.map((option) => option.textContent)).toEqual([
    'Beedrill',
    'Blastoise',
    'Bulbasaur',
    'Butterfree',
  ]);
  expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
});

test('a typo offers a "Did you mean" row, not an error banner', async () => {
  mockAxios();
  render(<App />);
  await screen.findByText('Bulbasaur');
  await typeQuery('charazard');
  expect(
    await screen.findByRole('option', { name: 'Did you mean "Charizard"?' })
  ).toBeInTheDocument();
  expect(screen.queryByText(/Could not find/)).not.toBeInTheDocument();
  expect(screen.queryByText(/No Pokémon match/)).not.toBeInTheDocument();
});

test('clicking the "Did you mean" row loads that Pokémon', async () => {
  mockAxios();
  render(<App />);
  await screen.findByText('Bulbasaur');
  await typeQuery('charazard');
  const option = await screen.findByRole('option', {
    name: 'Did you mean "Charizard"?',
  });
  fireEvent.mouseDown(option);
  expect(await screen.findByText('Fire, Flying')).toBeInTheDocument();
});

test('clicking a suggestion loads that Pokémon', async () => {
  mockAxios();
  render(<App />);
  await screen.findByText('Bulbasaur');
  await typeQuery('char');
  const option = await screen.findByRole('option', { name: 'Charizard' });
  fireEvent.mouseDown(option);
  expect(await screen.findByText('Fire, Flying')).toBeInTheDocument();
});

test('Search with a partial name loads the first suggestion', async () => {
  mockAxios();
  render(<App />);
  await screen.findByText('Bulbasaur');
  await typeQuery('charm');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));
  expect(await screen.findByText('Charmander')).toBeInTheDocument();
});

test('Search with a typo loads the "Did you mean" correction', async () => {
  mockAxios();
  render(<App />);
  await screen.findByText('Bulbasaur');
  await typeQuery('charazard');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));
  expect(await screen.findByText('Fire, Flying')).toBeInTheDocument();
});

test('gibberish shows a no-match row and Search does nothing', async () => {
  mockAxios();
  render(<App />);
  await screen.findByText('Bulbasaur');
  await typeQuery('zzzzqq');
  expect(
    await screen.findByText('No Pokémon match "zzzzqq".')
  ).toBeInTheDocument();
  expect(screen.queryByText(/Did you mean/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /search/i }));
  expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
  expect(screen.queryByText(/Could not find/)).not.toBeInTheDocument();
});

test('filterPokemonNames matches prefixes, sorts, and caps', () => {
  const names = ['bulbasaur', 'blastoise', 'butterfree', 'beedrill'];
  expect(filterPokemonNames(names, 'b', 10)).toEqual([
    'beedrill',
    'blastoise',
    'bulbasaur',
    'butterfree',
  ]);
  expect(filterPokemonNames(names, 'b', 2)).toEqual([
    'beedrill',
    'blastoise',
  ]);
  expect(filterPokemonNames(names, 'charazard', 10)).toEqual([]);
  expect(filterPokemonNames(names, '', 10)).toEqual([]);
});

test('getTypeString joins types with commas and no trailing comma', () => {
  expect(
    getTypeString([
      { type: { name: 'grass' } },
      { type: { name: 'poison' } },
    ])
  ).toBe('Grass, Poison');
});

test('levenshtein counts single-letter edits', () => {
  expect(levenshtein('kitten', 'sitting')).toBe(3);
  expect(levenshtein('charizard', 'charizard')).toBe(0);
  expect(levenshtein('', 'pikachu')).toBe(7);
  expect(levenshtein('charazard', 'charizard')).toBe(1);
  expect(levenshtein('squirtel', 'squirtle')).toBe(2);
});

test('closestPokemonName suggests the nearest real name', () => {
  const names = ['bulbasaur', 'charmander', 'charizard', 'squirtle', 'pikachu'];
  expect(closestPokemonName(names, 'charazard')).toBe('charizard');
  expect(closestPokemonName(names, 'squirtel')).toBe('squirtle');
  expect(closestPokemonName(names, 'charizard')).toBe(null);
  expect(closestPokemonName(names, 'zzzz')).toBe(null);
  expect(closestPokemonName(names, 'ch')).toBe(null);
});
