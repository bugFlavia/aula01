import * as net from 'node:net';
import type { Leitura, MediaSensor } from '../compartilhado/contratos.ts';
import { enviar, env, receber } from '../compartilhado/rede.ts';


const porta = Number(env('PORTA', '5050'));
const servicoId = env('SERVICO_ID', 'media-1');

export function calcularMedias(leituras: Leitura[]): MediaSensor[] {
    const grupos = new Map<string, { base: Leitura; soma: number; qtd: number }>();

    for (const l of leituras) {
        const g = grupos.get(l.sensorId);
        if (g) {
            g.soma += l.valor;
            g.qtd++;
        } else {
            grupos.set(l.sensorId, { base: l, soma: l.valor, qtd: 1 });
        }
    }

    return [...grupos.values()].map(({ base, soma, qtd }) => ({
        sensorId: base.sensorId,
        tipo: base.tipo,
        unidade: base.unidade,
        media: Number((soma / qtd).toFixed(4)),
        quantidade: qtd,
    }));
}

const server = net.createServer((socket: net.Socket) => {
    const origem = `${socket.remoteAddress}:${socket.remotePort}`;

    receber(socket, (msg) => {
        if (msg.tipo !== 'calcular_media') {
            enviar(socket, { tipo: 'erro', mensagem: `Tipo não suportado: ${msg.tipo}` });
            return;
        }
        const medias = calcularMedias(msg.leituras);
        console.log(`[${servicoId}] Lote ${msg.loteId} de ${origem}: ${msg.leituras.length} leituras -> ${medias.length} médias`);
        enviar(socket, { tipo: 'resultado_media', loteId: msg.loteId, medias });
    });

    socket.on('error', (erro) => console.error(`[${servicoId}] Erro com ${origem}: ${erro.message}`));
});

server.listen(porta, '0.0.0.0', () => {
    console.log(`[${servicoId}] Serviço de média ouvindo na porta ${porta}`);
});
