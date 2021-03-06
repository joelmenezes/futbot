import { playerService } from "../player";
import { fut, futbin } from "../api";

const HIGHER_PRICE_BOUNDRY = 1.05;
const LOWER_PRIVE_BOUNDRY = 0.95;

export function tradePrice(price: number): number {
  // 0-1000 50
  // 1k-10k 100
  // 10k-50k 250
  // 50k-100k 500
  // 100k-    1000
  if (price < 1000) {
    return Math.ceil(price / 50) * 50;
  } else if (price < 10 * 1000) {
    return Math.ceil(price / 100) * 100;
  } else if (price < 50 * 1000) {
    return Math.ceil(price / 250) * 250;
  } else if (price < 100 * 1000) {
    return Math.ceil(price / 500) * 500;
  } else {
    return Math.ceil(price / 1000) * 1000;
  }
}

export interface SellPrice {
  buyNowPrice: number;
  startingBid: number;
}
export function getFutbinSellPrice(price: futbin.Price): SellPrice {
  const prices = price.prices;

  if (prices.length < 5 || prices[0] === 0) {
    return null;
  }

  if (price.updatedMinsAgo > 60) {
    return null;
  }

  let referencePrice = prices[0] * 1.05;

  return {
    buyNowPrice: tradePrice(referencePrice * HIGHER_PRICE_BOUNDRY),
    startingBid: tradePrice(referencePrice * LOWER_PRIVE_BOUNDRY)
  };
}

export function getMarketSellPrice(
  price: playerService.MarketPrice
): SellPrice {
  if (!price) {
    return null;
  }

  if (price.samplecount <= 3) {
    return null;
  }

  return {
    buyNowPrice: tradePrice(price.minBuyNow * HIGHER_PRICE_BOUNDRY),
    startingBid: tradePrice(price.minBuyNow * LOWER_PRIVE_BOUNDRY)
  };
}

export async function getOptimalSellPrice(
  resourceId: number
): Promise<SellPrice> {
  const futbinPrice: futbin.Price = await playerService.getFutbinPrice(
    resourceId
  );
  const futbinSellPrice: SellPrice = getFutbinSellPrice(futbinPrice);
  const marketPrice: playerService.MarketPrice = futbinSellPrice
    ? null
    : await playerService.getMarketPrice(resourceId);
  const marketSellPrice: SellPrice = getMarketSellPrice(marketPrice);

  return (
    futbinSellPrice ||
    marketSellPrice || {
      startingBid: NaN,
      buyNowPrice: NaN
    }
  );
}
