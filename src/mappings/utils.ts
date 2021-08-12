import { SubstrateExtrinsic } from "@subql/types";
import { SwapAmount } from "sora/api-interfaces";

export const formatU128ToBalance = (u128: string, decimals: number = 18): string => {
    let padded = u128.padStart(decimals + 1, "0");
    return `${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`;
}

export const checkIfExtrinsicExecuteSuccess = (extrinsic: SubstrateExtrinsic): boolean => {
    return !extrinsic.events.find((item) => {
        const { event: { method, section }} = item;
        return method === 'ExtrinsicFailed' && section === 'system';
    })
}

export const getExtrinsicNetworkFee = (extrinsic: SubstrateExtrinsic): string => {
    let feeEvent = extrinsic.events.find(item => {
        const { event: { method, section }} = item;
        return method === 'FeeWithdrawn' && section === 'xorFee';
    });
    if (feeEvent) {
        const {event: {data: [, feeAmount]}} = feeEvent;
        return feeAmount.toString();
    } else {
        return "0";
    }
}

export const getExtrinsicId = (extrinsic: SubstrateExtrinsic): string => {
    return `${extrinsic.block.block.hash.toString()}-${extrinsic.idx.toString()}`;
}

export const ReceiveSwapAmounts = (swapAmount: SwapAmount): string[] => {
    switch (swapAmount.isWithDesiredOutput) {
        case true: {
            return [formatU128ToBalance(swapAmount.asWithDesiredOutput.max_amount_in.toString()),
                formatU128ToBalance(swapAmount.asWithDesiredOutput.desired_amount_out.toString())]
        }
        case false: {return [formatU128ToBalance(swapAmount.asWithDesiredInput.desired_amount_in.toString()),
            formatU128ToBalance(swapAmount.asWithDesiredInput.min_amount_out.toString())]
        }
    } 
}
