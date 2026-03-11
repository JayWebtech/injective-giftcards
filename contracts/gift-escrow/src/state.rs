use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum Status {
    Pending,
    Claimed,
    Refunded,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct GiftCard {
    pub id: String,
    pub sender: Addr,
    pub amount: Uint128,
    pub denom: String,
    pub claim_code_hash: String,
    pub status: Status,
    pub created_at: u64,
    pub claimed_by: Option<Addr>,
    pub recipient_hint: Option<String>,
}

pub const GIFT_CARDS: Map<&str, GiftCard> = Map::new("gift_cards");

/// Secondary index to list gifts by sender for convenience.
/// Maps (sender_address, incremental_index) -> gift_id.
pub const GIFTS_BY_SENDER: Map<(&Addr, u64), String> = Map::new("gifts_by_sender");

/// Simple counter to keep track of per-sender indices.
pub const SENDER_INDEX: Map<&Addr, u64> = Map::new("sender_index");

