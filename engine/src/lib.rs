//! Order-book replay and market-order matching engine.
//!
//! Walks a snapshot of resting limit orders the same way a real exchange
//! matching engine fills a market order: level by level, best price first,
//! until the requested size is exhausted or the book runs out of depth.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// A single resting price level in the book.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PriceLevel {
    pub price: f64,
    pub size: f64,
}

/// Which side of the book a market order consumes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Side {
    Buy,
    Sell,
}

/// One price level consumed while filling an order.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct FillLevel {
    pub price: f64,
    pub size_taken: f64,
}

/// The result of simulating a market order against a book snapshot.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FillResult {
    /// Levels consumed, in the order they were eaten.
    pub levels: Vec<FillLevel>,
    /// Total size actually filled (may be less than requested if the book
    /// doesn't have enough depth).
    pub filled_size: f64,
    /// Size requested but not filled due to insufficient depth.
    pub unfilled_size: f64,
    /// Volume-weighted average fill price.
    pub avg_price: f64,
    /// Best price available at the top of the book before the order ran.
    pub best_price: f64,
    /// Dollar cost of slippage: (avg_price - best_price) * filled_size for a
    /// buy, or the mirror for a sell. Always >= 0.
    pub slippage_cost: f64,
}

/// Simulate a market order walking one side of the book.
///
/// `levels` must be sorted best-to-worst for the side being consumed (asks
/// ascending for a buy, bids descending for a sell).
pub fn simulate_market_order(levels: &[PriceLevel], side: Side, order_size: f64) -> FillResult {
    let mut remaining = order_size;
    let mut consumed = Vec::new();
    let mut notional = 0.0;
    let best_price = levels.first().map(|l| l.price).unwrap_or(0.0);

    for level in levels {
        if remaining <= 0.0 {
            break;
        }
        let take = remaining.min(level.size);
        if take <= 0.0 {
            continue;
        }
        consumed.push(FillLevel {
            price: level.price,
            size_taken: take,
        });
        notional += take * level.price;
        remaining -= take;
    }

    let filled_size = order_size - remaining;
    let avg_price = if filled_size > 0.0 {
        notional / filled_size
    } else {
        best_price
    };

    let slippage_cost = match side {
        Side::Buy => (avg_price - best_price) * filled_size,
        Side::Sell => (best_price - avg_price) * filled_size,
    }
    .max(0.0);

    FillResult {
        levels: consumed,
        filled_size,
        unfilled_size: remaining.max(0.0),
        avg_price,
        best_price,
        slippage_cost,
    }
}

/// WASM entry point: simulate a market order against a JSON-encoded book side.
///
/// `levels_json` is a JSON array of `{ "price": f64, "size": f64 }`, already
/// sorted best-to-worst for the given side.
#[wasm_bindgen]
pub fn simulate_market_order_js(levels_json: &str, side_is_buy: bool, order_size: f64) -> JsValue {
    let levels: Vec<PriceLevel> = serde_json::from_str(levels_json).unwrap_or_default();
    let side = if side_is_buy { Side::Buy } else { Side::Sell };
    let result = simulate_market_order(&levels, side, order_size);
    serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_asks() -> Vec<PriceLevel> {
        vec![
            PriceLevel { price: 100.0, size: 2.0 },
            PriceLevel { price: 101.0, size: 3.0 },
            PriceLevel { price: 102.0, size: 5.0 },
        ]
    }

    #[test]
    fn fills_within_top_level_has_zero_slippage() {
        let result = simulate_market_order(&sample_asks(), Side::Buy, 1.0);
        assert_eq!(result.filled_size, 1.0);
        assert_eq!(result.avg_price, 100.0);
        assert_eq!(result.slippage_cost, 0.0);
    }

    #[test]
    fn fills_across_multiple_levels_and_reports_slippage() {
        let result = simulate_market_order(&sample_asks(), Side::Buy, 4.0);
        assert_eq!(result.filled_size, 4.0);
        assert_eq!(result.levels.len(), 2);
        // 2 @ 100 + 2 @ 101 = 402 notional / 4 = 100.5 avg
        assert!((result.avg_price - 100.5).abs() < 1e-9);
        assert!(result.slippage_cost > 0.0);
    }

    #[test]
    fn reports_unfilled_size_when_book_runs_out_of_depth() {
        let result = simulate_market_order(&sample_asks(), Side::Buy, 100.0);
        assert_eq!(result.filled_size, 10.0);
        assert_eq!(result.unfilled_size, 90.0);
    }
}
