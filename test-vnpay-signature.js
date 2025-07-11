const crypto = require('crypto');
const qs = require('qs');

// Test VNPay signature generation and verification
function testVNPaySignature() {
  // Test credentials (replace with your actual test credentials)
  const vnpHashSecret = 'your-test-hash-secret';
  
  // Sample VNPay parameters
  const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: 'your-test-tmn-code',
    vnp_Amount: '10000000', // 100,000 VND in cents
    vnp_CurrCode: 'VND',
    vnp_TxnRef: 'BK-1234567890-abc123',
    vnp_OrderInfo: 'Thanh toan ve xem phim BK-1234567890-abc123',
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: 'http://localhost:8000/payment/vnpay/return',
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: '20241225120000',
    vnp_ExpireDate: '20241225123000',
  };

  console.log('=== VNPay Signature Test ===');
  console.log('Original params:', vnpParams);

  // Sort parameters
  const sortedKeys = Object.keys(vnpParams).sort();
  const sortedParams = {};
  sortedKeys.forEach(key => {
    sortedParams[key] = vnpParams[key];
  });

  console.log('Sorted params:', sortedParams);

  // Method 1: Using qs.stringify
  const signData1 = qs.stringify(sortedParams, { encode: false });
  console.log('Sign data (qs.stringify):', signData1);

  // Method 2: Manual join
  const signData2 = Object.keys(sortedParams)
    .sort()
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');
  console.log('Sign data (manual):', signData2);

  // Create signatures
  const signature1 = crypto.createHmac('sha512', vnpHashSecret)
    .update(signData1)
    .digest('hex')
    .toUpperCase();

  const signature2 = crypto.createHmac('sha512', vnpHashSecret)
    .update(signData2)
    .digest('hex')
    .toUpperCase();

  console.log('Signature 1 (qs):', signature1);
  console.log('Signature 2 (manual):', signature2);
  console.log('Signatures match:', signature1 === signature2);

  // Test verification
  const testParams = { ...sortedParams, vnp_SecureHash: signature2 };
  console.log('Test params with signature:', testParams);

  // Verify
  const receivedHash = testParams.vnp_SecureHash;
  delete testParams.vnp_SecureHash;
  delete testParams.vnp_SecureHashType;

  const verifySignData = Object.keys(testParams)
    .sort()
    .map(key => `${key}=${testParams[key]}`)
    .join('&');

  const expectedSignature = crypto.createHmac('sha512', vnpHashSecret)
    .update(verifySignData)
    .digest('hex')
    .toUpperCase();

  console.log('Verify sign data:', verifySignData);
  console.log('Expected signature:', expectedSignature);
  console.log('Received signature:', receivedHash);
  console.log('Verification result:', expectedSignature === receivedHash);
}

// Test with sample return URL parameters
function testVNPayReturn() {
  console.log('\n=== VNPay Return URL Test ===');
  
  // Sample return URL parameters from VNPay
  const returnParams = {
    vnp_Amount: '10000000',
    vnp_BankCode: 'NCB',
    vnp_BankTranNo: 'VNP14123456',
    vnp_CardType: 'ATM',
    vnp_OrderInfo: 'Thanh toan ve xem phim BK-1234567890-abc123',
    vnp_PayDate: '20241225120500',
    vnp_ResponseCode: '00',
    vnp_TmnCode: 'your-test-tmn-code',
    vnp_TransactionNo: '14123456',
    vnp_TransactionStatus: '00',
    vnp_TxnRef: 'BK-1234567890-abc123',
    vnp_SecureHash: 'SAMPLE_HASH_FROM_VNPAY'
  };

  console.log('Return params:', returnParams);

  // This would be the verification process
  const vnpHashSecret = 'your-test-hash-secret';
  const secureHash = returnParams.vnp_SecureHash;
  
  const params = { ...returnParams };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const signData = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const expectedHash = crypto.createHmac('sha512', vnpHashSecret)
    .update(signData)
    .digest('hex')
    .toUpperCase();

  console.log('Sign data for verification:', signData);
  console.log('Expected hash:', expectedHash);
  console.log('Received hash:', secureHash);
}

// Run tests
testVNPaySignature();
testVNPayReturn();

console.log('\n=== Instructions ===');
console.log('1. Replace "your-test-hash-secret" with your actual VNPay hash secret');
console.log('2. Replace "your-test-tmn-code" with your actual VNPay terminal code');
console.log('3. Run: node test-vnpay-signature.js');
console.log('4. Compare the signature generation with your VNPay documentation');
