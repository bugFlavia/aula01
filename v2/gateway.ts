import * as net from "node:net";
import { Conexao, receber, type Media } from "./protocolo.ts";

const porta: number = Number(process.argv[2] ?? 4000);
const servico: string = process.argv[3] ?? "127.0.0.1:5050";

const memoria = new Map<number, Map<string, Media[]>>();

const conexaoServico = new Conexao(servico, (msg) => {
  if (msg.tipo !== "medias") return;

  for (const media of msg.medias) {
    const porSensor = memoria.get(media.talhao) ?? new Map<string, Media[]>();
    const historico = porSensor.get(media.sensor) ?? [];
    historico.push(media);
    porSensor.set(media.sensor, historico);
    memoria.set(media.talhao, porSensor);
  }
  console.log(`[gateway:${porta}] Guardei ${msg.medias.length} médias do talhão ${msg.talhao}`);
});

const server: net.Server = net.createServer((socket: net.Socket) => {
  console.log(`[gateway:${porta}] Servidor de sensores conectado: ${socket.remoteAddress}`);

  receber(socket, (msg) => {
    if (msg.tipo !== "leituras") return;

    const enviou = conexaoServico.enviar({ tipo: "calcular", talhao: msg.talhao, leituras: msg.leituras });
    if (!enviou) console.log(`[gateway:${porta}] Serviço fora do ar, lote do talhão ${msg.talhao} descartado`);
  });

  socket.on("error", () => {});
});

setInterval(() => {
  if (memoria.size === 0) return;
  const tabela = [...memoria].flatMap(([talhao, porSensor]) =>
    [...porSensor].map(([sensor, historico]) => {
      const ultima = historico[historico.length - 1]!;
      return {
        talhao,
        sensor,
        media: `${ultima.media} ${ultima.unidade}`,
        medias_guardadas: historico.length,
      };
    }),
  );
  console.table(tabela);
}, 10000);

server.listen(porta, "0.0.0.0", () => {
  console.log(`[gateway:${porta}] Rodando na porta ${porta}. Serviço de média: ${servico}`);
});
