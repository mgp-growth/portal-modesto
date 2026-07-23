/* =====================================================================
   Modesto — camada de dados real (Supabase)
   ---------------------------------------------------------------------
   Este arquivo liga o protótipo ao MESMO backend Supabase que o Modesto
   Tasks e o Portal já usam. Ele:
     1. autentica (login por e-mail/senha do próprio Supabase Auth);
     2. carrega clients, profiles (os "usuários"/equipe) e tasks;
     3. traduz as colunas do banco para o formato que o Kanban usa;
     4. mantém tudo vivo por Realtime (postgres_changes), como o Tasks já faz.

   IMPORTANTE — tabelas: o schema.sql do Portal cobre clients, profiles,
   documents e client_accounts. As tabelas `tasks` e `task_notes` foram
   criadas à parte para o Modesto Tasks; os nomes de coluna abaixo saíram
   direto do código do app atual. Se algum nome divergir no seu banco,
   ajuste no mapa COLMAP e em fromRow()/toRow() — é o único lugar a mexer.

   Uso no protótipo (index.html): inclua o SDK e este arquivo ANTES do
   </body>, e chame Modesto.initLive() no lugar dos dados de exemplo:

     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="./supabase-data.js"></script>
     <script>
       Modesto.initLive({
         onReady(){ renderT(); updHub(); renderChatNav(); },
         onTasksChange(){ renderT(); updHub(); },
       });
     </script>

   Na plataforma real (Next.js), a leitura vai para Server Components e a
   escrita para Server Actions com assertAdmin(); a lógica de mapeamento
   (fromRow/toRow) é a mesma e pode ser copiada tal e qual.
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---- credenciais: as MESMAS do Modesto Tasks (anon é pública) ---- */
  const SUPABASE_URL  = 'https://eeqaabwsheaiwyhujcqj.supabase.co';
  const SUPABASE_ANON = 'sb_publishable_AIjaigmy_i-aKNV1zkC8NQ_3-ZmQLfi';

  let sb = null;
  let ME = null;            // { id, email, name, role, client_id }

  /* estado exposto — os mesmos arrays que o protótipo já consome */
  const state = {
    CLIENTS: [],            // [{id,nome,cor,logo,ramo,desc,chain}]
    TEAM: [],               // [{nome,email,cargo,papel,id,client_id}]
    TASKS: [],              // formato do kanban (ver fromRow)
  };

  /* ---- status do banco ↔ colunas do protótipo -------------------- */
  /* o Tasks real usa 'Em Andamento' e 'Concluído Atendimento'; o
     protótipo v3 usa 'Em andamento' e 'Concluído'. Normalizamos aqui. */
  const STATUS_IN = {
    'Não iniciado': 'Não iniciado',
    'Entregas do dia': 'Entregas do dia',
    'Em Andamento': 'Em andamento',
    'Em andamento': 'Em andamento',
    'Impeditivo/Aprovação': 'Impeditivo/Aprovação',
    'Feito': 'Feito',
    'Concluído Atendimento': 'Concluído',
    'Concluído': 'Concluído',
  };
  const STATUS_OUT = {           // protótipo → banco (para salvar)
    'Não iniciado': 'Não iniciado',
    'Entregas do dia': 'Entregas do dia',
    'Em andamento': 'Em Andamento',
    'Impeditivo/Aprovação': 'Impeditivo/Aprovação',
    'Feito': 'Feito',
    'Concluído': 'Concluído Atendimento',
  };
  const PRIO_IN = { 'Alta':'alta','alta':'alta','Média':'media','Media':'media','media':'media','Baixa':'baixa','baixa':'baixa','':'media', null:'media' };

  const PALETTE = ['#D9531E','#1F9E5A','#2D6FCF','#8E3FBE','#E0A200','#12A38F','#D01F45','#5E8A00','#C25A00','#0E8FA8','#B5306E','#3949C0'];
  const firstName = n => (n||'').trim().split(/\s+/)[0] || '';

  /* ---- tradução: linha do banco → card do kanban ---- */
  function fromRow(r, clientById) {
    return {
      id: r.id,
      c: r.client_id,
      t: r.title || r.titulo || '(sem título)',
      s: STATUS_IN[r.status] || 'Não iniciado',
      // assignees no banco é text[]; o kanban usa nomes completos.
      who: Array.isArray(r.assignees) ? r.assignees.slice() : [],
      due: r.prazo || '',
      pr: PRIO_IN[r.prioridade] || 'media',
      desc: r.description || r.descricao || '',
      sec: Math.round(r.time_spent || 0),
      run: !!r.timer_start,
      runTs: r.timer_start ? new Date(r.timer_start).getTime() : null,
      // subtasks no banco é jsonb: [{t/label, done}]
      subs: Array.isArray(r.subtasks) ? r.subtasks.map(s => ({ t: s.t || s.label || s.text || '', done: !!s.done })) : [],
      notes: [],             // carregadas sob demanda (task_notes) ao abrir
      rec: r.recorrencia || r.rec || 'Nenhuma',
      position: r.position ?? 0,
      _raw: r,               // guarda a linha crua p/ updates parciais
    };
  }

  /* ---- tradução: card do kanban → payload p/ o banco (salvar) ---- */
  function toRow(t) {
    return {
      client_id: t.c,
      title: t.t,
      status: STATUS_OUT[t.s] || 'Não iniciado',
      assignees: t.who,
      prazo: t.due || null,
      prioridade: t.pr,
      description: t.desc,
      subtasks: t.subs,
      recorrencia: t.rec,
    };
  }

  /* ================= AUTH ================= */
  async function signIn(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return loadMe();
  }
  async function signOut() { await sb.auth.signOut(); }

  async function loadMe() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return (ME = null);
    const { data: p } = await sb.from('profiles').select('*').eq('id', user.id).single();
    ME = {
      id: user.id,
      email: user.email,
      name: (p && p.nome) || user.email.split('@')[0],
      role: (p && p.role) || 'client',
      client_id: p ? p.client_id : null,
      avatar_url: p ? p.avatar_url : null,
    };
    return ME;
  }
  const isAdmin = () => ME && ME.role === 'admin';

  /* ================= LOADS ================= */
  async function loadClients() {
    const { data, error } = await sb.from('clients').select('*').order('nome');
    if (error) throw error;
    state.CLIENTS = (data || []).map((c, i) => ({
      id: c.id,
      nome: c.nome,
      cor: PALETTE[i % PALETTE.length],   // cor derivada estável (banco não guarda cor hoje)
      logo: c.logo_url || null,
      ramo: c.ramo || '',                 // colunas extras aparecem quando existirem
      desc: c.descricao || c.desc || '',
      chain: Array.isArray(c.chain) ? c.chain : [],
    }));
    return state.CLIENTS;
  }

  /* profiles = usuários. Admin lê todos; cliente lê o que a RLS liberar. */
  async function loadProfiles() {
    const { data, error } = await sb.from('profiles').select('id,nome,role,client_id,avatar_url');
    if (error) throw error;
    state.TEAM = (data || []).map(p => ({
      id: p.id,
      nome: p.nome || '(sem nome)',
      email: '',                          // e-mail vive no auth.users; não exposto no profiles
      cargo: p.role === 'admin' ? 'Equipe' : 'Cliente',
      papel: p.role === 'admin' ? 'equipe' : 'cliente',
      client_id: p.client_id || null,
      avatar: p.avatar_url || null,
    }));
    return state.TEAM;
  }

  async function loadTasks() {
    const { data, error } = await sb.from('tasks')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    state.TASKS = (data || []).map(r => fromRow(r));
    return state.TASKS;
  }

  /* anotações de uma demanda (task_notes) — respeita visibility por RLS */
  async function loadNotes(taskId) {
    const { data, error } = await sb.from('task_notes')
      .select('*').eq('task_id', taskId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(n => ({
      who: n.author_name || '—',
      tx: n.body || '',
      vis: n.visibility === 'internal' || n.visibility === 'interna' ? 'interna' : 'publica',
      tm: (n.created_at || '').slice(11, 16),
    }));
  }

  /* ================= ESCRITA (equipe/admin) =================
     No protótipo isso vai direto pela anon key (RLS protege). Na
     plataforma real, mova para Server Actions com assertAdmin(). */
  async function createTask(t) {
    const payload = toRow(t);
    payload.position = 0;
    const { data, error } = await sb.from('tasks').insert(payload).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  async function updateTask(id, patch) {
    // patch já no formato do banco (use toRow(t) e escolha os campos)
    const { error } = await sb.from('tasks').update(patch).eq('id', id);
    if (error) throw error;
  }
  async function deleteTask(id) {
    const { error } = await sb.from('tasks').delete().eq('id', id);
    if (error) throw error;
  }
  async function addNote(taskId, body, visibility) {
    const { data, error } = await sb.from('task_notes').insert({
      task_id: taskId, author_id: ME.id, author_name: ME.name,
      body, visibility: visibility === 'interna' ? 'internal' : 'public',
    }).select().single();
    if (error) throw error;
    return data;
  }

  /* ================= REALTIME ================= */
  let channel = null;
  function subscribe(onTasksChange) {
    channel = sb.channel('tasks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' },
        async () => { await loadTasks(); onTasksChange && onTasksChange(); })
      .subscribe();
  }

  /* ================= BOOTSTRAP ================= */
  async function initLive(opts) {
    opts = opts || {};
    if (!global.supabase || !global.supabase.createClient) {
      console.error('[Modesto] SDK do Supabase não carregou. Inclua @supabase/supabase-js antes deste arquivo.');
      opts.onError && opts.onError(new Error('sdk-missing'));
      return;
    }
    sb = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    global.Modesto.sb = sb;

    await loadMe();
    if (!ME) {                          // sem sessão → precisa logar
      opts.onNeedLogin && opts.onNeedLogin();
      return;
    }
    try {
      await Promise.all([loadClients(), loadProfiles(), loadTasks()]);
      subscribe(opts.onTasksChange);
      opts.onReady && opts.onReady(state, ME);
    } catch (e) {
      console.error('[Modesto] erro carregando dados:', e);
      opts.onError && opts.onError(e);
    }
  }

  /* API pública */
  global.Modesto = {
    initLive, signIn, signOut, loadMe, isAdmin,
    loadClients, loadProfiles, loadTasks, loadNotes,
    createTask, updateTask, deleteTask, addNote,
    fromRow, toRow, state, get ME(){ return ME; },
    STATUS_IN, STATUS_OUT,
  };
})(window);
