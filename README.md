# Orcus — Biblioteca (MVP)

Scaffold mínimo para uma biblioteca gratuita com uploads/links e intersticial de download com slot de anúncio.

Como rodar (Docker ou Node):

1. Copie `.env.example` para `.env` e ajuste variáveis (ADMIN_PASSWORD, ADMIN_JWT_SECRET).
2. Instalar dependências: `npm install` (no diretório `orcus/`).
3. Rodar: `node server.js` ou `npm run dev`.

Endpoints importantes:
- `GET /` — homepage (search)
- `GET /upload.html` — form de envio
- `POST /api/upload` — upload de arquivo
- `POST /api/books` — criar livro via JSON (link)
- `GET /api/books?q=` — buscar
- `GET /i/:id` — intersticial
- `GET /api/download/:id` — realiza download ou redirect e registra
- `POST /api/admin/login` — recebe { password } e retorna token
- `GET/POST /api/admin/settings/adscript` — ler/salvar script de anúncio (requires token)

Segurança: implemente verificação de uploads e moderação antes de abrir ao público.
