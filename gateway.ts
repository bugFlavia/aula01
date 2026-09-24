import * as net from "node:net";
import { Conexao, receber, type Media } from "./protocolo.ts";

const porta: number = Number(process.argv[2] ?? 4000);
const servico: string = process.argv[3] ?? "127.0.0.1:5050";

const memoria = new Map<string, Media[]>();

const conexaoServico = new Conexao(servico, (msg) => {
  if (msg.tipo !== "medias") return;

  for (const media of msg.medias) {
    const historico = memoria.get(media.sensor) ?? [];
    historico.push(media);
    memoria.set(media.sensor, historico);
  }
  console.log(`[gateway:${porta}] Guardei ${msg.medias.length} médias de ${msg.servidor}`);
});

const server: net.Server = net.createServer((socket: net.Socket) => {
  console.log(`[gateway:${porta}] Servidor de sensores conectado: ${socket.remoteAddress}`);

  receber(socket, (msg) => {
    if (msg.tipo !== "leituras") return;

    const enviou = conexaoServico.enviar({ tipo: "calcular", servidor: msg.servidor, leituras: msg.leituras });
    if (!enviou) console.log(`[gateway:${porta}] Serviço fora do ar, lote de ${msg.servidor} descartado`);
  });

  socket.on("error", () => {});
});

setInterval(() => {
  if (memoria.size === 0) return;
  const tabela = [...memoria].map(([sensor, historico]) => {
    const ultima = historico[historico.length - 1]!;
    return { sensor, media: `${ultima.media} ${ultima.unidade}`, medias_guardadas: historico.length };
  });
  console.table(tabela);
}, 10000);

server.listen(porta, "0.0.0.0", () => {
  console.log(`[gateway:${porta}] Rodando na porta ${porta}. Serviço de média: ${servico}`);
});
