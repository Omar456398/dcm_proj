// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill ResizeObserver for DOM testing
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Polyfill createImageBitmap for DOM testing
if (typeof global.createImageBitmap === 'undefined') {
  global.createImageBitmap = jest.fn().mockResolvedValue({
    width: 512,
    height: 512,
    close: jest.fn(),
  }) as any;
}
