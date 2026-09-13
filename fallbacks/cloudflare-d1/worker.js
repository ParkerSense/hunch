// Hunch D1 read/write prototype worker.
// GET  /projects  - bearer READ_TOKEN, returns all rows as JSON (browser read path)
// POST /projects  - bearer WRITE_TOKEN, upserts rows by slug (assistant writer path)
// Tokens travel in the Authorization header, never the URL (keeps them out of access logs).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    };
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    if (url.pathname === '/projects' && request.method === 'GET') {
      if (token !== env.READ_TOKEN) return json({ error: 'unauthorized' }, 401, headers);
      const { results } = await env.DB.prepare(
        'SELECT slug,title,category,state,status,last_update,last_update_at,next_move,sort FROM projects ORDER BY state, sort'
      ).all();
      return json({ generated_at: new Date().toISOString(), projects: results }, 200, headers);
    }
    if (url.pathname === '/projects' && request.method === 'POST') {
      if (token !== env.WRITE_TOKEN) return json({ error: 'unauthorized' }, 401, headers);
      const rows = await request.json();
      if (!Array.isArray(rows)) return json({ error: 'array expected' }, 400, headers);
      const stmt = env.DB.prepare(
        `INSERT INTO projects (slug,title,category,state,status,last_update,last_update_at,next_move,sort)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON CONFLICT(slug) DO UPDATE SET title=excluded.title,category=excluded.category,state=excluded.state,
           status=excluded.status,last_update=excluded.last_update,last_update_at=excluded.last_update_at,
           next_move=excluded.next_move,sort=excluded.sort`
      );
      await env.DB.batch(rows.map(r => stmt.bind(
        r.slug, r.title, r.category ?? 'personal', r.state ?? 'active', r.status ?? '',
        r.last_update ?? '', r.last_update_at ?? new Date().toISOString(), r.next_move ?? null, r.sort ?? 50)));
      return json({ upserted: rows.length }, 200, headers);
    }
    if (url.pathname === '/health') return json({ ok: true }, 200, headers);
    return json({ error: 'not found' }, 404, headers);
  },
};
function json(body, status, headers) { return new Response(JSON.stringify(body), { status, headers }); }
