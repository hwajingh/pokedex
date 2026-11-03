import React from 'react';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import App from './App';

// The app fetches PokeAPI on mount; mock axios so this test does not depend
// on the network. axios 0.27's automock does not reliably provide a working
// .get, so assign the mock directly before render (same pattern as Wordle).
// The mocked call never resolves, which is fine: the static UI below
// renders before any fetch resolves.
function mockAxios() {
  (axios as unknown as { get: unknown }).get = jest.fn(
    () => new Promise(() => {})
  );
}

test('renders the search UI and footer', () => {
  mockAxios();
  render(<App />);
  expect(screen.getByText(/Search pokemon name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  expect(screen.getByText(/Made by Tiger Hong/i)).toBeInTheDocument();
});
