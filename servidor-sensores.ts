import { Conexao, type Leitura } from "./protocolo.ts";
import { Sensor } from "./sensor.ts";

const nome: string = process.argv[2] ?? "sensores-1";
const gateway: string = process.argv[3] ?? "127.0.0.1:4000";

const sensores: Sensor[] = [
  new Sensor("temperatura", "°C", 15, 35),
  new Sensor("umidade", "%", 30, 90),
  new Sensor("pressao", "hPa", 990, 1030),
  new Sensor("luminosidade", "lux", 0, 1000),
];

const conexao = new Conexao(gateway);
let pendentes: Leitura[] = [];

setInterval(() => {
  for (const sensor of sensores) {
    pendentes.push(sensor.ler(nome));
  }
}, 1000);

setInterval(() => {
  if (pendentes.length === 0) return;

  const enviou = conexao.enviar({ tipo: "leituras", servidor: nome, leituras: pendentes });
  if (enviou) {
    console.log(`[${nome}] Enviei ${pendentes.length} leituras ao gateway`);
    pendentes = [];
  }

}, 5000);

console.log(`[${nome}] ${sensores.length} sensores ligados. Gateway: ${gateway}`);
