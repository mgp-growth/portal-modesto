# Modesto — Plataforma Unificada (protótipo)

Protótipo navegável da plataforma única da **Modesto Growth**, que reúne num só lugar:

- **Tasks** — Kanban (6 colunas), Quadro, Dashboard e Calendário de demandas, no visual do Modesto Tasks atual;
- **Documentos** — apresentações, propostas, diagnósticos e weeklys, com pasta por cliente;
- **Chat** — canais por cliente, canais internos e conversas diretas, em tempo real;
- **Administração** — cadastro completo de clientes (logo, ramo, descrição, cadeia de comando) e de pessoas (equipe ou cliente);
- **Avisos** — central de notificações que junta mensagens, prazos e entregas.

> ⚠️ Este é um **protótipo de front-end** (HTML/CSS/JS puro, arquivo único). Os dados são de exemplo e ficam na memória do navegador. Não há back-end conectado ainda — o objetivo é validar o desenho e os fluxos antes de construir sobre o Next.js + Supabase.

## Como ver

- **Online:** ative o GitHub Pages (Settings → Pages → branch `main`, pasta `/root`) e acesse a URL gerada.
- **Local:** basta abrir o `index.html` no navegador. Nenhuma dependência ou build.

## Destaques interativos

- Kanban com borda na cor do cliente, chip com logo, cronômetro por demanda e avatares dos responsáveis.
- Painel de **Filtros** completo (responsável, situação, prioridade, prazo…) que vale para Kanban, Quadro, Dashboard e Calendário ao mesmo tempo.
- **Detalhe da demanda** fiel ao app atual: status, prioridade, responsáveis, prazo, recorrência, descrição, subtarefas, tempo registrado e anotações (pública/interna).
- **Criar demanda pelo chat:** envie uma mensagem começando com `#adicionardemanda` e ela vira um card no Kanban.

### Sintaxe do `#adicionardemanda`

Em qualquer canal, envie:

```
#adicionardemanda
titulo: Ajustar gráfico de faturamento
cliente: Café Central
responsavel: Bianca, Ana
prazo: 30/07/2026
prioridade: alta
descricao: Cliente pediu revisão do gráfico na apresentação de junho.
```

- Só o **título** é obrigatório (pode ser inline: `#adicionardemanda Corrigir fuso do Google Ads`).
- Num **canal de cliente**, o cliente é preenchido automaticamente.
- `prazo` aceita `dd/mm/aaaa` ou `aaaa-mm-dd`; `prioridade` aceita alta/média/baixa; `responsavel` casa pelo primeiro nome da equipe.

## Próximos passos (roadmap técnico)

1. **Fase 0 — casco:** portar o layout para o projeto Next.js existente (o Portal), aposentando o tema atual.
2. **Fase 1 — Tasks:** ligar ao Supabase real (tabelas `tasks`, `task_notes`), com mutações via Server Actions.
3. **Fase 2 — Documentos:** reusar o bucket privado e os signed URLs já existentes.
4. **Fase 3 — Perfil:** corrigir a foto de perfil (Storage + colunas + policy de auto-edição).
5. **Fase 4 — Chat:** novas tabelas (`channels`, `channel_members`, `messages`), RLS e Realtime; incluindo o gatilho `#adicionardemanda`.
6. **Fase 5 — Marketing:** integração de métricas via Windsor.ai.

## Identidade

Fraunces (títulos) + Hanken Grotesk (corpo). Paleta *brass/papel* clara para o casco e *ink/brass* escura para o módulo de Tasks, seguindo o Modesto Tasks atual.
