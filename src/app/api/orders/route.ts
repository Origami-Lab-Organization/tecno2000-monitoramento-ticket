import { NextRequest } from 'next/server';

export interface OrderOccurrence {
  OccurrenceCode: string;
  OccurrenceName: string;
  OccurrenceDocument: string;
  OccurrenceDate: string;
  Latitude: number;
  Longitude: number;
  Images: { ImageUrl: string }[];
  Observation: string;
}

export interface OrderVolume {
  VolumeID: string;
  Count: number;
  Unity: string;
  Description: string;
  BarCode: string;
  Read: number;
}

export interface OrderDocument {
  DocumentID: string;
  DocumentNumber: string;
  DocumentDescription: string;
  Volumes: OrderVolume[];
  Occurrences: OrderOccurrence[];
}

export interface OrderStatus {
  Status: number;
  StatusDescription: string;
  Date: string;
}

export interface Order {
  Driver: { PhoneCountry: string; PhoneNumber: string };
  Customer: { DocumentType: string; DocumentNumber: string };
  OrderType: number;
  OrderID: string;
  OrderNumber: string;
  OrderDescription: string;
  Documents: OrderDocument[];
  Occurrences: OrderOccurrence[];
  Status: OrderStatus[];
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.TUDO_ENTREGUE_BASE_URL;
  const appKey = process.env.TUDO_ENTREGUE_APP_KEY;
  const requesterKey = process.env.TUDO_ENTREGUE_REQUESTER_KEY;

  if (!baseUrl || !appKey) {
    return Response.json(
      { error: 'Variáveis de ambiente do TudoEntregue não configuradas.' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams();
  const { searchParams } = request.nextUrl;

  ['phoneCountry', 'phoneNumber', 'orderType', 'orderID', 'partial'].forEach(key => {
    const v = searchParams.get(key);
    if (v) params.set(key, v);
  });

  const headers: Record<string, string> = {
    AppKey: appKey,
    'Content-Type': 'application/json',
  };
  if (requesterKey) headers.RequesterKey = requesterKey;

  const url = `${baseUrl}/orders/finish${params.size ? `?${params}` : ''}`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const body = await res.text();
    return Response.json(
      { error: `TudoEntregue respondeu com status ${res.status}`, detail: body },
      { status: res.status }
    );
  }

  const data: Order[] = await res.json();
  return Response.json(data);
}
