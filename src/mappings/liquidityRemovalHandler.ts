import { SubstrateExtrinsic, SubstrateEvent } from '@subql/types';
import { HistoryElement } from 'sora/types';
import { formatU128ToBalance, assignCommonHistoryElemInfo } from "./utils";



const saveDetails = (extrinsic: SubstrateExtrinsic, details: Object): Object => {
    const { extrinsic: { args: [, assetAId, assetBId, , assetAMin, assetBMin] } } = extrinsic;

    // TODO change the amount from min to real?

    let baseAssetId = assetAId.toString();
    let targetAssetId = assetBId.toString();

    details = {
        type: "Removal",
        baseAssetId: baseAssetId,
        targetAssetId: targetAssetId,
        baseAssetAmount: formatU128ToBalance(assetAMin.toString(), baseAssetId),
        targetAssetAmount: formatU128ToBalance(assetBMin.toString(), targetAssetId)
    }

    return details

}

export async function handleLiquidityRemoval(extrinsic: SubstrateExtrinsic): Promise<void> {

    logger.debug("Caught liquidity removal extrinsic")

    const record = assignCommonHistoryElemInfo(extrinsic)

    let details = new Object();

    if (record.execution.success) {

        let assetATransferEvent = extrinsic.events.find(e => e.event.method === 'Transferred' && e.event.section === 'currencies')
        const { event: { data: [inputAsset, , , inputTransferedAmount] } } = assetATransferEvent;

        let AssetBTransferEvent = extrinsic.events.find(e => (e as SubstrateEvent).idx === (assetATransferEvent as SubstrateEvent).idx + 1)
        const { event: { data: [outputAsset, , , outputTransferedAmount] } } = AssetBTransferEvent;

        if (AssetBTransferEvent.event.method === 'Transferred' && AssetBTransferEvent.event.section === 'currencies') {

            let baseAssetId = inputAsset.toString();
            let targetAssetId = outputAsset.toString()

            details = {
                type: "Removal",
                baseAssetId: baseAssetId,
                targetAssetId: targetAssetId,
                baseAssetAmount: formatU128ToBalance(inputTransferedAmount.toString(), baseAssetId),
                targetAssetAmount: formatU128ToBalance(outputTransferedAmount.toString(), targetAssetId)

            }

            record.data = details
        }

        else {
            details = saveDetails(extrinsic, details)
        }
    }

    else {
        details = saveDetails(extrinsic, details)
    }

    record.data = details

    await record.save();

    logger.debug(`===== Saved liquidity removal with ${extrinsic.extrinsic.hash.toString()} txid =====`);

}
