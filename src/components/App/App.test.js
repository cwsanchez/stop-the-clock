import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Stop the Clock header', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /stop the clock/i });
  expect(heading).toBeInTheDocument();
});

test('renders Start button on load', () => {
  render(<App />);
  const startButton = screen.getByRole('button', { name: /start/i });
  expect(startButton).toBeInTheDocument();
});

test('renders username input on load', () => {
  render(<App />);
  const input = screen.getByPlaceholderText(/enter username/i);
  expect(input).toBeInTheDocument();
});
