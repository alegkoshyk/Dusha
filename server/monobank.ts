import crypto from 'crypto';

const MONOBANK_API_URL = 'https://api.monobank.ua';

interface MonobankInvoiceRequest {
  amount: number;
  ccy?: number;
  merchantPaymInfo?: {
    reference?: string;
    destination?: string;
    comment?: string;
    basketOrder?: Array<{
      name: string;
      qty: number;
      sum: number;
      code?: string;
      icon?: string;
      unit?: string;
    }>;
  };
  redirectUrl?: string;
  webHookUrl?: string;
  validity?: number;
  paymentType?: 'debit' | 'hold';
}

interface MonobankInvoiceResponse {
  invoiceId: string;
  pageUrl: string;
}

interface MonobankInvoiceStatus {
  invoiceId: string;
  status: 'created' | 'processing' | 'hold' | 'success' | 'failure' | 'reversed' | 'expired';
  amount: number;
  ccy: number;
  createdDate: string;
  modifiedDate: string;
  reference?: string;
  destination?: string;
  failureReason?: string;
}

interface MonobankWebhookPayload {
  invoiceId: string;
  status: 'created' | 'processing' | 'hold' | 'success' | 'failure' | 'reversed' | 'expired';
  amount: number;
  ccy: number;
  createdDate: string;
  modifiedDate: string;
  reference?: string;
  destination?: string;
  failureReason?: string;
  paymentId?: string;
}

export class MonobankService {
  private token: string;
  private baseUrl: string;
  private publicKey: string | null = null;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = MONOBANK_API_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'X-Token': this.token,
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Monobank API error: ${response.status}`, errorText);
      throw new Error(`Monobank API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async createInvoice(params: {
    amount: number;
    reference: string;
    destination: string;
    redirectUrl: string;
    webhookUrl: string;
    validity?: number;
  }): Promise<MonobankInvoiceResponse> {
    const payload: MonobankInvoiceRequest = {
      amount: params.amount,
      ccy: 980,
      merchantPaymInfo: {
        reference: params.reference,
        destination: params.destination,
      },
      redirectUrl: params.redirectUrl,
      webHookUrl: params.webhookUrl,
      validity: params.validity || 3600,
      paymentType: 'debit',
    };

    console.log('Creating Monobank invoice:', JSON.stringify(payload, null, 2));

    return this.request<MonobankInvoiceResponse>('/api/merchant/invoice/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getInvoiceStatus(invoiceId: string): Promise<MonobankInvoiceStatus> {
    return this.request<MonobankInvoiceStatus>(
      `/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`
    );
  }

  async getPublicKey(): Promise<string> {
    if (this.publicKey) {
      return this.publicKey;
    }

    const response = await this.request<{ key: string }>('/api/merchant/pubkey');
    this.publicKey = response.key;
    return this.publicKey;
  }

  async verifyWebhookSignature(signature: string, body: string): Promise<boolean> {
    try {
      const pubKeyBase64 = await this.getPublicKey();
      const pubKeyPem = Buffer.from(pubKeyBase64, 'base64').toString('utf-8');
      
      const signatureBuffer = Buffer.from(signature, 'base64');
      const bodyHash = crypto.createHash('sha256').update(body).digest();
      
      const verifier = crypto.createVerify('sha256');
      verifier.update(bodyHash);
      
      return verifier.verify(pubKeyPem, signatureBuffer);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  parseWebhookPayload(body: string): MonobankWebhookPayload {
    return JSON.parse(body) as MonobankWebhookPayload;
  }

  async cancelInvoice(invoiceId: string, amount?: number): Promise<{ status: string }> {
    const payload: { invoiceId: string; extRef?: string; amount?: number } = {
      invoiceId,
    };
    
    if (amount !== undefined) {
      payload.amount = amount;
    }

    return this.request<{ status: string }>('/api/merchant/invoice/cancel', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export function createMonobankService(): MonobankService | null {
  const token = process.env.MONOBANK_TOKEN;
  if (!token) {
    console.warn('MONOBANK_TOKEN not configured - payments disabled');
    return null;
  }
  return new MonobankService(token);
}

export type { MonobankInvoiceResponse, MonobankInvoiceStatus, MonobankWebhookPayload };
