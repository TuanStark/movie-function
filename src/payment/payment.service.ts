import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto-js';
import * as crypto_node from 'crypto';
import axios from 'axios';
import * as moment from 'moment';
import * as qs from 'qs';

export interface MoMoPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
}

export interface MoMoPaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export interface VNPayPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  returnUrl: string;
  ipAddr: string;
  locale?: string;
}

export interface VNPayPaymentResponse {
  vnpUrl: string;
  orderId: string;
  amount: number;
}

@Injectable()
export class PaymentService {
  // MoMo Configuration
  private readonly partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
  private readonly accessKey = process.env.MOMO_ACCESS_KEY || '';
  private readonly secretKey = process.env.MOMO_SECRET_KEY || '';
  private readonly endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';

  // VNPay Configuration
  private readonly vnpTmnCode = process.env.VNPAY_TMN_CODE || '2QXUI4B4';
  private readonly vnpHashSecret = process.env.VNPAY_HASH_SECRET || 'RAOEVONQL3DQIQMP7UYXNPGXCVOQFUYD';
  private readonly vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private readonly vnpVersion = '2.1.0';
  private readonly vnpCommand = 'pay';
  private readonly vnpCurrCode = 'VND';
  

  async createMoMoPayment(paymentData: MoMoPaymentRequest): Promise<MoMoPaymentResponse> {
    try {
      const requestId = paymentData.orderId;
      const requestType = 'captureWallet';
      const extraData = paymentData.extraData || '';
      const orderGroupId = '';
      const autoCapture = true;
      const lang = 'vi';

      // Create raw signature
      const rawSignature = `accessKey=${this.accessKey}&amount=${paymentData.amount}&extraData=${extraData}&ipnUrl=${paymentData.ipnUrl}&orderId=${paymentData.orderId}&orderInfo=${paymentData.orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${paymentData.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      // Generate signature
      const signature = crypto.HmacSHA256(rawSignature, this.secretKey).toString();

      const requestBody = {
        partnerCode: this.partnerCode,
        partnerName: 'Test',
        storeId: 'MomoTestStore',
        requestId: requestId,
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderInfo: paymentData.orderInfo,
        redirectUrl: paymentData.redirectUrl,
        ipnUrl: paymentData.ipnUrl,
        lang: lang,
        requestType: requestType,
        autoCapture: autoCapture,
        extraData: extraData,
        orderGroupId: orderGroupId,
        signature: signature,
      };

      console.log('MoMo Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(this.endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('MoMo Response:', response.data);

      if (response.data.resultCode === 0) {
        return response.data;
      } else {
        throw new BadRequestException(`MoMo payment failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error('MoMo Payment Error:', error);
      throw new BadRequestException('Failed to create MoMo payment');
    }
  }

  verifyMoMoSignature(data: any): boolean {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = data;

      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      const expectedSignature = crypto.HmacSHA256(rawSignature, this.secretKey).toString();

      return signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  async createVNPayPayment(paymentData: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
    try {
      const createDate = moment().format('YYYYMMDDHHmmss');
      const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');

      const vnpParams: any = {
        vnp_Version: this.vnpVersion,
        vnp_Command: this.vnpCommand,
        vnp_TmnCode: this.vnpTmnCode,
        vnp_Amount: paymentData.amount * 100, // VNPay requires amount in VND cents
        vnp_CurrCode: this.vnpCurrCode,
        vnp_TxnRef: paymentData.orderId,
        vnp_OrderInfo: paymentData.orderInfo,
        vnp_OrderType: 'other',
        vnp_Locale: paymentData.locale || 'vn',
        vnp_ReturnUrl: paymentData.returnUrl,
        vnp_IpAddr: paymentData.ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
      };

      // Sort parameters alphabetically
      const sortedParams = this.sortObject(vnpParams);

      // Create query string for signature - VNPay specific format
      const signData = Object.keys(sortedParams)
        .sort()
        .filter(key => sortedParams[key] !== '' && sortedParams[key] !== null && sortedParams[key] !== undefined)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');

      console.log('VNPay Sign Data:', signData);
      console.log('VNPay Hash Secret:', this.vnpHashSecret);

      // Create signature using Node.js crypto (not crypto-js)
      const signed = crypto_node
        .createHmac('sha512', this.vnpHashSecret)
        .update(signData, 'utf8')
        .digest('hex')
        .toUpperCase();

      console.log('VNPay Signature:', signed);

      // Add signature to params
      sortedParams.vnp_SecureHash = signed;

      // Create payment URL
      const vnpUrl = this.vnpUrl + '?' + qs.stringify(sortedParams, { encode: false });

      console.log('VNPay Request URL:', vnpUrl);

      return {
        vnpUrl,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
      };
    } catch (error) {
      console.error('VNPay Payment Error:', error);
      throw new BadRequestException('Failed to create VNPay payment');
    }
  }

  verifyVNPaySignature(vnpParams: any): boolean {
    try {
      const secureHash = vnpParams.vnp_SecureHash;

      // Create a copy to avoid modifying original
      const params = { ...vnpParams };
      delete params.vnp_SecureHash;
      delete params.vnp_SecureHashType;

      // Sort parameters alphabetically
      const sortedParams = this.sortObject(params);

      // Create query string for signature verification (same as creation)
      const signData = Object.keys(sortedParams)
        .sort()
        .filter(key => sortedParams[key] !== '' && sortedParams[key] !== null && sortedParams[key] !== undefined)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');

      console.log('VNPay Verify Sign Data:', signData);

      // Create signature using Node.js crypto (not crypto-js)
      const signed = crypto_node
        .createHmac('sha512', this.vnpHashSecret)
        .update(signData, 'utf8')
        .digest('hex')
        .toUpperCase();

      console.log('VNPay Expected Signature:', signed);
      console.log('VNPay Received Signature:', secureHash);

      // Compare signatures case-insensitive
      const isValid = secureHash.toUpperCase() === signed.toUpperCase();
      console.log('VNPay Signature Valid:', isValid);

      return isValid;
    } catch (error) {
      console.error('VNPay signature verification error:', error);
      return false;
    }
  }

  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  
}
