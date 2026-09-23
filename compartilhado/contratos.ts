// =====================================================================
// CONTRATOS DO SISTEMA
// Todas as mensagens que trafegam na rede estão definidas aqui.
// Formato no fio: 1 objeto JSON por linha (terminado em '\n').
//
//   [Servidor de Sensores] --lote_leituras--> [Gateway] --calcular_media--> [Serviço]
//   [Servidor de Sensores] <------ack-------- [Gateway] <--resultado_media-- [Serviço]
//   [Cliente de consulta]  --consultar_medias--> [Gateway] --medias_armazenadas-->
// =====================================================================

/** Uma leitura individual de um sensor. */
export interface Leitura {
    sensorId: string;
    tipo: string;       // ex.: 'temperatura', 'umidade'
    unidade: string;    // ex.: '°C', '%'
    valor: number;
    timestamp: number;  // epoch em ms
}

/** Média calculada para um sensor. */
export interface MediaSensor {
    sensorId: string;
    tipo: string;
    unidade: string;
    media: number;
    quantidade: number; // quantas leituras entraram na média
}

/** Média já armazenada pelo gateway (inclui a origem). */
export interface RegistroMedia extends MediaSensor {
    servidorId: string;
    loteId: string;
    calculadaEm: number;
}

// ---------------- Servidor de Sensores -> Gateway ----------------

export interface MsgLoteLeituras {
    tipo: 'lote_leituras';
    servidorId: string;
    loteId: string;
    leituras: Leitura[];
}

export interface MsgAck {
    tipo: 'ack';
    loteId: string;
    medias: MediaSensor[];
}

// ---------------- Gateway -> Serviço de Média ----------------

export interface MsgCalcularMedia {
    tipo: 'calcular_media';
    loteId: string;
    leituras: Leitura[];
}

export interface MsgResultadoMedia {
    tipo: 'resultado_media';
    loteId: string;
    medias: MediaSensor[];
}

// ---------------- Consulta ao Gateway ----------------

export interface MsgConsultarMedias {
    tipo: 'consultar_medias';
}

export interface MsgMediasArmazenadas {
    tipo: 'medias_armazenadas';
    gatewayId: string;
    medias: RegistroMedia[];
}

// ---------------- Genérica ----------------

export interface MsgErro {
    tipo: 'erro';
    mensagem: string;
}

/** Mensagens que o gateway aceita. */
export type MensagemParaGateway = MsgLoteLeituras | MsgConsultarMedias;
/** Mensagens que o serviço de média aceita. */
export type MensagemParaServico = MsgCalcularMedia;

export type Mensagem =
    | MsgLoteLeituras
    | MsgAck
    | MsgCalcularMedia
    | MsgResultadoMedia
    | MsgConsultarMedias
    | MsgMediasArmazenadas
    | MsgErro;
