const INVOICE_TYPES = {
  TIME: 'time',
  TIP: 'tip',
}

// flat processing fee of 10 satoshis
const PROCESSING_FEE = process.env.PROCESSING_FEE || 10

// Number of satoshis to pay per tip
const TIPS_PAYMENT_RATE = process.env.TIPS_PAYMENT_RATE || 10

module.exports = {
  INVOICE_TYPES,
  PROCESSING_FEE,
  TIPS_PAYMENT_RATE,
}
