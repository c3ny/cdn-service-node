# CDN Service

Microserviço centralizado de upload e gerenciamento de imagens do projeto **Sangue Solidário**, integrado com **Cloudinary** como backend de armazenamento.

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ donation-service│────▶│                 │────▶│              │
└─────────────────┘     │   cdn-service   │     │  Cloudinary  │
┌─────────────────┐     │   (NestJS)      │     │  (Storage)   │
│  users-service  │────▶│                 │◀────│              │
└─────────────────┘     └─────────────────┘     └──────────────┘
                              ▲
                              │
                        ┌─────────────┐
                        │   Frontend  │
                        │  (Next.js)  │
                        └─────────────┘
```

Os serviços que precisam armazenar imagens enviam o arquivo para o **cdn-service**, que faz o upload para o Cloudinary e retorna a URL pública. Isso centraliza a lógica de upload em um único ponto.

## Stack

- **Runtime:** Node.js 22
- **Framework:** NestJS 11
- **Linguagem:** TypeScript
- **Storage:** Cloudinary (25GB free tier)
- **Auth:** JWT (mesmo secret compartilhado entre os microserviços)
- **Docs:** Swagger/OpenAPI

## Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| `POST` | `/api/v1/images?folder=donations` | JWT | Upload de imagem |
| `DELETE` | `/api/v1/images/:publicId` | JWT | Remove imagem do Cloudinary |

### Upload

```bash
curl -X POST http://localhost:3005/api/v1/images?folder=donations \
  -H "Authorization: Bearer <token>" \
  -F "image=@foto.jpg"
```

**Resposta:**
```json
{
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v1/sangue-solidario/donations/abc123.jpg",
  "publicId": "sangue-solidario/donations/abc123"
}
```

### Delete

```bash
curl -X DELETE http://localhost:3005/api/v1/images/sangue-solidario%2Fdonations%2Fabc123 \
  -H "Authorization: Bearer <token>"
```

**Resposta:**
```json
{
  "message": "Image deleted successfully"
}
```

## Formatos e limites

- **Formatos aceitos:** JPEG, PNG, WebP
- **Tamanho maximo:** 10MB por arquivo
- **Organizacao:** As imagens sao armazenadas em pastas no Cloudinary via query param `folder` (ex: `donations`, `avatars`)

## Variaveis de ambiente

| Variavel | Descricao | Obrigatoria |
|----------|-----------|-------------|
| `PORT` | Porta do servico (padrao: 3005) | Nao |
| `JWT_SECRET` | Secret para validacao JWT | Sim |
| `CLOUDINARY_CLOUD_NAME` | Cloud name da conta Cloudinary | Sim |
| `CLOUDINARY_API_KEY` | API key do Cloudinary | Sim |
| `CLOUDINARY_API_SECRET` | API secret do Cloudinary | Sim |
| `CORS_ORIGINS` | Origins permitidos, separados por virgula | Nao |

## Rodando localmente

### Pre-requisitos

- Node.js 22+
- Conta no [Cloudinary](https://cloudinary.com) (gratuita)

### Setup

```bash
# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Preencher as variaveis do Cloudinary no .env

# Rodar em modo desenvolvimento
npm run start:dev
```

O Swagger fica disponivel em `http://localhost:3005/swagger`.

### Docker

```bash
# Build da imagem
docker build -t cdn-service:1.0.0 .

# Rodar container
docker run -p 3005:3005 --env-file .env cdn-service:1.0.0
```

## Estrutura do projeto

```
src/
├── main.ts                              # Bootstrap + Swagger + CORS
├── app.module.ts                        # Root module
├── cloudinary/
│   ├── cloudinary.module.ts             # Exporta CloudinaryService
│   ├── cloudinary.provider.ts           # Configura SDK via env vars
│   └── cloudinary.service.ts            # Upload/delete no Cloudinary
└── image/
    ├── image.module.ts                  # Modulo principal + JWT auth
    ├── controller/image.controller.ts   # Endpoints REST
    ├── service/image.service.ts         # Logica de negocio
    ├── dto/upload-response.dto.ts       # DTOs de resposta
    └── guards/
        ├── jwt-auth.guard.ts            # Guard de autenticacao
        └── jwt.strategy.ts              # Estrategia JWT/Passport
```

## Parte do ecossistema Sangue Solidario

| Servico | Porta | Repositorio |
|---------|-------|-------------|
| [Frontend (Next.js)](https://github.com/c3ny/sangue-solidario-nextjs) | 3000 | sangue-solidario-nextjs |
| [Donation Service](https://github.com/c3ny/donation-service) | 3001 | donation-service |
| [Users Service](https://github.com/c3ny/users-service) | 3002 | users-service |
| [Blood Stock Service](https://github.com/c3ny/blood-stock-service) | 3004 | blood-stock-service |
| **CDN Service** | **3005** | **cdn-service-node** |
