export interface WbWarehouseTariff {
    boxDeliveryBase: string;
    boxDeliveryCoefExpr: string;
    boxDeliveryLiter: string;
    boxDeliveryMarketplaceBase: string;
    boxDeliveryMarketplaceCoefExpr: string;
    boxDeliveryMarketplaceLiter: string;
    boxStorageBase: string;
    boxStorageCoefExpr: string;
    boxStorageLiter: string;
    geoName: string;
    warehouseName: string;
}

export interface WbBoxTariffsData {
    dtNextBox: string;
    dtTillMax: string;
    warehouseList: WbWarehouseTariff[];
}

export interface WbBoxTariffsResponse {
    response: {
        data: WbBoxTariffsData;
    };
}
export type WbBoxTariffsTable = {
    id: number;
    data: WbBoxTariffsData | null;
    upload_status: Status;
    error: string | null;
    created_at: string;
    updated_at: string | null;
};
