import type { Leitura } from '../compartilhado/contratos.ts';

export interface Sensor {
    readonly id: string;
    ler(): Leitura;
}

export interface ConfigSensorSimulado {
    id: string;
    tipo: string;
    unidade: string;
    min: number;
    max: number;
}

export class SensorSimulado implements Sensor {
    readonly id: string;
    private config: ConfigSensorSimulado;
    private valorAtual: number;

    constructor(config: ConfigSensorSimulado) {
        this.id = config.id;
        this.config = config;
        this.valorAtual = (config.min + config.max) / 2;
    }

    ler(): Leitura {
        const { min, max, tipo, unidade } = this.config;
        const passo = (max - min) * 0.05;
        this.valorAtual += (Math.random() * 2 - 1) * passo;
        this.valorAtual = Math.min(max, Math.max(min, this.valorAtual));

        return {
            sensorId: this.id,
            tipo,
            unidade,
            valor: Number(this.valorAtual.toFixed(2)),
            timestamp: Date.now(),
        };
    }
}
