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

## Fórmulas (iguais à planilha Excel)

| Resultado | Fórmula |
|-----------|---------|
| Velocidade máxima | Último estágio de esforço com FC preenchida |
| iVO2máx | = velocidade máxima |
| VO2máx (ml.kg.min) | `2,21 × iVO2máx + 2,27` |
| VO2máx (L.min) | `(VO2máx × peso) / 1000` |
| METs | `VO2máx / 3,5` |
| Índice de FC | `FCmáx / FC repouso` |
| FC L1/L2 % | `FC limiar / FCmáx × 100` |
| % iVO2máx → km/h | `(% / 100) × iVO2máx` |

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
