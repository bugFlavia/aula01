import type { RegistroMedia } from '../compartilhado/contratos.ts';

/** Onde o gateway guarda as médias. Trocar por um banco = nova implementação desta interface. */
export interface RepositorioMedias {
    salvar(registro: RegistroMedia): void;
    listarUltimas(): RegistroMedia[];
    historico(sensorId: string): RegistroMedia[];
}

/** Armazenamento em memória: some quando o processo do gateway termina. */
export class RepositorioEmMemoria implements RepositorioMedias {
    private dados = new Map<string, RegistroMedia[]>();
    private limitePorSensor: number;

    constructor(limitePorSensor = 100) {
        this.limitePorSensor = limitePorSensor;
    }

    salvar(registro: RegistroMedia): void {
        const lista = this.dados.get(registro.sensorId) ?? [];
        lista.push(registro);
        if (lista.length > this.limitePorSensor) lista.shift(); // evita crescer para sempre
        this.dados.set(registro.sensorId, lista);
    }

    listarUltimas(): RegistroMedia[] {
        const ultimas: RegistroMedia[] = [];
        for (const lista of this.dados.values()) {
            const ultima = lista.at(-1);
            if (ultima) ultimas.push(ultima);
        }
        return ultimas;
    }

    historico(sensorId: string): RegistroMedia[] {
        return [...(this.dados.get(sensorId) ?? [])];
    }
}
