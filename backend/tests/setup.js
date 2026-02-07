// Setup global para tests
require("dotenv").config({ path: ".env.test" });

// Mock de Pusher
jest.mock("../src/services/pusherService", () => ({
  trigger: jest.fn().mockResolvedValue(true),
  triggerBatch: jest.fn().mockResolvedValue(true),
}));

// Mock de nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
  }),
}));

// Silenciar logs en tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Timeout global
jest.setTimeout(30000);

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
