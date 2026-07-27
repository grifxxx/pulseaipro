import type { WatchlistAsset } from "@/lib/types";

// Default v1 watchlist: large-cap/tech US stocks, blue-chip MOEX stocks, and top crypto by market cap.
// Edit freely — this is just the seed loaded into `watchlist_assets` on first setup.
// Trending coins are added dynamically per pipeline run on top of this list (see lib/datasources/coingecko.ts).

export const STOCK_WATCHLIST: WatchlistAsset[] = [
  { symbol: "AAPL", name: "Apple Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "MSFT", name: "Microsoft Corp.", assetType: "stock", market: "us_stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "NVDA", name: "NVIDIA Corp.", assetType: "stock", market: "us_stock" },
  { symbol: "META", name: "Meta Platforms Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "TSLA", name: "Tesla Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "AVGO", name: "Broadcom Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "NFLX", name: "Netflix Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", assetType: "stock", market: "us_stock" },
  { symbol: "V", name: "Visa Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "MA", name: "Mastercard Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "XOM", name: "Exxon Mobil Corp.", assetType: "stock", market: "us_stock" },
  { symbol: "WMT", name: "Walmart Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "ORCL", name: "Oracle Corp.", assetType: "stock", market: "us_stock" },
  { symbol: "CRM", name: "Salesforce Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "ADBE", name: "Adobe Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "INTC", name: "Intel Corp.", assetType: "stock", market: "us_stock" },
  { symbol: "DIS", name: "Walt Disney Co.", assetType: "stock", market: "us_stock" },
  { symbol: "BA", name: "Boeing Co.", assetType: "stock", market: "us_stock" },
  { symbol: "COIN", name: "Coinbase Global Inc.", assetType: "stock", market: "us_stock" },
  { symbol: "SMCI", name: "Super Micro Computer Inc.", assetType: "stock", market: "us_stock" },
];

// MOEX (Moscow Exchange) tickers — quoted via the free iss.moex.com ISS API, no key required.
export const RUSSIAN_STOCK_WATCHLIST: WatchlistAsset[] = [
  { symbol: "SBER", name: "Сбербанк", assetType: "stock", market: "ru_stock" },
  { symbol: "GAZP", name: "Газпром", assetType: "stock", market: "ru_stock" },
  { symbol: "LKOH", name: "Лукойл", assetType: "stock", market: "ru_stock" },
  { symbol: "GMKN", name: "ГМК Норильский никель", assetType: "stock", market: "ru_stock" },
  { symbol: "ROSN", name: "Роснефть", assetType: "stock", market: "ru_stock" },
  { symbol: "NVTK", name: "Новатэк", assetType: "stock", market: "ru_stock" },
  { symbol: "TATN", name: "Татнефть", assetType: "stock", market: "ru_stock" },
  { symbol: "MTSS", name: "МТС", assetType: "stock", market: "ru_stock" },
  { symbol: "MGNT", name: "Магнит", assetType: "stock", market: "ru_stock" },
  { symbol: "PLZL", name: "Полюс", assetType: "stock", market: "ru_stock" },
  { symbol: "CHMF", name: "Северсталь", assetType: "stock", market: "ru_stock" },
  { symbol: "ALRS", name: "АЛРОСА", assetType: "stock", market: "ru_stock" },
  { symbol: "VTBR", name: "ВТБ", assetType: "stock", market: "ru_stock" },
  { symbol: "AFLT", name: "Аэрофлот", assetType: "stock", market: "ru_stock" },
  { symbol: "MOEX", name: "Московская биржа", assetType: "stock", market: "ru_stock" },
  { symbol: "OZON", name: "Ozon", assetType: "stock", market: "ru_stock" },
  { symbol: "POSI", name: "Positive Technologies", assetType: "stock", market: "ru_stock" },
  { symbol: "RUAL", name: "РУСАЛ", assetType: "stock", market: "ru_stock" },
  { symbol: "YDEX", name: "Яндекс", assetType: "stock", market: "ru_stock" },
  { symbol: "SNGS", name: "Сургутнефтегаз", assetType: "stock", market: "ru_stock" },
  { symbol: "PHOR", name: "ФосАгро", assetType: "stock", market: "ru_stock" },
  { symbol: "IRAO", name: "Интер РАО", assetType: "stock", market: "ru_stock" },
];

// CoinGecko coin IDs (not ticker symbols) — used directly against /coins/markets.
export const CRYPTO_WATCHLIST: WatchlistAsset[] = [
  { symbol: "bitcoin", name: "Bitcoin", assetType: "crypto", market: "crypto" },
  { symbol: "ethereum", name: "Ethereum", assetType: "crypto", market: "crypto" },
  { symbol: "tether", name: "Tether", assetType: "crypto", market: "crypto" },
  { symbol: "binancecoin", name: "BNB", assetType: "crypto", market: "crypto" },
  { symbol: "solana", name: "Solana", assetType: "crypto", market: "crypto" },
  { symbol: "ripple", name: "XRP", assetType: "crypto", market: "crypto" },
  { symbol: "usd-coin", name: "USDC", assetType: "crypto", market: "crypto" },
  { symbol: "cardano", name: "Cardano", assetType: "crypto", market: "crypto" },
  { symbol: "dogecoin", name: "Dogecoin", assetType: "crypto", market: "crypto" },
  { symbol: "avalanche-2", name: "Avalanche", assetType: "crypto", market: "crypto" },
  { symbol: "tron", name: "TRON", assetType: "crypto", market: "crypto" },
  { symbol: "chainlink", name: "Chainlink", assetType: "crypto", market: "crypto" },
  { symbol: "polkadot", name: "Polkadot", assetType: "crypto", market: "crypto" },
  { symbol: "the-open-network", name: "Toncoin", assetType: "crypto", market: "crypto" },
  { symbol: "sui", name: "Sui", assetType: "crypto", market: "crypto" },
  { symbol: "shiba-inu", name: "Shiba Inu", assetType: "crypto", market: "crypto" },
  { symbol: "litecoin", name: "Litecoin", assetType: "crypto", market: "crypto" },
  { symbol: "near", name: "NEAR Protocol", assetType: "crypto", market: "crypto" },
];

export const DEFAULT_WATCHLIST: WatchlistAsset[] = [
  ...STOCK_WATCHLIST,
  ...RUSSIAN_STOCK_WATCHLIST,
  ...CRYPTO_WATCHLIST,
];
