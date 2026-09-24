export interface Leitura {
  sensorId: string;
  tipo: string;
  unidade: string;
  valor: number;
  timestamp: number;
}

export interface MediaSensor {
  sensorId: string;
  tipo: string;
  unidade: string;
  media: number;
  quantidade: number;
}

export interface RegistroMedia extends MediaSensor {
  servidorId: string;
  loteId: string;
  calculadaEm: number;
}

export interface MsgLoteLeituras {
  tipo: "lote_leituras";
  servidorId: string;
  loteId: string;
  leituras: Leitura[];
}

export interface MsgAck {
  tipo: "ack";
  loteId: string;
  medias: MediaSensor[];
}

export interface MsgCalcularMedia {
  tipo: "calcular_media";
  loteId: string;
  leituras: Leitura[];
}

export interface MsgResultadoMedia {
  tipo: "resultado_media";
  loteId: string;
  medias: MediaSensor[];
}

export interface MsgConsultarMedias {
  tipo: "consultar_medias";
}

export interface MsgMediasArmazenadas {
  tipo: "medias_armazenadas";
  gatewayId: string;
  medias: RegistroMedia[];
}

export interface MsgErro {
  tipo: "erro";
  mensagem: string;
}

export type MensagemParaGateway = MsgLoteLeituras | MsgConsultarMedias;
export type MensagemParaServico = MsgCalcularMedia;

export type Mensagem =
  | MsgLoteLeituras
  | MsgAck
  | MsgCalcularMedia
  | MsgResultadoMedia
  | MsgConsultarMedias
  | MsgMediasArmazenadas
  | MsgErro;
