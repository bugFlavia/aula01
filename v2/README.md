# Sistema distribuído de sensores

```
servidor-sensores ──"leituras"──► gateway ──"calcular"──► servico
                                  gateway ◄──"medias"──── servico
                                  (guarda as médias em memória)
```

| Arquivo | O que é |
|---|---|
| `protocolo.ts` | As mensagens trocadas + funções de rede usadas por todos |
| `sensor.ts` | Classe `Sensor` (sensor fictício) |
| `talhao.ts` | Classe `Talhao`: dono dos sensores, lê todos de uma vez |
| `servidor-sensores.ts` | Um talhão: liga os sensores e envia as leituras ao gateway a cada 5s |
| `gateway.ts` | Recebe leituras, pede a média ao serviço, guarda na memória por talhão |
| `servico.ts` | Calcula a média de cada sensor de cada talhão |

## Como rodar

A configuração vai **no próprio comando**, depois do nome do arquivo:

```bash
node servico.ts            [porta]                            # padrão: 5050
node gateway.ts            [porta] [ip:porta-servico]         # padrão: 4000 127.0.0.1:5050
node servidor-sensores.ts  [id] [nome] [ip:porta-gateway]     # padrão: 1 "Talhão 01" 127.0.0.1:4000
```

Tudo local, 4 terminais (nesta ordem):

```bash
node servico.ts
node gateway.ts
node servidor-sensores.ts 1
node servidor-sensores.ts 2   # outro terminal: segundo talhão no mesmo gateway
```

## Adicionando mais

```bash
# mais um talhão no mesmo gateway (id novo, sem mexer em código)
node servidor-sensores.ts 2

# mais um gateway (porta diferente) e um talhão ligado nele
node gateway.ts 4001
node servidor-sensores.ts 3 "Talhão 03" 127.0.0.1:4001

# mais um serviço de média, usado por um gateway novo
node servico.ts 5051
node gateway.ts 4002 127.0.0.1:5051
```

Mais **sensores**: acrescente uma linha na lista dentro do `new Talhao(...)` em `servidor-sensores.ts`:
```ts
new Sensor("ruido", "dB", 30, 90),
```

## Em várias máquinas

Troque `127.0.0.1` pelo IP da máquina de destino (`ipconfig getifaddr en0` no Mac, `ipconfig` no Windows):

```bash
# Máquina C (192.168.0.30)
node servico.ts
# Máquina B (192.168.0.20)
node gateway.ts 4000 192.168.0.30:5050
# Máquina A
node servidor-sensores.ts sensores-1 192.168.0.20:4000
```

Precisa de Node 22.18+ (roda `.ts` direto). Libere as portas no firewall.
No macOS, evite a porta 5000 (é usada pelo AirPlay).
