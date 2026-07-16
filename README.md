# Planilha — Teste de Conconi na Esteira

Página web da **Profª Joyce Neres** para registrar o teste de Conconi na esteira, calcular limiar anaeróbico e zonas de treino, e enviar o resultado para cada aluna.

## Como usar

1. Abra `index.html` no navegador (ou publique no GitHub Pages).
2. Entre com a senha da profissional: `joyce2026`
3. Selecione ou adicione uma aluna (Vitória, Amanda, etc.).
4. Preencha os dados do teste e clique em **Gerar protocolo padrão** (aquecimento + estágios).
5. Informe **Borg** e **FC** de cada minuto/estágio.
6. Clique em **Calcular resultados**.
7. Envie pelo **WhatsApp**, **PDF** ou copie o texto do relatório.

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
