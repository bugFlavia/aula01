import * as net from "node:net";
import type { Leitura, MsgLoteLeituras } from "../compartilhado/contratos.ts";
import { enviar, env, parseEndereco, receber } from "../compartilhado/rede.ts";
import { SensorSimulado, type Sensor } from "./sensor.ts";

const servidorId = env("SERVIDOR_ID", "sensores-1");
const gateway = parseEndereco(env("GATEWAY", "127.0.0.1:4000"));
const intervaloLeituraMs = Number(env("INTERVALO_LEITURA_MS", "1000"));
const intervaloEnvioMs = Number(env("INTERVALO_ENVIO_MS", "5000"));

const sensores: Sensor[] = [
  new SensorSimulado({
    id: `${servidorId}/temp`,
    tipo: "temperatura",
    unidade: "°C",
    min: 15,
    max: 35,
  }),
  new SensorSimulado({
    id: `${servidorId}/umid`,
    tipo: "umidade",
    unidade: "%",
    min: 30,
    max: 90,
  }),
  new SensorSimulado({
    id: `${servidorId}/pressao`,
    tipo: "pressao",
    unidade: "hPa",
    min: 990,
    max: 1030,
  }),
  new SensorSimulado({
    id: `${servidorId}/luz`,
    tipo: "luminosidade",
    unidade: "lux",
    min: 0,
    max: 1000,
  }),
];

let pendentes: Leitura[] = [];
setInterval(() => {
  for (const sensor of sensores) pendentes.push(sensor.ler());
}, intervaloLeituraMs);

let socket: net.Socket | null = null;
let contadorLotes = 0;

function conectar(): void {
  const s = net.createConnection(gateway);

  s.on("connect", () => {
    console.log(
      `[${servidorId}] Conectado ao gateway ${gateway.host}:${gateway.port}`,
    );
    socket = s;
  });

  receber(s, (msg) => {
    if (msg.tipo === "ack") {
      const resumo = msg.medias
        .map((m) => `${m.tipo}=${m.media.toFixed(2)}${m.unidade}`)
        .join("  ");
      console.log(
        `[${servidorId}] Lote ${msg.loteId} confirmado. Médias: ${resumo}`,
      );
    } else if (msg.tipo === "erro") {
      console.error(`[${servidorId}] Gateway respondeu erro: ${msg.mensagem}`);
    }
  });

  s.on("error", (erro) =>
    console.error(`[${servidorId}] Erro de conexão: ${erro.message}`),
  );

  s.on("close", () => {
    socket = null;
    console.log(`[${servidorId}] Desconectado. Tentando de novo em 3s...`);
    setTimeout(conectar, 3000);
  });
}

setInterval(() => {
  if (!socket || pendentes.length === 0) return;

  const lote: MsgLoteLeituras = {
    tipo: "lote_leituras",
    servidorId,
    loteId: `${servidorId}#${++contadorLotes}`,
    leituras: pendentes,
  };
  pendentes = [];
  enviar(socket, lote);
  console.log(
    `[${servidorId}] Enviado lote ${lote.loteId} com ${lote.leituras.length} leituras`,
  );
}, intervaloEnvioMs);

console.log(
  `[${servidorId}] Simulando ${sensores.length} sensores. Gateway: ${gateway.host}:${gateway.port}`,
);
conectar();
