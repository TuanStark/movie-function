import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsNumber()
  @Min(1000) // Minimum amount 1,000 VND
  amount: number;

  @IsString()
  orderInfo: string;

  @IsString()
  redirectUrl: string;

  @IsString()
  ipnUrl: string;

  @IsOptional()
  @IsString()
  extraData?: string;
}

export class CreateVNPayPaymentDto {
  @IsString()
  orderId: string;

  @IsNumber()
  @Min(1000) // Minimum amount 1,000 VND
  amount: number;

  @IsString()
  orderInfo: string;

  @IsString()
  returnUrl: string;

  @IsString()
  ipAddr: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

export class MoMoCallbackDto {
  @IsString()
  partnerCode: string;

  @IsString()
  orderId: string;

  @IsString()
  requestId: string;

  @IsNumber()
  amount: number;

  @IsString()
  orderInfo: string;

  @IsString()
  orderType: string;

  @IsString()
  transId: string;

  @IsNumber()
  resultCode: number;

  @IsString()
  message: string;

  @IsString()
  payType: string;

  @IsNumber()
  responseTime: number;

  @IsOptional()
  @IsString()
  extraData?: string;

  @IsString()
  signature: string;
}

export class VNPayCallbackDto {
  @IsString()
  vnp_TmnCode: string;

  @IsString()
  vnp_Amount: string;

  @IsString()
  vnp_BankCode: string;

  @IsString()
  vnp_BankTranNo: string;

  @IsString()
  vnp_CardType: string;

  @IsString()
  vnp_PayDate: string;

  @IsString()
  vnp_OrderInfo: string;

  @IsString()
  vnp_TransactionNo: string;

  @IsString()
  vnp_ResponseCode: string;

  @IsString()
  vnp_TransactionStatus: string;

  @IsString()
  vnp_TxnRef: string;

  @IsString()
  vnp_SecureHashType: string;

  @IsString()
  vnp_SecureHash: string;
}
