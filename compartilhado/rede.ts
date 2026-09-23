import type { Buffer } from 'node:buffer';
import * as net from 'node:net';
import type { Mensagem } from './contratos.ts';


export function enviar(socket: net.Socket, msg: Mensagem): void {
    socket.write(JSON.stringify(msg) + '\n');
}

export function receber(socket: net.Socket, aoReceber: (msg: Mensagem) => void): void {
    let buffer = '';
    socket.on('data', (dados: Buffer) => {
        buffer += dados.toString('utf8');
        let fim: number;
        while ((fim = buffer.indexOf('\n')) >= 0) {
            const linha = buffer.slice(0, fim).trim();
            buffer = buffer.slice(fim + 1);
            if (!linha) continue;
            try {
                aoReceber(JSON.parse(linha) as Mensagem);
            } catch {
                console.error(`Mensagem inválida descartada: ${linha}`);
            }
        }
    });
}

export function requisitar(endereco: Endereco, msg: Mensagem, timeoutMs = 5000): Promise<Mensagem> {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection(endereco);
        socket.setTimeout(timeoutMs, () => {
            socket.destroy();
            reject(new Error(`Timeout falando com ${endereco.host}:${endereco.port}`));
        });
        socket.on('connect', () => enviar(socket, msg));
        socket.on('error', reject);
        receber(socket, (resposta) => {
            resolve(resposta);
            socket.end();
        });
    });
}

export interface Endereco {
    host: string;
    port: number;
}

export function parseEndereco(texto: string): Endereco {
    const [host, porta] = texto.trim().split(':');
    if (!host || !porta || Number.isNaN(Number(porta))) {
        throw new Error(`Endereço inválido: "${texto}" (use host:porta)`);
    }
    return { host, port: Number(porta) };
}

export function env(nome: string, padrao: string): string {
    return process.env[nome] ?? padrao;
}
