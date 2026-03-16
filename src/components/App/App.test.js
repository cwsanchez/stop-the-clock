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

test('renders Game Mode label for mode switcher', () => {
  render(<App />);
  expect(screen.getByText(/game mode/i)).toBeInTheDocument();
});
