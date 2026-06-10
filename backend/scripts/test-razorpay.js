const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('\n=== Razorpay Credential Diagnostic ===');
console.log('KEY_ID      :', keyId ?? '❌ NOT SET');
console.log('KEY_SECRET  :', keySecret ? `...${keySecret.slice(-6)}` : '❌ NOT SET');
console.log('KEY_ID length     :', keyId?.length);
console.log('KEY_SECRET length :', keySecret?.length);

// Check for hidden whitespace/carriage returns
if (keyId) {
  const hasWeirdChars = /[\r\n\t ]/.test(keyId);
  console.log('KEY_ID has whitespace/CR?', hasWeirdChars ? '⚠️  YES — THIS IS THE BUG' : '✅ No');
}
if (keySecret) {
  const hasWeirdChars = /[\r\n\t ]/.test(keySecret);
  console.log('KEY_SECRET has whitespace/CR?', hasWeirdChars ? '⚠️  YES — THIS IS THE BUG' : '✅ No');
}

if (!keyId || !keySecret) {
  console.error('\n❌ Keys not loaded. dotenv may not be reading the .env file.');
  process.exit(1);
}

console.log('\n--- Attempting Razorpay API call ---');
const razorpay = new Razorpay({ key_id: keyId.trim(), key_secret: keySecret.trim() });

razorpay.orders.create({
  amount: 100,
  currency: 'INR',
  receipt: `diag_${Date.now()}`
})
.then(order => {
  console.log('\n✅ SUCCESS! Razorpay credentials are valid.');
  console.log('   Order ID:', order.id);
})
.catch(err => {
  console.error('\n❌ Razorpay API call FAILED:');
  console.error('   Status :', err.statusCode);
  console.error('   Code   :', err.error?.code);
  console.error('   Desc   :', err.error?.description);
  console.error('\nThis confirms the keys are being rejected by Razorpay — they need to be regenerated from the dashboard.');
});
