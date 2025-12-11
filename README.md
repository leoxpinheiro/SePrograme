# VIP Access Pro

Sistema de gestão de listas VIP para eventos.

## Como usar (Frontend - Modo Atual)
O sistema está configurado para usar `LocalStorage` (navegador). Basta rodar o frontend e usar. Os dados persistem no navegador do usuário.

## Como migrar para Backend (Node + Mongo)

1. Crie um banco de dados no MongoDB Atlas.
2. Crie um arquivo `.env` na pasta `backend` com:
   ```
   MONGODB_URI=sua_string_de_conexao
   PORT=5000
   ```
3. Instale as dependências:
   ```bash
   cd backend
   npm install express mongoose cors dotenv
   ```
4. Inicie o servidor: `node index.js`
5. No frontend, altere o `services/storage.ts` para fazer chamadas `fetch` para `http://localhost:5000/api/...` em vez de usar `localStorage`.

## Funcionalidades
- **Banner 4:5**: Visualização imersiva na página do evento.
- **Bilheteria**: Check-in em tempo real, busca rápida e KPIs.
- **Lista Pública**: Modal de visualização para os convidados.
- **WhatsApp**: Integração direta para confirmação.
