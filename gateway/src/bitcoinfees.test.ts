import axios from 'axios';
import { getRecommendedFees, FeeRates } from './bitcoinfees';

// Mock do Axios para simular chamadas de API e do Date para controlar o tempo
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Bitcoin Fees Module', () => {
  const mockFees: FeeRates = {
    fastestFee: 50,
    halfHourFee: 40,
    hourFee: 30,
    economyFee: 20,
    minimumFee: 10,
  };

  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    jest.useRealTimers(); // Usa o tempo real por padrão
    mockedAxios.get.mockClear();
  });

  it('should fetch and return recommended fees on success', async () => {
    const mockFees: FeeRates = {
      fastestFee: 50,
      halfHourFee: 40,
      hourFee: 30,
      economyFee: 20,
      minimumFee: 10,
    };

    // Simula uma resposta de sucesso da API
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: mockFees,
    });

    const fees = await getRecommendedFees();

    expect(fees).toEqual(mockFees);
    expect(mockedAxios.get).toHaveBeenCalledWith('https://mempool.space/api/v1/fees/recommended');
  });

  it('should return cached fees on a subsequent call within the TTL', async () => {
    // Simula uma resposta de sucesso da API
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: mockFees,
    });

    // Primeira chamada para popular o cache
    const firstCallFees = await getRecommendedFees();
    expect(firstCallFees).toEqual(mockFees);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // Segunda chamada, que deve vir do cache
    const secondCallFees = await getRecommendedFees();
    expect(secondCallFees).toEqual(mockFees);
    // A API não deve ser chamada novamente
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('should fetch new fees if the cache is stale', async () => {
    jest.useFakeTimers();
    mockedAxios.get.mockResolvedValue({ status: 200, data: mockFees });

    // Primeira chamada para popular o cache
    await getRecommendedFees();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // Avança o tempo para além do TTL do cache (5 minutos + 1 segundo)
    jest.advanceTimersByTime(5 * 60 * 1000 + 1000);

    // Segunda chamada, que deve fazer uma nova busca na API
    await getRecommendedFees();
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if the API call fails', async () => {
    // Simula um erro na API
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));

    // Verifica se a função lança uma exceção
    await expect(getRecommendedFees()).rejects.toThrow('Failed to fetch Bitcoin fee rates.');
  });
});