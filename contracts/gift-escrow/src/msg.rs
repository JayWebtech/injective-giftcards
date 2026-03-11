use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Addr;

use crate::state::GiftCard;

#[cw_serde]
pub struct InstantiateMsg {}

#[cw_serde]
pub enum ExecuteMsg {
    /// Create a new gift card, locking the sent funds in escrow.
    /// `gift_id` should be unique; contract will error if it already exists.
    CreateGift {
        gift_id: String,
        claim_code_hash: String,
        /// Optional hint the sender can store (e.g. recipient name/email)
        recipient_hint: Option<String>,
    },
    /// Claim an existing gift card using the secret claim code.
    ClaimGift {
        gift_id: String,
        claim_code: String,
    },
    /// Refund a gift back to the sender.
    /// Can only be called by the original sender.
    /// Allowed if status is Pending, or if 30 days have elapsed.
    RefundGift {
        gift_id: String,
    },
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// Get details for a specific gift card.
    #[returns(GiftCardResponse)]
    GetGift { gift_id: String },

    /// List all gift cards created by a given sender address.
    #[returns(GiftCardsResponse)]
    ListGiftsBySender { sender: Addr },
}

#[cw_serde]
pub struct GiftCardResponse {
    pub gift: Option<GiftCard>,
}

#[cw_serde]
pub struct GiftCardsResponse {
    pub gifts: Vec<GiftCard>,
}

