use crate::error::ContractError;
use crate::msg::{ExecuteMsg, GiftCardResponse, GiftCardsResponse, InstantiateMsg, QueryMsg};
use crate::state::{GiftCard, Status, GIFT_CARDS, GIFTS_BY_SENDER, SENDER_INDEX};
use cosmwasm_std::{
    attr, coin, entry_point, to_json_binary, Addr, BankMsg, Binary, Coin, Deps, DepsMut, Env,
    MessageInfo, Order, Response, StdResult, Uint128,
};
use sha2::{Digest, Sha256};

const DENOM_INJ: &str = "inj";
const DENOM_USDT: &str = "peggy0xdAC17F958D2ee523a2206206994597C13D831ec7";

// Minimum gift amounts in base units (assumes 18 decimals for INJ, 6 for USDT).
const MIN_INJ_AMOUNT: u128 = 100_000_000_000_000_000; // 0.1 INJ
const MIN_USDT_AMOUNT: u128 = 1_000_000; // 1 USDT

// 30 days expressed in seconds.
const THIRTY_DAYS_SECONDS: u64 = 30 * 24 * 60 * 60;

#[entry_point]
pub fn instantiate(
    _deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> StdResult<Response> {
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateGift {
            gift_id,
            claim_code_hash,
            recipient_hint,
        } => execute_create_gift(deps, env, info, gift_id, claim_code_hash, recipient_hint),
        ExecuteMsg::ClaimGift {
            gift_id,
            claim_code,
        } => execute_claim_gift(deps, env, info, gift_id, claim_code),
        ExecuteMsg::RefundGift { gift_id } => execute_refund_gift(deps, env, info, gift_id),
    }
}

fn validate_min_amount(denom: &str, amount: Uint128) -> Result<(), ContractError> {
    match denom {
        DENOM_INJ => {
            if amount.u128() < MIN_INJ_AMOUNT {
                return Err(ContractError::AmountTooSmall);
            }
        }
        DENOM_USDT => {
            if amount.u128() < MIN_USDT_AMOUNT {
                return Err(ContractError::AmountTooSmall);
            }
        }
        _ => {}
    }
    Ok(())
}

fn pick_single_fund(info: &MessageInfo) -> Result<Coin, ContractError> {
    if info.funds.is_empty() {
        return Err(ContractError::NoFundsSent);
    }
    if info.funds.len() > 1 {
        return Err(ContractError::Std(
            cosmwasm_std::StdError::generic_err("Only a single denom is supported per gift"),
        ));
    }
    Ok(info.funds[0].clone())
}

fn execute_create_gift(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    gift_id: String,
    claim_code_hash: String,
    recipient_hint: Option<String>,
) -> Result<Response, ContractError> {
    if claim_code_hash.trim().is_empty() {
        return Err(ContractError::EmptyClaimCodeHash);
    }

    if GIFT_CARDS.may_load(deps.storage, &gift_id)?.is_some() {
        return Err(ContractError::GiftAlreadyExists);
    }

    let fund = pick_single_fund(&info)?;
    validate_min_amount(&fund.denom, fund.amount)?;

    let gift = GiftCard {
        id: gift_id.clone(),
        sender: info.sender.clone(),
        amount: fund.amount,
        denom: fund.denom.clone(),
        claim_code_hash,
        status: Status::Pending,
        created_at: env.block.time.seconds(),
        claimed_by: None,
        recipient_hint,
    };

    GIFT_CARDS.save(deps.storage, &gift_id, &gift)?;

    let index = SENDER_INDEX
        .may_load(deps.storage, &info.sender)?
        .unwrap_or_default();
    GIFTS_BY_SENDER.save(deps.storage, (&info.sender, index), &gift_id)?;
    SENDER_INDEX.save(deps.storage, &info.sender, &(index + 1))?;

    Ok(Response::new()
        .add_attribute("action", "create_gift")
        .add_attribute("gift_id", gift_id)
        .add_attribute("sender", info.sender)
        .add_attribute("amount", fund.amount.to_string())
        .add_attribute("denom", fund.denom)
        .add_event(
            cosmwasm_std::Event::new("gift_created").add_attributes(vec![
                attr("gift_id", gift.id),
                attr("sender", gift.sender),
                attr("amount", gift.amount),
                attr("denom", gift.denom),
            ]),
        ))
}

fn execute_claim_gift(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    gift_id: String,
    claim_code: String,
) -> Result<Response, ContractError> {
    let mut gift = GIFT_CARDS
        .may_load(deps.storage, &gift_id)?
        .ok_or(ContractError::GiftNotFound)?;

    match gift.status {
        Status::Pending => {}
        Status::Claimed => return Err(ContractError::AlreadyClaimed),
        Status::Refunded => return Err(ContractError::AlreadyRefunded),
    }

    if info.sender == gift.sender {
        return Err(ContractError::CannotClaimOwnGift);
    }

    let mut hasher = Sha256::new();
    hasher.update(claim_code.as_bytes());
    let result = hasher.finalize();
    let computed_hash = hex::encode(result);

    if computed_hash != gift.claim_code_hash {
        return Err(ContractError::InvalidClaimCode);
    }

    let recipient = info.sender.clone();

    let send_msg = BankMsg::Send {
        to_address: recipient.to_string(),
        amount: vec![coin(gift.amount.u128(), gift.denom.clone())],
    };

    gift.status = Status::Claimed;
    gift.claimed_by = Some(recipient.clone());
    GIFT_CARDS.save(deps.storage, &gift_id, &gift)?;

    Ok(Response::new()
        .add_message(send_msg)
        .add_attribute("action", "claim_gift")
        .add_attribute("gift_id", gift_id)
        .add_attribute("claimer", recipient)
        .add_attribute("timestamp", env.block.time.seconds().to_string())
        .add_event(
            cosmwasm_std::Event::new("gift_claimed").add_attributes(vec![
                attr("gift_id", gift.id),
                attr(
                    "claimer",
                    gift.claimed_by
                        .as_ref()
                        .map(|a| a.as_str())
                        .unwrap_or_default(),
                ),
                attr("amount", gift.amount),
                attr("denom", gift.denom),
            ]),
        ))
}

fn execute_refund_gift(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    gift_id: String,
) -> Result<Response, ContractError> {
    let mut gift = GIFT_CARDS
        .may_load(deps.storage, &gift_id)?
        .ok_or(ContractError::GiftNotFound)?;

    if info.sender != gift.sender {
        return Err(ContractError::Unauthorized);
    }

    match gift.status {
        Status::Refunded => return Err(ContractError::AlreadyRefunded),
        Status::Claimed => {
            // Once claimed, cannot be refunded.
            return Err(ContractError::AlreadyClaimed);
        }
        Status::Pending => {}
    }

    let now = env.block.time.seconds();
    let refundable =
        matches!(gift.status, Status::Pending) || now >= gift.created_at + THIRTY_DAYS_SECONDS;

    if !refundable {
        return Err(ContractError::Std(
            cosmwasm_std::StdError::generic_err("Gift not yet refundable"),
        ));
    }

    let send_msg = BankMsg::Send {
        to_address: gift.sender.to_string(),
        amount: vec![coin(gift.amount.u128(), gift.denom.clone())],
    };

    gift.status = Status::Refunded;
    GIFT_CARDS.save(deps.storage, &gift_id, &gift)?;

    Ok(Response::new()
        .add_message(send_msg)
        .add_attribute("action", "refund_gift")
        .add_attribute("gift_id", gift_id)
        .add_attribute("sender", gift.sender.to_string())
        .add_attribute("timestamp", now.to_string())
        .add_event(
            cosmwasm_std::Event::new("gift_refunded").add_attributes(vec![
                attr("gift_id", gift.id),
                attr("sender", gift.sender.to_string()),
                attr("amount", gift.amount),
                attr("denom", gift.denom),
            ]),
        ))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetGift { gift_id } => to_json_binary(&query_get_gift(deps, gift_id)?),
        QueryMsg::ListGiftsBySender { sender } => {
            to_json_binary(&query_list_gifts_by_sender(deps, sender)?)
        }
    }
}

fn query_get_gift(deps: Deps, gift_id: String) -> StdResult<GiftCardResponse> {
    let gift = GIFT_CARDS.may_load(deps.storage, &gift_id)?;
    Ok(GiftCardResponse { gift })
}

fn query_list_gifts_by_sender(deps: Deps, sender: Addr) -> StdResult<GiftCardsResponse> {
    let mut gifts: Vec<GiftCard> = Vec::new();

    let prefix = GIFTS_BY_SENDER.prefix(&sender);
    for item in prefix.range(deps.storage, None, None, Order::Ascending) {
        let (_, gift_id) = item?;
        if let Some(gift) = GIFT_CARDS.may_load(deps.storage, &gift_id)? {
            gifts.push(gift);
        }
    }

    Ok(GiftCardsResponse { gifts })
}

