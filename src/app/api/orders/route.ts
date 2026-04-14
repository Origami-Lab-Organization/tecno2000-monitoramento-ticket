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

const PAGE_SIZE = 100;
// Máximo de chamadas sequenciais ao cursor (cada uma retorna ~100 pedidos)
const MAX_CALLS = 15;

export async function GET(request: NextRequest) {
  const baseUrl = process.env.TUDO_ENTREGUE_BASE_URL;
  const appKey = process.env.TUDO_ENTREGUE_APP_KEY;
  const requesterKey = process.env.TUDO_ENTREGUE_REQUESTER_KEY;

  if (!baseUrl || !appKey) {
    return Response.json(
      { error: 'Variáveis de ambiente do TudoEntregue não configuradas.' },
      { status: 500 },
    );
  }

  const { searchParams } = request.nextUrl;
  const maxCalls = Math.min(
    Number(searchParams.get('calls')) || 10,
    MAX_CALLS,
  );

  const headers: Record<string, string> = {
    AppKey: appKey,
    'Content-Type': 'application/json',
  };
  if (requesterKey) headers.RequesterKey = requesterKey;

  const extraParams = new URLSearchParams();
  ['phoneCountry', 'phoneNumber', 'orderType', 'orderID', 'partial'].forEach(
    (key) => {
      const v = searchParams.get(key);
      if (v) extraParams.set(key, v);
    },
  );

  const url = `${baseUrl}/orders/finish${extraParams.size ? `?${extraParams}` : ''}`;

  // A API do TudoEntregue usa cursor server-side:
  // cada chamada sequencial retorna os próximos 100 pedidos.
  const allOrders: Order[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < maxCalls; i++) {
    try {
      const res = await fetch(url, { headers, cache: 'no-store' });
      if (!res.ok) break;
      const data: Order[] = await res.json();
      if (!data.length) break;

      // Deduplica por OrderID (cursor pode repetir nas bordas)
      let newCount = 0;
      for (const order of data) {
        if (!seenIds.has(order.OrderID)) {
          seenIds.add(order.OrderID);
          allOrders.push(order);
          newCount++;
        }
      }

      // Se não veio nenhum novo, paramos
      if (newCount === 0) break;
      // Se retornou menos que PAGE_SIZE, acabou
      if (data.length < PAGE_SIZE) break;
    } catch {
      break;
    }
  }

  return Response.json(allOrders);
}
