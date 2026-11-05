import type { Buffer } from "node:buffer";
import * as net from "node:net";

export interface Leitura {
  sensor: string; 
  unidade: string; 
  valor: number;
}

export interface Media {
  sensor: string;
  unidade: string;
  media: number;
  quantidade: number; 
}

export interface MsgLeituras {
  tipo: "leituras";
  servidor: string;
  leituras: Leitura[];
}

export interface MsgCalcular {
  tipo: "calcular";
  servidor: string;
  leituras: Leitura[];
}

export interface MsgMedias {
  tipo: "medias";
  servidor: string;
  medias: Media[];
}

export type Mensagem = MsgLeituras | MsgCalcular | MsgMedias;


export function enviar(socket: net.Socket, msg: Mensagem): void {
  socket.write(JSON.stringify(msg) + "\n");
}

export function receber(socket: net.Socket, aoReceber: (msg: Mensagem) => void): void {
  let buffer = "";
  socket.on("data", (dados: Buffer) => {
    buffer += dados.toString("utf8");
    let fim: number;
    while ((fim = buffer.indexOf("\n")) >= 0) {
      const linha = buffer.slice(0, fim);
      buffer = buffer.slice(fim + 1);
      if (linha.trim()) aoReceber(JSON.parse(linha) as Mensagem);
    }
  });
}

export function lerEndereco(texto: string): { host: string; port: number } {
  const [host = "127.0.0.1", porta = "0"] = texto.split(":");
  return { host, port: Number(porta) };
}

export class Conexao {
  private destino: string;
  private aoReceber: (msg: Mensagem) => void;
  private socket: net.Socket | null = null;

  constructor(destino: string, aoReceber: (msg: Mensagem) => void = () => {}) {
    this.destino = destino;
    this.aoReceber = aoReceber;
    this.conectar();
  }

  enviar(msg: Mensagem): boolean {
    if (!this.socket) return false;
    enviar(this.socket, msg);
    return true;
  }

  private conectar(): void {
    const socket = net.createConnection(lerEndereco(this.destino));
    socket.on("connect", () => {
      console.log(`Conectado a ${this.destino}`);
      this.socket = socket;
    });
    receber(socket, this.aoReceber);
    socket.on("error", () => {}); 
    socket.on("close", () => {
      this.socket = null;
      console.log(`Sem conexão com ${this.destino}. Tentando de novo em 3s...`);
      setTimeout(() => this.conectar(), 3000);
    });
  }
}
