const STATUS = Object.freeze({
    PAYMENT: Object.freeze({
        PENDING: 'Pending',
        SUCCESS: 'Success'
    }),
    REGISTRATION: Object.freeze({
        ACTIVE: 'active',
        UPGRADED: 'upgraded'
    }),
    CHECKIN: Object.freeze({
        SUCCESS: 'Success'
    }),
    BOOKING: Object.freeze({
        BOOKED: 'booked',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    }),
    INVENTORY: Object.freeze({
        ACTIVE: 'Active',
        INACTIVE: 'Inactive'
    }),
    TRAINER: Object.freeze({
        ACTIVE: 'Active',
        INACTIVE: 'Inactive'
    }),
    DISCOUNT: Object.freeze({
        ACTIVE: 'active',
        DISABLED: 'disabled'
    }),
    API: Object.freeze({
        SUCCESS: 'Success'
    })
});

function normalizeChoice(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
}

function normalizeProductStatus(value) {
    return normalizeChoice(value, Object.values(STATUS.INVENTORY), STATUS.INVENTORY.ACTIVE);
}

function normalizeTrainerStatus(value) {
    return normalizeChoice(value, Object.values(STATUS.TRAINER), STATUS.TRAINER.ACTIVE);
}

function normalizeDiscountStatus(value) {
    return normalizeChoice(value, Object.values(STATUS.DISCOUNT), STATUS.DISCOUNT.ACTIVE);
}

module.exports = {
    STATUS,
    normalizeProductStatus,
    normalizeTrainerStatus,
    normalizeDiscountStatus
};
