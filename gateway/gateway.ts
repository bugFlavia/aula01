import * as net from "node:net";
import type { MsgLoteLeituras } from "../compartilhado/contratos.ts";
import {
  enviar,
  env,
  parseEndereco,
  receber,
  requisitar,
  type Endereco,
} from "../compartilhado/rede.ts";
import {
  RepositorioEmMemoria,
  type RepositorioMedias,
} from "./repositorio-medias.ts";

const gatewayId = env("GATEWAY_ID", "gateway-1");
const porta = Number(env("PORTA", "4000"));
const servicos: Endereco[] = env("SERVICOS", "127.0.0.1:5050")
  .split(",")
  .map(parseEndereco);

const repositorio: RepositorioMedias = new RepositorioEmMemoria();
let proximo = 0;
function escolherServico(): Endereco {
  const servico = servicos[proximo % servicos.length]!;
  proximo++;
  return servico;
}

async function processarLote(
  socket: net.Socket,
  lote: MsgLoteLeituras,
): Promise<void> {
  const servico = escolherServico();
  try {
    const resposta = await requisitar(servico, {
      tipo: "calcular_media",
      loteId: lote.loteId,
      leituras: lote.leituras,
    });
    if (resposta.tipo !== "resultado_media") {
      throw new Error(
        `Resposta inesperada do serviço: ${JSON.stringify(resposta)}`,
      );
    }

    const agora = Date.now();
    for (const m of resposta.medias) {
      repositorio.salvar({
        ...m,
        servidorId: lote.servidorId,
        loteId: lote.loteId,
        calculadaEm: agora,
      });
    }
    console.log(
      `[${gatewayId}] Lote ${lote.loteId}: ${resposta.medias.length} médias salvas (serviço ${servico.host}:${servico.port})`,
    );
    enviar(socket, {
      tipo: "ack",
      loteId: lote.loteId,
      medias: resposta.medias,
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.error(`[${gatewayId}] Falha no lote ${lote.loteId}: ${mensagem}`);
    enviar(socket, { tipo: "erro", mensagem });
  }
}

const server = net.createServer((socket: net.Socket) => {
  const origem = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[${gatewayId}] Nova conexão: ${origem}`);

  receber(socket, (msg) => {
    switch (msg.tipo) {
      case "lote_leituras":
        void processarLote(socket, msg);
        break;
      case "consultar_medias":
        enviar(socket, {
          tipo: "medias_armazenadas",
          gatewayId,
          medias: repositorio.listarUltimas(),
        });
        break;
      default:
        enviar(socket, {
          tipo: "erro",
          mensagem: `Tipo não suportado: ${msg.tipo}`,
        });
    }
  });

  socket.on("error", (erro) =>
    console.error(`[${gatewayId}] Erro com ${origem}: ${erro.message}`),
  );
  socket.on("close", () =>
    console.log(`[${gatewayId}] Conexão encerrada: ${origem}`),
  );
});

server.listen(porta, "0.0.0.0", () => {
  console.log(`[${gatewayId}] Gateway ouvindo na porta ${porta}`);
  console.log(
    `[${gatewayId}] Serviços de média: ${servicos.map((s) => `${s.host}:${s.port}`).join(", ")}`,
  );
});
