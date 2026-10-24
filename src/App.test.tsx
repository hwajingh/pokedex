import React from 'react';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import App from './App';

// The app fetches PokeAPI on mount; mock axios so this test does not depend
// on the network. The mocked call never resolves, which is fine: the static
// UI below renders before any fetch resolves.
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get.mockReturnValue(new Promise(() => {}) as never);

test('renders the search UI and footer', () => {
  render(<App />);
  expect(screen.getByText(/Search pokemon name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  expect(screen.getByText(/Made by Tiger Hong/i)).toBeInTheDocument();
});
