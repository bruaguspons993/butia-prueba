import butiaSpec from "./butia"

export const BOTS: { [productId: number]: typeof butiaSpec } = {
    [butiaSpec.productId]: butiaSpec,
}

export const DEFAULT_BOT = butiaSpec.productId
export const BUTIA_BOT = butiaSpec
