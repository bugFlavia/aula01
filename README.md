# Sistema distribuído de sensores

```
┌──────────────────────┐  lote_leituras   ┌───────────┐  calcular_media   ┌─────────────────┐
│ Servidor de Sensores │ ───────────────► │  Gateway  │ ────────────────► │ Serviço de Média│
│ (4 sensores fictícios│ ◄─────────────── │ (guarda   │ ◄──────────────── │ (sem estado)    │
│  máquina A)          │       ack        │  médias em│  resultado_media  │  máquina C      │
└──────────────────────┘                  │  memória) │                   └─────────────────┘
                                          │ máquina B │ ◄── consultar_medias (consulta.ts)
                                          └───────────┘
```

Protocolo: TCP puro (`node:net`), 1 mensagem JSON por linha. Todos os formatos de
mensagem estão em [compartilhado/contratos.ts](compartilhado/contratos.ts).

| Componente | Arquivo | Porta padrão | Variáveis de ambiente |
|---|---|---|---|
| Serviço de média | `servico/servico-media.ts` | 5050 | `PORTA`, `SERVICO_ID` |
| Gateway | `gateway/gateway.ts` | 4000 | `PORTA`, `GATEWAY_ID`, `SERVICOS` (lista `host:porta,...`) |
| Servidor de sensores | `sensores/servidor-sensores.ts` | — | `SERVIDOR_ID`, `GATEWAY` (`host:porta`), `INTERVALO_LEITURA_MS`, `INTERVALO_ENVIO_MS` |
| Consulta | `consulta.ts` | — | `GATEWAY` |

## Rodando local (3 terminais, na ordem)

```bash
npm run servico
npm run gateway
npm run sensores
# em um 4º terminal, para ver o que o gateway guardou:
npm run consulta
```

## Rodando em várias máquinas

Em cada máquina: copie o projeto, rode `npm install`, descubra o IP
(`ipconfig getifaddr en0` no macOS, `hostname -I` no Linux, `ipconfig` no Windows).
Exemplo com C = `192.168.0.30`, B = `192.168.0.20`:

```bash
# Máquina C (serviço)
npm run servico

# Máquina B (gateway)
SERVICOS=192.168.0.30:5050 npm run gateway

# Máquina A (sensores)
GATEWAY=192.168.0.20:4000 npm run sensores

# De qualquer máquina
GATEWAY=192.168.0.20:4000 npm run consulta
```

Teste de conectividade antes: `nc -vz 192.168.0.20 4000`. Se falhar, libere a porta no firewall.
No macOS a porta 5000 é ocupada pelo AirPlay — por isso o serviço usa 5050.

## Escalando

- **Mais servidores de sensores:** rode outra instância com `SERVIDOR_ID` diferente.
- **Mais gateways:** rode outra instância com `GATEWAY_ID` (e `PORTA`, se na mesma máquina)
  diferentes; aponte cada servidor de sensores para o gateway desejado via `GATEWAY`.
- **Mais serviços de média:** o serviço não guarda estado; suba outra cópia e liste todas em
  `SERVICOS=ip1:5050,ip2:5050` — o gateway distribui em round-robin.
- **Novo sensor:** adicione um item na lista `sensores` em `servidor-sensores.ts`.
  Sensor real = nova classe que implementa a interface `Sensor` (`sensores/sensor.ts`).
- **Trocar memória por banco:** implemente `RepositorioMedias` (`gateway/repositorio-medias.ts`).
