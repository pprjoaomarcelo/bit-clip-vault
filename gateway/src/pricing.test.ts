import { calculateGatewayFee } from './pricing';
import { getRecommendedFees, FeeRates } from './bitcoinfees';
import {
  BASE_FEE_SATS,
  FEE_PER_ATTACHMENT_SATS,
  SATS_PER_BYTE_PINNED,
  ANCHOR_TX_VBYTES,
  PROFIT_MARGIN_PERCENTAGE,
  ONCHAIN_ANCHOR_FEE_SATS_FALLBACK
} from './config';

// Mock the bitcoinfees module
jest.mock('./bitcoinfees');

const mockedGetRecommendedFees = getRecommendedFees as jest.Mock<Promise<FeeRates>>;

describe('calculateGatewayFee', () => {

  beforeEach(() => {
    // Reset mocks before each test
    mockedGetRecommendedFees.mockClear();
    // Provide a default mock implementation for happy path tests
    mockedGetRecommendedFees.mockResolvedValue({
      fastestFee: 50,
      halfHourFee: 40, // Use a consistent value for predictable tests
      hourFee: 30,
      economyFee: 20,
      minimumFee: 10,
    });
  });

  // Test 1: Basic message, no attachments, no network stress.
  it('should calculate the fee for a basic message with no attachments or stress', async () => {
    const fee = await calculateGatewayFee(100, [], 0);
    // costSubtotal = base(10) + attachments(0) + data(100 * 0.001=0.1) + anchor(141 * 40 = 5640) = 5650.1
    // finalFee = (5650.1 * 1.15) * 1.0 = 6497.615 => ceil(6498)
    expect(fee).toBe(6498);
  });

  // Test 2: Message with one small attachment.
  it('should add a fee for a single attachment', async () => {
    const attachments = [{ sizeBytes: 5000 }]; // 5 KB
    const fee = await calculateGatewayFee(100, attachments, 0);
    // costSubtotal = base(10) + attachments(1*5=5) + data((100+5000)*0.001=5.1) + anchor(5640) = 5660.1
    // finalFee = (5660.1 * 1.15) * 1.0 = 6509.115 => ceil(6510)
    expect(fee).toBe(6510);
  });

  // Test 3: Message with multiple attachments.
  it('should add fees for multiple attachments', async () => {
    const attachments = [{ sizeBytes: 5000 }, { sizeBytes: 10000 }]; // 15 KB total
    const fee = await calculateGatewayFee(100, attachments, 0);
    // costSubtotal = base(10) + attachments(2*5=10) + data((100+15000)*0.001=15.1) + anchor(5640) = 5675.1
    // finalFee = (5675.1 * 1.15) * 1.0 = 6526.365 => ceil(6527)
    expect(fee).toBe(6527);
  });

  // Test 4: Test with various network stress levels.
  it.each([
    { stress: 0.0, multiplier: 1.0, expected: 6498 },   // 0% stress -> 1x multiplier -> (5650.1 * 1.15) * 1.0 = 6497.6 => 6498
    { stress: 0.25, multiplier: 1.5, expected: 9747 },  // 25% stress -> 1.5x multiplier -> (5650.1 * 1.15) * 1.5 = 9746.4 => 9747
    { stress: 0.5, multiplier: 2.0, expected: 12996 }, // 50% stress -> 2x multiplier -> (5650.1 * 1.15) * 2.0 = 12995.2 => 12996
    { stress: 0.9, multiplier: 2.8, expected: 18194 }, // 90% stress -> 2.8x multiplier -> (5650.1 * 1.15) * 2.8 = 18193.3 => 18194
    { stress: 1.0, multiplier: 3.0, expected: 19493 }, // 100% stress -> 3x multiplier -> (5650.1 * 1.15) * 3.0 = 19492.8 => 19493
  ])(
    'should apply a multiplier of $multiplier for network stress of $stress',
    async ({ stress, expected }) => {
      const fee = await calculateGatewayFee(100, [], stress);
      expect(fee).toBe(expected);
    }
  );

  // Test 5 is now covered by the it.each block above.
  // This space can be used for a new test case.
  it('should handle a case with zero message size and zero attachments', async () => {
    const fee = await calculateGatewayFee(0, [], 0);
    // costSubtotal = base(10) + attachments(0) + data(0) + anchor(5640) = 5650
    // finalFee = (5650 * 1.15) * 1.0 = 6497.5 => ceil(6498)
    expect(fee).toBe(6498);
  })

  // Test 6: Test fallback pricing when fee API fails
  it('should use a fallback on-chain fee if the API call fails', async () => {
    // Simulate an error from the fee API
    mockedGetRecommendedFees.mockRejectedValue(new Error('API is down'));

    const fee = await calculateGatewayFee(100, [], 0);

    // costSubtotal = base(10) + attachments(0) + data(100 * 0.001=0.1) + anchor(250) = 260.1
    // finalFee = (260.1 * 1.15) * 1.0 = 299.115 => ceil(300)
    expect(fee).toBe(300);
  });

  // Test 7: Test with a different confirmation target ('economy')
  it('should use a different fee rate for a different confirmation target', async () => {
    // The mock returns 20 for economyFee
    const fee = await calculateGatewayFee(100, [], 0, 'economy');
    // costSubtotal = base(10) + attachments(0) + data(100 * 0.001=0.1) + anchor(141 * 20 = 2820) = 2830.1
    // finalFee = (2830.1 * 1.15) * 1.0 = 3254.615 => ceil(3255)
    expect(fee).toBe(3255);
  });

  // Test 8: Test with a very large number of attachments
  it('should handle a large number of attachments correctly', async () => {
    // 100 attachments of 1KB each
    const attachments = Array(100).fill({ sizeBytes: 1024 });
    const fee = await calculateGatewayFee(100, attachments, 0);

    // attachmentCountFee = 100 * 5 = 500
    // totalDataSize = 100 + (100 * 1024) = 102500
    // dataPinningFee = 102500 * 0.001 = 102.5
    // costSubtotal = base(10) + attachments(500) + data(102.5) + anchor(5640) = 6252.5
    // finalFee = (6252.5 * 1.15) * 1.0 = 7190.375 => ceil(7191)
    expect(fee).toBe(7191);
  });
});