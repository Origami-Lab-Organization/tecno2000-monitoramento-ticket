// ── Mock data para validação do protótipo com o cliente ──
// TODO: Substituir por persistência real dos dados do TudoEntregue (/orders/finish)

const DRIVERS = [
  { Name: "Gilcimar Aparecido", PhoneCountry: "55", PhoneNumber: "4199887766", Tags: "||MOTORISTA TERCEIRIZADO||PLACA: BWG-7H48||" },
  { Name: "Romário Antônio Vieira", PhoneCountry: "55", PhoneNumber: "6299001122", Tags: "||MOTORISTA TERCEIRIZADO||PLACA: HDR-6A22||" },
  { Name: "Daniel Silva", PhoneCountry: "55", PhoneNumber: "3188170458", Tags: "||MOTORISTA TERCEIRIZADO||PLACA: DPF-6761||" },
  { Name: "Uanderson Teixeira", PhoneCountry: "55", PhoneNumber: "3199445566", Tags: "||MOTORISTA PRÓPRIO||PLACA: MRK-3B55||" },
  { Name: "Fernando Cury", PhoneCountry: "55", PhoneNumber: "1198776655", Tags: "||MOTORISTA TERCEIRIZADO||PLACA: FRC-9D12||" },
  { Name: "Alan Vilela", PhoneCountry: "55", PhoneNumber: "3497112233", Tags: "||MOTORISTA PRÓPRIO||PLACA: ALV-2C88||" },
  { Name: "Jhonathan Melo", PhoneCountry: "55", PhoneNumber: "4198223344", Tags: "||SL TRANSPORTES||PLACA: JHM-5F01||" },
  { Name: "Ricardo Souza", PhoneCountry: "55", PhoneNumber: "2199334455", Tags: "||MOTORISTA TERCEIRIZADO||PLACA: RSZ-7G33||" },
];

const DESTINATIONS = [
  { Name: "BANCO DO BRASIL SA", Address: "AV CELSO GARCIA", City: "SAO PAULO", State: "SP", ZipCode: "03064000" },
  { Name: "CONSTRUTORA HORIZONTE LTDA", Address: "RUA DAS PALMEIRAS 200", City: "CURITIBA", State: "PR", ZipCode: "80010000" },
  { Name: "INCORPORADORA VILA NOVA SA", Address: "AV BRASIL 1500", City: "CAMPINAS", State: "SP", ZipCode: "13010000" },
  { Name: "HOSPITAL SANTA LUCIA", Address: "SGAS 614", City: "BRASILIA", State: "DF", ZipCode: "70200000" },
  { Name: "SHOPPING CENTER ORION", Address: "AV T-10 1000", City: "GOIANIA", State: "GO", ZipCode: "74223000" },
  { Name: "ESCOLA ESTADUAL DOM PEDRO II", Address: "RUA DA LIBERDADE 300", City: "SALVADOR", State: "BA", ZipCode: "40020000" },
  { Name: "SUPERMERCADOS REDE FORTE", Address: "AV ASSIS BRASIL 5000", City: "PORTO ALEGRE", State: "RS", ZipCode: "91010000" },
  { Name: "PREFEITURA MUNICIPAL DE LONDRINA", Address: "RUA SERGIPE 640", City: "LONDRINA", State: "PR", ZipCode: "86010000" },
  { Name: "GRUPO HOTELEIRO ATLANTICO", Address: "AV BEIRA MAR 2500", City: "FORTALEZA", State: "CE", ZipCode: "60165000" },
  { Name: "RESIDENCIAL ARAUCARIA", Address: "RUA MARECHAL DEODORO 800", City: "CURITIBA", State: "PR", ZipCode: "80020000" },
  { Name: "METALURGICA NORTEÇO", Address: "DISTRITO INDUSTRIAL", City: "MANAUS", State: "AM", ZipCode: "69075000" },
  { Name: "ATACADAO DISTRIBUIDOR NORDESTE", Address: "BR-316 KM 5", City: "TERESINA", State: "PI", ZipCode: "64000000" },
  { Name: "CLINICA ODONTOLOGICA SORRIR BEM", Address: "RUA DO HOSPICIO 150", City: "RECIFE", State: "PE", ZipCode: "50050000" },
  { Name: "TECNO2000 FILIAL FORMIGA", Address: "RUA VEREADOR DECIO DE PAULA 101", City: "FORMIGA", State: "MG", ZipCode: "35570000" },
];

// Tipos de ocorrência reais do TudoEntregue da Tecno2000
const OCC_TYPES = {
  ENTREGUE: { code: "01", desc: "ENTREGUE", finisher: true, reportProblem: false },
  DESCARREGADO: { code: "04", desc: "01 MATERIAL DESCARREGADO NO CLIENTE (FOTO OBRIGATÓRIA)", finisher: false, reportProblem: false },
  TRANSBORDO: { code: "5", desc: "TRANSBORDO", finisher: false, reportProblem: false },
  CLIENTE_RECUSOU: { code: "03", desc: "CLIENTE RECUSOU", finisher: true, reportProblem: true },
  DIVERGENCIA: { code: "06", desc: "DIVERGÊNCIA NA QUANTIDADE DE VOLUMES", finisher: false, reportProblem: true },
  SINISTRO: { code: "25", desc: "SINISTRO COM CAMINHÃO E CARGA", finisher: false, reportProblem: true },
  NAO_ENVIADA: { code: "150", desc: "MERCADORIA NÃO FOI ENVIADA NA CARGA", finisher: false, reportProblem: true },
  RETORNO: { code: "09", desc: "RETORNO DE MATERIAL PARA TECNO2000 - ENTREGA NÃO REALIZADA", finisher: true, reportProblem: true },
  DEVOLUCAO: { code: "10", desc: "DEVOLUÇÃO DE NOTA FISCAL - RETORNO DO MATERIAL PARA TECNO2000", finisher: true, reportProblem: true },
  DESCARTE: { code: "100", desc: "02 DESCARTE DAS CHAPAS (OBRIGATÓRIA)", finisher: false, reportProblem: false },
  OUTROS: { code: "99", desc: "OUTROS", finisher: false, reportProblem: false },
};

function randomDate(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString();
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateOrders() {
  const orders: Record<string, unknown>[] = [];
  let orderId = 28000;

  // Distribuição por motorista: pedidos normais + ATs
  const driverConfig = [
    { driverIdx: 0, normalOrders: 58, ats: [
      { type: "TRANSBORDO", count: 5, obs: ["Transbordo R$ 200,00", "Transbordo autorizado pelo Bruno", "Transbordo Recife R$ 170,00", "Transbordo para interior do PR", "Transbordo emergencial"] },
      { type: "DIVERGENCIA", count: 2, obs: ["Faltou 2 volumes da NF 5938", "NF com 10 volumes, entregue 8"] },
      { type: "SINISTRO", count: 1, obs: ["Tombamento na BR-376, carga com avarias parciais. Boletim registrado."] },
    ]},
    { driverIdx: 1, normalOrders: 52, ats: [
      { type: "TRANSBORDO", count: 6, obs: ["Transbordo R$ 350,00 para Goiânia", "Transbordo autorizado", "Transbordo para região metropolitana", "Transbordo Anápolis", "Transbordo emergencial GO", "Transbordo Catalão"] },
      { type: "NAO_ENVIADA", count: 3, obs: ["Mercadoria não carregada no caminhão", "Item faltante na separação", "Volume ficou no CD"] },
    ]},
    { driverIdx: 2, normalOrders: 45, ats: [
      { type: "TRANSBORDO", count: 2, obs: ["Transbordo R$ 200,00", "Transbordo Recife R$ 200,00"] },
      { type: "CLIENTE_RECUSOU", count: 2, obs: ["Cliente alega produto diferente do pedido", "Cliente recusou por avaria visível na embalagem"] },
      { type: "DEVOLUCAO", count: 1, obs: ["Devolução total - cliente cancelou pedido após despacho"] },
    ]},
    { driverIdx: 3, normalOrders: 40, ats: [
      { type: "OUTROS", count: 8, obs: ["Atraso na entrega por rodovia interditada", "Endereço não localizado", "Cliente não estava no local", "Entrega reagendada pelo cliente", "Problema no acesso ao condomínio", "Chuva forte impediu descarga", "Portaria não autorizou entrada", "Cliente pediu reagendamento"] },
      { type: "DIVERGENCIA", count: 3, obs: ["3 volumes a menos que o informado na NF", "Peso divergente do declarado", "Volumes trocados entre NFs"] },
      { type: "SINISTRO", count: 2, obs: ["Colisão traseira na rodovia, sem vítimas. Carga parcialmente danificada.", "Pneu estourado na BR-040, atraso de 8h na entrega."] },
    ]},
    { driverIdx: 4, normalOrders: 35, ats: [
      { type: "OUTROS", count: 5, obs: ["Entrega parcial autorizada pelo comercial", "Material ficou em depósito terceiro", "Aguardando liberação do cliente", "Entrega feita em endereço alternativo", "Conferência com divergência resolvida no local"] },
      { type: "RETORNO", count: 2, obs: ["Retorno total - obra paralisada", "Retorno parcial - 3 volumes recusados"] },
    ]},
    { driverIdx: 5, normalOrders: 30, ats: [
      { type: "NAO_ENVIADA", count: 4, obs: ["Carga não foi separada a tempo", "Produto em falta no estoque", "Volume não coube no caminhão", "Erro na separação do lote"] },
      { type: "DESCARTE", count: 1, obs: ["Descarte de 5 chapas danificadas no transporte, impossível entregar"] },
    ]},
    { driverIdx: 6, normalOrders: 25, ats: [
      { type: "TRANSBORDO", count: 3, obs: ["Transbordo para interior do PR R$ 280,00", "Transbordo Ponta Grossa", "Transbordo Cascavel autorizado"] },
      { type: "CLIENTE_RECUSOU", count: 1, obs: ["Cliente alega que janelas vieram com medidas erradas"] },
    ]},
    { driverIdx: 7, normalOrders: 20, ats: [
      { type: "DIVERGENCIA", count: 2, obs: ["Faltaram 5 perfis de alumínio", "Quantidade de parafusos inferior ao pedido"] },
    ]},
  ];

  for (const cfg of driverConfig) {
    const driver = DRIVERS[cfg.driverIdx];

    // Pedidos normais (com ENTREGUE + DESCARREGADO)
    for (let i = 0; i < cfg.normalOrders; i++) {
      const id = String(orderId++);
      const dest = pick(DESTINATIONS);
      const depDate = randomDate("2024-01-01", "2025-04-14");
      const occDate = new Date(new Date(depDate).getTime() + 86400000 * (1 + Math.random() * 3)).toISOString();

      const occs: Record<string, unknown>[] = [];
      // ~70% tem DESCARREGADO
      if (Math.random() > 0.3) {
        occs.push({
          OccurrenceCode: OCC_TYPES.DESCARREGADO.code,
          OccurrenceDescription: OCC_TYPES.DESCARREGADO.desc,
          OccurrenceName: "",
          OccurrenceDocument: "",
          OccurrenceDate: occDate,
          OccurrenceDateUTC: occDate,
          Latitude: -23.5 + Math.random() * 10,
          Longitude: -46.6 + Math.random() * 10,
          Images: [],
          Observation: "MATERIAL DESCARREGADO (FOTO OBRIGATÓRIA)",
          Finisher: false,
          ReportProblem: false,
        });
      }
      occs.push({
        OccurrenceCode: OCC_TYPES.ENTREGUE.code,
        OccurrenceDescription: OCC_TYPES.ENTREGUE.desc,
        OccurrenceName: pick(["João", "Maria", "Carlos", "Ana", "Pedro", "Fernanda", "Lucas", "Patricia"]),
        OccurrenceDocument: String(100000 + Math.floor(Math.random() * 900000)),
        OccurrenceDate: occDate,
        OccurrenceDateUTC: occDate,
        Latitude: -23.5 + Math.random() * 10,
        Longitude: -46.6 + Math.random() * 10,
        Images: [{ ImageUrl: "https://via.placeholder.com/200" }],
        Observation: "ENTREGUE",
        Finisher: true,
        ReportProblem: false,
      });

      orders.push({
        Driver: { ...driver, ID: 0, DefineDriverAfter: 0, StatusDefault: 0, Status: null, _Alert: null, Email: null, ZipCode: null, City: null, State: null, Enable: false, IMEI: null, DeviceKey: null, DeviceId: null, DeviceType: null, OSName: null, OSVersion: null, PictureUrl: null, Picture: null, WithoutSimCard: false, LastAccess: null, ApplicationInstallMobile: false, AppVersion: null, LastActivationCode: null },
        Customer: { DocumentType: "CNPJ", DocumentNumber: "21306287000152" },
        DestinationAddress: { ...dest, Address2: "", AdditionalInformation: "", Country: "BRASIL", DocumentType: "CNPJ", DocumentNumber: "", Email: null, Region: null, Responsibility: null, PhoneCountry: "55", PhoneNumber: "", Number: null, Latitude: null, Longitude: null },
        OrderType: 1,
        OrderID: id,
        OrderNumber: id,
        OrderDescription: "NF-e",
        Documents: [{ DocumentID: `doc-${id}`, DocumentNumber: String(5000 + Number(id) % 1000), DocumentDescription: "Outro", Volume: 1 + Math.floor(Math.random() * 10), Weight: 10 + Math.random() * 200 }],
        Occurrences: occs,
        Status: [
          { Status: 5, StatusDescription: "Finalizada pelo Motorista", Date: occDate },
        ],
        Observation: String(5900 + Math.floor(Math.random() * 100)),
        DepartureDate: depDate,
        DepartureDateUTC: depDate,
        ScheduleDate: depDate,
        TrackingUrl: "",
      });
    }

    // Pedidos com AT
    for (const at of cfg.ats) {
      const occType = OCC_TYPES[at.type as keyof typeof OCC_TYPES];
      for (let i = 0; i < at.count; i++) {
        const id = String(orderId++);
        const dest = pick(DESTINATIONS);
        const depDate = randomDate("2024-01-01", "2025-04-14");
        const occDate = new Date(new Date(depDate).getTime() + 86400000 * (1 + Math.random() * 3)).toISOString();

        const occs: Record<string, unknown>[] = [
          {
            OccurrenceCode: occType.code,
            OccurrenceDescription: occType.desc,
            OccurrenceName: occType.reportProblem ? "" : pick(["João", "Maria", "Carlos"]),
            OccurrenceDocument: occType.reportProblem ? "" : "000000",
            OccurrenceDate: occDate,
            OccurrenceDateUTC: occDate,
            Latitude: -23.5 + Math.random() * 10,
            Longitude: -46.6 + Math.random() * 10,
            Images: Math.random() > 0.5 ? [{ ImageUrl: "https://via.placeholder.com/200" }] : [],
            Observation: at.obs[i % at.obs.length],
            Finisher: occType.finisher,
            ReportProblem: occType.reportProblem,
          },
        ];

        // Se não é finisher, adiciona ENTREGUE depois (~50%)
        if (!occType.finisher && Math.random() > 0.5) {
          occs.push({
            OccurrenceCode: OCC_TYPES.ENTREGUE.code,
            OccurrenceDescription: OCC_TYPES.ENTREGUE.desc,
            OccurrenceName: pick(["João", "Maria", "Carlos"]),
            OccurrenceDocument: "000000",
            OccurrenceDate: new Date(new Date(occDate).getTime() + 86400000).toISOString(),
            OccurrenceDateUTC: new Date(new Date(occDate).getTime() + 86400000).toISOString(),
            Latitude: -23.5 + Math.random() * 10,
            Longitude: -46.6 + Math.random() * 10,
            Images: [],
            Observation: "ENTREGUE",
            Finisher: true,
            ReportProblem: false,
          });
        }

        orders.push({
          Driver: { ...driver, ID: 0, DefineDriverAfter: 0, StatusDefault: 0, Status: null, _Alert: null, Email: null, ZipCode: null, City: null, State: null, Enable: false, IMEI: null, DeviceKey: null, DeviceId: null, DeviceType: null, OSName: null, OSVersion: null, PictureUrl: null, Picture: null, WithoutSimCard: false, LastAccess: null, ApplicationInstallMobile: false, AppVersion: null, LastActivationCode: null },
          Customer: { DocumentType: "CNPJ", DocumentNumber: "21306287000152" },
          DestinationAddress: { ...dest, Address2: "", AdditionalInformation: "", Country: "BRASIL", DocumentType: "CNPJ", DocumentNumber: "", Email: null, Region: null, Responsibility: null, PhoneCountry: "55", PhoneNumber: "", Number: null, Latitude: null, Longitude: null },
          OrderType: 1,
          OrderID: id,
          OrderNumber: id,
          OrderDescription: "NF-e",
          Documents: [{ DocumentID: `doc-${id}`, DocumentNumber: String(5000 + Number(id) % 1000), DocumentDescription: "Outro", Volume: 1 + Math.floor(Math.random() * 10), Weight: 10 + Math.random() * 200 }],
          Occurrences: occs,
          Status: [
            { Status: 5, StatusDescription: "Finalizada pelo Motorista", Date: occDate },
          ],
          Observation: String(5900 + Math.floor(Math.random() * 100)),
          DepartureDate: depDate,
          DepartureDateUTC: depDate,
          ScheduleDate: depDate,
          TrackingUrl: "",
        });
      }
    }
  }

  return orders;
}

// Cache em memória pra não regenerar a cada request
let cachedOrders: Record<string, unknown>[] | null = null;

export async function GET() {
  if (!cachedOrders) {
    cachedOrders = generateOrders();
  }
  return Response.json(cachedOrders);
}
