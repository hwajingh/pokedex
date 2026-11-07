import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import axios from 'axios';
import App from './App';
import { filterPokemonNames, getTypeString } from './helper';

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
    if (url.endsWith('/pokemon/6') || url.endsWith('/pokemon/charizard')) {
      return Promise.resolve({ data: CHARIZARD });
    }
    return Promise.reject({ response: { status: 404 } });
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
  fireEvent.change(screen.getByLabelText(/Pokemon Name/i), {
    target: { value: 'b' },
  });
  const options = await screen.findAllByRole('option');
  expect(options.map((option) => option.textContent)).toEqual([
    'Beedrill',
    'Blastoise',
    'Bulbasaur',
    'Butterfree',
  ]);
});

test('a typo shows a no-match row, not an error banner', async () => {
  mockAxios();
  render(<App />);
  await screen.findByText('Bulbasaur');
  fireEvent.change(screen.getByLabelText(/Pokemon Name/i), {
    target: { value: 'charazard' },
  });
  expect(
    await screen.findByText('No Pokémon match "charazard".')
  ).toBeInTheDocument();
  expect(screen.queryByText(/Could not find/)).not.toBeInTheDocument();
});

test('clicking a suggestion loads that Pokémon', async () => {
  mockAxios();
  render(<App />);
  await screen.findByText('Bulbasaur');
  fireEvent.change(screen.getByLabelText(/Pokemon Name/i), {
    target: { value: 'char' },
  });
  const option = await screen.findByRole('option', { name: 'Charizard' });
  fireEvent.mouseDown(option);
  expect(await screen.findByText('Fire, Flying')).toBeInTheDocument();
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
