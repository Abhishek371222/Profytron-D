// jest.setup.js
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));