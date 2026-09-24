import * as net from "node:net";
import { enviar, receber, type Leitura, type Media } from "./protocolo.ts";

const porta: number = Number(process.argv[2] ?? 5050);

function calcularMedias(leituras: Leitura[]): Media[] {
  const grupos = new Map<string, Leitura[]>();
  for (const leitura of leituras) {
    const grupo = grupos.get(leitura.sensor) ?? [];
    grupo.push(leitura);
    grupos.set(leitura.sensor, grupo);
  }

  const medias: Media[] = [];
  for (const [sensor, grupo] of grupos) {
    const soma = grupo.reduce((total, l) => total + l.valor, 0);
    medias.push({
      sensor,
      unidade: grupo[0]!.unidade,
      media: Number((soma / grupo.length).toFixed(2)),
      quantidade: grupo.length,
    });
  }
  return medias;
}

const server: net.Server = net.createServer((socket: net.Socket) => {
  console.log(`[servico:${porta}] Gateway conectado: ${socket.remoteAddress}`);

  receber(socket, (msg) => {
    if (msg.tipo !== "calcular") return;

    const medias = calcularMedias(msg.leituras);
    console.log(`[servico:${porta}] ${msg.leituras.length} leituras de ${msg.servidor} -> ${medias.length} médias`);
    enviar(socket, { tipo: "medias", servidor: msg.servidor, medias });
  });

  socket.on("error", () => {});
});

server.listen(porta, "0.0.0.0", () => {
  console.log(`[servico:${porta}] Serviço de média rodando na porta ${porta}`);
});
