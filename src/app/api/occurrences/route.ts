import { NextRequest } from "next/server";

export interface OccurrenceItem {
  OccurrenceCode: string;
  OccurrenceDescription: string;
  Finisher: boolean;
  ReportProblem: boolean;
  Detail: boolean;
  AttachmentRequired: boolean;
  ObservationModel: string;
  ExpirationTimeInMinutes: number;
  IsVisibleForTracking: boolean;
  Enable: boolean;
}

export interface OccurrencesResponse {
  Customer: {
    DocumentType: string;
    DocumentNumber: string;
    Name: string;
    Occurrences: OccurrenceItem[];
  };
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.TUDO_ENTREGUE_BASE_URL;
  const appKey = process.env.TUDO_ENTREGUE_APP_KEY;
  const requesterKey = process.env.TUDO_ENTREGUE_REQUESTER_KEY;
  const documentType = process.env.TUDO_ENTREGUE_DOCUMENT_TYPE;
  const documentNumber = process.env.TUDO_ENTREGUE_DOCUMENT_NUMBER;

  if (
    !baseUrl ||
    !appKey ||
    !requesterKey ||
    !documentType ||
    !documentNumber
  ) {
    return Response.json(
      { error: "Variáveis de ambiente do TudoEntregue não configuradas." },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({ documentType, documentNumber });

  const occurrenceCode = request.nextUrl.searchParams.get("occurrenceCode");
  if (occurrenceCode) params.set("occurrenceCode", occurrenceCode);

  const res = await fetch(`${baseUrl}/occurrences?${params}`, {
    headers: {
      AppKey: appKey,
      RequesterKey: requesterKey,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    return Response.json(
      {
        error: `TudoEntregue respondeu com status ${res.status}`,
        detail: body,
      },
      { status: res.status }
    );
  }

  const data: OccurrencesResponse = await res.json();
  return Response.json(data);
}
