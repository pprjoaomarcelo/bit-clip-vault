/**
 * @file pricing.ts
 * @description This file contains the logic for calculating dynamic gateway service fees,
 *              factoring in base costs, data size, on-chain fees, and network stress.
 */

import { getRecommendedFees } from './bitcoinfees';
import {
    ANCHOR_TX_VBYTES,
    BASE_FEE_SATS,
    FEE_PER_ATTACHMENT_SATS,
    PROFIT_MARGIN_PERCENTAGE,
    SATS_PER_BYTE_PINNED,
    ONCHAIN_ANCHOR_FEE_SATS_FALLBACK
} from './config';

/**
 * Represents the gateway's current load or stress level.
 * 0.0 = 0% full, 1.0 = 100% full.
 */
type NetworkStress = number;
/**
 * Defines the desired confirmation speed for on-chain anchor transactions.
 * The operator can choose between 'fastest', 'halfHour', 'hour', or 'economy'.
 * This choice balances cost against confirmation time.
 */
export type ConfirmationTarget = 'fastest' | 'halfHour' | 'hour' | 'economy';

/**
 * Calculates the total fee in satoshis for a gateway service request.
 * @param messageSizeBytes - The size of the core message text in bytes.
 * @param attachments - An array of attachments, each with its size in bytes.
 * @param networkStress - The current network stress level (0.0 to 1.0).
 * @param confirmationTarget - The desired on-chain confirmation speed.
 * @returns The final fee in satoshis, rounded up to the nearest whole satoshi.
 */
export async function calculateGatewayFee(
    messageSizeBytes: number, 
    attachments: { sizeBytes: number }[], 
    networkStress: NetworkStress,
    confirmationTarget: ConfirmationTarget = 'halfHour' // Default to a balanced target
): Promise<number> {
    const totalAttachmentSize = attachments.reduce((sum, attachment) => sum + attachment.sizeBytes, 0);
    const totalDataSize = messageSizeBytes + totalAttachmentSize;

    const attachmentCountFee = attachments.length * FEE_PER_ATTACHMENT_SATS;
    const dataPinningFee = totalDataSize * SATS_PER_BYTE_PINNED;

    // Fetch real-time fee rates and calculate the on-chain cost
    let onChainAnchorFeeSats = ONCHAIN_ANCHOR_FEE_SATS_FALLBACK;
    try {
        const feeRates = await getRecommendedFees();

        // Select the fee rate based on the desired confirmation target
        let targetFeeRate: number;
        switch (confirmationTarget) {
            case 'fastest':
                targetFeeRate = feeRates.fastestFee;
                break;
            case 'hour':
                targetFeeRate = feeRates.hourFee;
                break;
            case 'economy':
                targetFeeRate = feeRates.economyFee;
                break;
            case 'halfHour':
            default:
                targetFeeRate = feeRates.halfHourFee;
                break;
        }
        onChainAnchorFeeSats = Math.ceil(ANCHOR_TX_VBYTES * targetFeeRate);
    } catch (error) {
        console.warn(`[Pricing] Could not fetch live fee rates. Using fallback value of ${onChainAnchorFeeSats} sats.`, error);
    }

    // The subtotal includes all the gateway's direct costs for this specific request.
    const costSubtotal = BASE_FEE_SATS + attachmentCountFee + dataPinningFee + onChainAnchorFeeSats;

    // A dynamic multiplier can be applied for congestion. For now, it's 1.0 (no extra charge).
    const multiplier = 1.0 + (networkStress * 2); // Example: at 50% stress, price increases by 100% (2x).

    // Apply profit margin and safety buffer for on-chain fees
    const finalFee = (costSubtotal * (1 + PROFIT_MARGIN_PERCENTAGE)) * multiplier;

    return Math.ceil(finalFee);
}