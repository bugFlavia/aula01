import { env, parseEndereco, requisitar } from "./compartilhado/rede.ts";

const gateway = parseEndereco(env("GATEWAY", "127.0.0.1:4000"));

const resposta = await requisitar(gateway, { tipo: "consultar_medias" });

if (resposta.tipo !== "medias_armazenadas") {
  console.error("Resposta inesperada:", resposta);
  process.exit(1);
}

console.log(
  `Médias armazenadas no ${resposta.gatewayId} (${gateway.host}:${gateway.port}):`,
);
console.table(
  resposta.medias.map((m) => ({
    sensor: m.sensorId,
    tipo: m.tipo,
    media: `${m.media.toFixed(2)} ${m.unidade}`,
    leituras: m.quantidade,
    lote: m.loteId,
    em: new Date(m.calculadaEm).toLocaleTimeString(),
  })),
);
