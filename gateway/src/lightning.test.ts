import axios from 'axios';
import { createLightningInvoice, getInvoiceStatus } from './lightning';

// Mock do Axios para simular chamadas de API
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Configura uma instância mockada do Axios para ser usada nos testes
const mockApi = {
  post: jest.fn(),
  get: jest.fn(),
};

describe('Lightning Module', () => {
  // Limpa os mocks antes de cada teste para garantir isolamento
  beforeEach(() => {
    mockApi.post.mockClear();
    mockApi.get.mockClear();
  });

  describe('createLightningInvoice', () => {
    it('should create an invoice and return a payment request', async () => {
      const mockPaymentRequest = 'lnbc1...';
      // Simula uma resposta de sucesso da API
      mockedAxios.create.mockReturnValue(mockApi as any);
      mockApi.post.mockResolvedValue({
        data: { payment_request: mockPaymentRequest },
      });

      const paymentRequest = await createLightningInvoice(1000, 'test memo');

      expect(paymentRequest).toBe(mockPaymentRequest);
      expect(mockApi.post).toHaveBeenCalledWith(expect.any(String), {
        msatoshi: 1000,
        description: 'test memo',
        expiry: 3600,
      });
    });
  });

  describe('getInvoiceStatus', () => {
    it('should return is_confirmed: true for a settled invoice', async () => {
      // Simula uma resposta de fatura paga
      mockApi.get.mockResolvedValue({ data: { settled: true } });

      const status = await getInvoiceStatus('some_payment_hash', mockApi as any);

      expect(status.is_confirmed).toBe(true);
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('some_payment_hash'));
    });

    it('should return is_confirmed: false for an unsettled invoice', async () => {
      // Simula uma resposta de fatura não paga
      mockApi.get.mockResolvedValue({ data: { settled: false } });

      const status = await getInvoiceStatus('another_hash', mockApi as any);

      expect(status.is_confirmed).toBe(false);
    });

    it('should return is_confirmed: false if the API call fails', async () => {
      // Simula um erro na API
      mockApi.get.mockRejectedValue(new Error('API Error'));

      const status = await getInvoiceStatus('error_hash', mockApi as any);

      expect(status.is_confirmed).toBe(false);
    });
  });
});