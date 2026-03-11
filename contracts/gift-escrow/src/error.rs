use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Gift with this id already exists")]
    GiftAlreadyExists,

    #[error("Gift not found")]
    GiftNotFound,

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Gift has already been claimed")]
    AlreadyClaimed,

    #[error("Gift has already been refunded")]
    AlreadyRefunded,

    #[error("Invalid claim code")]
    InvalidClaimCode,

    #[error("Claim code hash must be non-empty")]
    EmptyClaimCodeHash,

    #[error("Cannot claim own gift")]
    CannotClaimOwnGift,

    #[error("Insufficient amount sent for this token")]
    AmountTooSmall,

    #[error("No funds sent")]
    NoFundsSent,
}

