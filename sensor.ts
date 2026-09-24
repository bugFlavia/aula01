import type { Leitura } from "./protocolo.ts";

class Sensor {
  private nome: string;
  private unidade: string;
  private min: number;
  private max: number;
  private valor: number;

  constructor(nome: string, unidade: string, min: number, max: number) {
    this.nome = nome;
    this.unidade = unidade;
    this.min = min;
    this.max = max;
    this.valor = (min + max) / 2;
  }

  ler(servidor: string): Leitura {
    const passo = (this.max - this.min) * 0.05;
    this.valor += (Math.random() * 2 - 1) * passo;
    this.valor = Math.min(this.max, Math.max(this.min, this.valor));

    return {
      sensor: `${servidor}/${this.nome}`,
      unidade: this.unidade,
      valor: Number(this.valor.toFixed(2)),
    };
  }
}

export { Sensor };
