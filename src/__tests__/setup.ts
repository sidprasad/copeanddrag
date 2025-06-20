// Jest setup file
// This file is run before each test file

// Mock DOM methods that might be used in tests
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      getPropertyValue: (prop: string) => {
        return '';
      }
    })
  });
}

// Mock D3 selection if needed for tests
jest.mock('d3', () => ({
  ...jest.requireActual('d3'),
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      data: jest.fn(() => ({
        enter: jest.fn(() => ({
          append: jest.fn(() => ({
            attr: jest.fn(),
            style: jest.fn(),
            text: jest.fn(),
          })),
        })),
        exit: jest.fn(() => ({
          remove: jest.fn(),
        })),
        attr: jest.fn(),
        style: jest.fn(),
        text: jest.fn(),
      })),
    })),
    attr: jest.fn(),
    style: jest.fn(),
    node: jest.fn(),
  })),
}));
