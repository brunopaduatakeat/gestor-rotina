# Gestor de Rotina

Aplicação web para gestão de rotina de um gestor de equipe.
Kanban, To-Do, Reuniões categorizadas, Carteiras, Tracking de Projetos e integração com Google Agenda.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Estado:** Zustand
- **Persistência local:** IndexedDB via Dexie.js (offline-first)
- **Backend:** Vercel Serverless Functions (`/api`)
- **Banco serverless:** Turso (libSQL)
- **Notificações:** Web Push API + Service Worker
- **Deploy:** Vercel (CI/CD via GitHub)

## Setup local

```bash
# 1. Clone o repositório
git clone https://github.com/brunopaduatakeat/gestor-rotina
cd gestor-rotina

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com seus valores reais

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

## Variáveis de ambiente

Veja `.env.example` para a lista completa. **Nunca commite `.env.local`.**

Na Vercel, configure todas as variáveis em **Project Settings → Environment Variables**
com os escopos Production / Preview / Development conforme necessário.

## Google OAuth — redirect URI

O Google exige URIs de redirect **exatas e cadastradas** (sem wildcard).

- Cadastre **apenas o domínio de produção** como redirect URI:
  `https://seu-dominio.vercel.app/api/auth/callback`
- Para validar em preview, aponte o OAuth para o mesmo domínio de produção
  ou configure um alias fixo na Vercel.
- Nunca use URLs de preview dinâmicas como redirect URI.

## Deploy

Push na `main` → deploy de produção automático.
Pull Requests → Preview Deployment isolado.

## Estrutura de pastas

```
src/
  domain/       # regras de negócio puras (sem React, sem Dexie)
  adapters/     # Dexie, Google Calendar, push
  components/   # UI components
  pages/        # rotas
  hooks/        # React hooks
api/            # Vercel Serverless Functions
public/
  icons/        # ícones PWA
```
