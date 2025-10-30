import axios from 'axios';
import 'dotenv/config';

if (!process.env.VOLTAGE_API_KEY) {
  throw new Error('[Config] VOLTAGE_API_KEY is not set in the .env file.');
}

if (!process.env.VOLTAGE_NODE_ID) {
  // Adicionamos uma verificação para garantir que o ID do nó também esteja configurado.
  throw new Error('[Config] VOLTAGE_NODE_ID is not set in the .env file.');
}

const VOLTAGE_NODE_ID = process.env.VOLTAGE_NODE_ID;

const voltageApi = axios.create({
  baseURL: 'https://backend.voltage.cloud/api/v1',
  headers: {
    'X-Api-Key': process.env.VOLTAGE_API_KEY,
    'Content-Type': 'application/json',
  },
});

/**
 * Creates a Lightning invoice using the Voltage API.
 * @param amountMsat The amount for the invoice in millisatoshis.
 * @param memo A description for the invoice.
 * @returns The payment request string (BOLT11 invoice).
 */
export async function createLightningInvoice(amountMsat: number, memo: string): Promise<string> {
  try {
    console.log(`[Voltage] Creating invoice for ${amountMsat} msats with memo: "${memo}"`);

    // Usando a variável de ambiente em vez do valor fixo.
    const response = await voltageApi.post(`/node/${VOLTAGE_NODE_ID}/invoices`, {
      msatoshi: amountMsat,
      description: memo,
      expiry: 3600, // 1 hour
    });

    return response.data.payment_request;
  } catch (error) {
    console.error('[Voltage] Error creating invoice:', error.response?.data || error.message);
    throw new Error('Failed to create Lightning invoice via Voltage API.');
  }
}

/**
 * Checks the status of a Lightning invoice using the Voltage API.
 * @param paymentHash The payment hash of the invoice to check.
 * @returns An object indicating if the invoice is confirmed.
 * @param api An optional axios instance for testing purposes.
 */
export async function getInvoiceStatus(
  paymentHash: string,
  api: typeof voltageApi = voltageApi
): Promise<{ is_confirmed: boolean }> {
  try {
    console.log(`[Voltage] Checking status for invoice hash: ${paymentHash}`);

    const response = await api.get(`/node/${VOLTAGE_NODE_ID}/invoice/${paymentHash}`);

    // The response structure from Voltage/LND for a settled invoice has a `settled` property.
    // We consider the invoice paid if `settled` is true.
    return { is_confirmed: response.data.settled === true };
  } catch (error) {
    console.error('[Voltage] Error checking invoice status:', error.response?.data || error.message);
    // If the invoice is not found or another error occurs, we assume it's not paid.
    return { is_confirmed: false };
  }
}
