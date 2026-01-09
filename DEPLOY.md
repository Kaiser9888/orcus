# DEPLOY — Orcus

## O que colocar no GitHub
- `server.js`, `package.json`, `package-lock.json`
- `public/` (todos os arquivos HTML/CSS/JS)
- `README.md`, `.gitignore`, `Dockerfile`, `docker-compose.yml`, `netlify.toml`

## O que NÃO colocar no GitHub (sensível)
- `.env` (contém ADMIN_PASSWORD, ADMIN_JWT_SECRET)
- `data/` (banco de dados local)
- `uploads/` (arquivos enviados)
- `node_modules/` (gerado automaticamente pelo npm install)

---

## Opção 1: Deploy do Backend + Frontend (Node.js completo)
Recomendado para rodar a aplicação toda (Express + SQLite).

### Serviços: Railway, Render, Heroku
1. Push seu código para GitHub (sem `.env`).
2. Conecte o repositório ao serviço (ex.: Railway/Render).
3. Defina variáveis de ambiente (ADMIN_PASSWORD, etc.) no painel do serviço.
4. Deploy automático ao fazer push.

#### Exemplo: Railway.app
- Crie conta em railway.app
- Conecte GitHub
- Selecione `orcus/` como root
- Configure variáveis de ambiente
- Railway faz o deploy automático

---

## Opção 2: Frontend estático (Netlify) + Backend separado (Railway/Render)
Recomendado se quiser usar Netlify para o frontend.

### Step 1: Deploy do Backend (ex.: Railway)
1. Push código para GitHub
2. No Railway, crie novo projeto a partir do GitHub
3. Configure variáveis de ambiente
4. Copie a URL da API (ex.: `https://seu-backend.railway.app`)

### Step 2: Deploy do Frontend (Netlify)
1. Edite `public/` para apontar API requests ao backend (ex.: `https://seu-backend.railway.app/api/books`)
2. Push para GitHub
3. No Netlify, conecte GitHub
4. Selecione branch `main` e publish folder `public`
5. Netlify faz deploy automático

#### Configurar proxy (optional)
Se quiser que requisições `/api/*` vão para backend remoto, edite `netlify.toml`:
```toml
[[redirects]]
from = "/api/*"
to = "https://seu-backend.railway.app/api/:splat"
status = 200
force = true
```

---

## Opção 3: Docker (Recomendado para manter tudo junto)
Rode localmente e depois suba em qualquer serviço que suporte Docker (Railway, Heroku, DigitalOcean App Platform, etc.).

```bash
# Local
docker-compose up -d --build
# Acesse http://localhost:3000
```

Depois, para deploy:
1. Configure Docker registry (Docker Hub, GitHub Container Registry).
2. Push imagem para registry.
3. Deploy em serviço que suporte Docker.

---

## Checklist antes de fazer push para GitHub
- [ ] Remova `.env` (só deixe `.env.example`)
- [ ] Remova `data/` e `uploads/` das pastas
- [ ] Remova `node_modules/` (ou confirme que está no `.gitignore`)
- [ ] Revise `server.js` e verifique variáveis de ambiente corretas
- [ ] Teste localmente (`npm install && npm run dev`)

---

## Comandos Git (resumo)
```bash
cd /home/kelvin/projeto/orcus
git init
git add .
git commit -m "initial: orcus biblioteca"
git remote add origin https://github.com/seu-usuario/orcus.git
git branch -M main
git push -u origin main
```

---

## Próximas ações (escolha)
1. Ajustar código para usar variáveis de ambiente corretamente (já está feito).
2. Testar deploy local com Docker (docker-compose up).
3. Criar repositório GitHub e fazer push.
4. Escolher plataforma de deploy (Railway, Render, Netlify, etc.) e deploy.

Quer que eu detalhe qualquer uma das opções? Ou prefere que eu prepare um script de teste rápido? 🚀
