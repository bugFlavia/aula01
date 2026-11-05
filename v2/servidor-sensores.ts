import { Conexao, type Leitura } from "./protocolo.ts";
import { Sensor } from "./sensor.ts";
import { Talhao } from "./talhao.ts";

const id: number = Number(process.argv[2] ?? 1);
const nome: string = process.argv[3] ?? `Talhão ${String(id).padStart(2, "0")}`;
const gateway: string = process.argv[4] ?? "127.0.0.1:4000";

const talhao = new Talhao(id, nome, [
  new Sensor("temperatura", "°C", 15, 35),
  new Sensor("umidade", "%", 30, 90),
  new Sensor("is", "uW/cm²", 0, 1200),
]);

const conexao = new Conexao(gateway);
let pendentes: Leitura[] = [];

setInterval(() => {
  pendentes.push(...talhao.ler());
}, 1000);

setInterval(() => {
  if (pendentes.length === 0) return;

  const enviou = conexao.enviar({ tipo: "leituras", talhao: talhao.id, leituras: pendentes });
  if (enviou) {
    console.log(`[${talhao.nome}] Enviei ${pendentes.length} leituras ao gateway`);
    pendentes = [];
  }

}, 5000);

console.log(`[${talhao.nome}] ${talhao.sensores.length} sensores ligados. Gateway: ${gateway}`);
