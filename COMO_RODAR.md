# Como Rodar o Projeto

Este projeto possui um **frontend** (React + Vite) e um **backend** (Fastify + TypeScript).

## Pré-requisitos

- Node.js instalado (recomendado: versão 18 ou superior)
- npm ou yarn

## Configuração do Backend

1. **Navegue até a pasta do backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências (se ainda não instalou):**
   ```bash
   npm install
   ```

3. **Crie um arquivo `.env` na pasta `backend` com as seguintes variáveis:**
   ```env
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase
   PORT=3001
   ```
   
   > **Nota:** Substitua `sua_url_do_supabase` e `sua_chave_de_servico_do_supabase` pelos valores reais do seu projeto Supabase.

4. **Inicie o servidor backend:**
   ```bash
   npm run dev
   ```
   
   O backend estará rodando em: **http://localhost:3001**
   - Documentação da API (Swagger): **http://localhost:3001/api/docs**
   - Health check: **http://localhost:3001/api/health**

## Configuração do Frontend

1. **Volte para a pasta raiz do projeto:**
   ```bash
   cd ..
   ```

2. **Instale as dependências (se ainda não instalou):**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   
   O frontend estará rodando em: **http://localhost:8080**

## Resumo dos Comandos

### Terminal 1 - Backend:
```bash
cd backend
npm install  # apenas na primeira vez
npm run dev
```

### Terminal 2 - Frontend:
```bash
# Na pasta raiz do projeto
npm install  # apenas na primeira vez
npm run dev
```

## Estrutura do Projeto

- **Frontend**: React + Vite (porta 8080)
- **Backend**: Fastify + TypeScript (porta 3001)
- O frontend está configurado para fazer proxy das requisições `/api` para o backend

## Verificação

Após iniciar ambos os servidores:
- ✅ Frontend: http://localhost:8080
- ✅ Backend API: http://localhost:3001/api/health
- ✅ Documentação API: http://localhost:3001/api/docs
