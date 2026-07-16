# Planilha — Teste de Conconi na Esteira

Página web da **Profª Joyce Neres** para registrar o teste de Conconi na esteira, calcular limiar anaeróbico e zonas de treino, e enviar o resultado para cada aluna.

## Como usar

1. Abra `index.html` no navegador (ou publique no GitHub Pages).
2. Entre com a senha da profissional: `joyce2026`
3. Selecione a aluna (Vitória, Amanda…) ou adicione uma nova.
4. Use as abas **Avaliação 1, 2, 3…** para cada teste realizado.
5. Preencha **peso**, **FC repouso** e, a cada minuto, **FC** e **PSE** na tabela.
6. Identifique **FC L1** e **FC L2** no gráfico e digite os valores.
7. Os resultados calculam **automaticamente** (como no Excel).
8. Envie pelo **WhatsApp** ou **PDF**.

## Foco: VVO2máx (velocidade)

O dado crítico é a **velocidade do último estágio completo** (ou interpolada se parar no meio). A **FC é opcional**.

| Resultado | Como é obtido |
|-----------|----------------|
| **VVO2máx** | Velocidade do último estágio de esforço com PSE (100%) ou interpolação |
| **Interpolação** | `V_anterior + (V_atual − V_anterior) × (% concluído / 100)` |
| **VO2máx** | `2,21 × VVO2máx + 2,27` |
| **METs** | `VO2máx / 3,5` |
| **Zonas de treino** | % da VVO2máx (ex.: 70–80% contínuo, 100–110% intervalado) |

## Como usar (sem FC)

1. Preencha **PSE** em cada minuto de esforço até a exaustão.
2. Ajuste **estágio final** e **% concluído** se parou no meio do estágio.
3. Resultados e prescrição calculam automaticamente.

## Protocolo (16 estágios)

- **Aquecimento** (min 1–3): 5 km/h
- **Esforço** (min 4–16): 6, 7, 8… até 18 km/h (+1 km/h por minuto)

## Funcionalidades

- Identidade visual alinhada ao [Guia de Corrida](https://github.com/joycenereseva/guiadecorrida) e [Guia de Medidas](https://github.com/joycenereseva/guiademedidas)
- Múltiplas alunas com dados salvos separadamente (localStorage)
- Tabela com scroll horizontal no celular
- Cálculo automático: ritmo, ΔFC, limiar (Dmax ou estágio manual), zonas % FC máx
- Gráfico FC × velocidade
- Envio para aluna via WhatsApp e PDF

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Planilha principal |
| `js/calculator.js` | Lógica do teste Conconi |
| `admin.html` | Códigos de acesso opcionais |
| `students.json` | Lista de códigos publicada |

## Publicação (GitHub Pages)

1. Repositório → Settings → Pages → Source: `main` / root
2. Acesse: `https://joycenereseva.github.io/planilhatestecorrida/`

---

© 2026 Profª Joyce Neres — #VAMOSJUNTAS
