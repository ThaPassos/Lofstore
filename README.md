# LofStore - E-commerce de Perfumes

> Sistema completo de e-commerce desenvolvido com HTML, CSS, JavaScript e Firebase, com integração de pagamentos via Mercado Pago.

![LofStore](https://lofstore.com.br/imagens/logo.png)

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Instalação e Configuração](#instalação-e-configuração)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Uso do Sistema](#uso-do-sistema)
- [Deploy](#deploy)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

LofStore é uma plataforma de e-commerce especializada em perfumes, oferecendo uma experiência completa de compra online com:

- **Catálogo dinâmico** de produtos organizados por categorias
- **Sistema de carrinho** e favoritos
- **Autenticação de usuários** com Firebase Auth
- **Painel administrativo** para gestão de produtos e categorias
- **Pagamentos integrados** via Mercado Pago
- **Notificações por e-mail** automatizadas via EmailJS

**🌐 Site em produção:** [https://lofstore.com.br](https://lofstore.com.br)

---

## ✨ Funcionalidades

### Para Clientes
- ✅ Navegação por categorias dinâmicas
- ✅ Busca de produtos
- ✅ Sistema de favoritos
- ✅ Carrinho de compras
- ✅ Checkout integrado com Mercado Pago
- ✅ Perfil do usuário com histórico de pedidos
- ✅ Notificações por e-mail de confirmação de pedido

### Para Administradores
- ✅ Painel administrativo protegido
- ✅ Cadastro, edição e exclusão de produtos
- ✅ Upload de imagens para Firebase Storage
- ✅ Gerenciamento de categorias dinâmicas
- ✅ Controle de estoque (ativo/inativo)
- ✅ Suporte a múltiplas categorias por produto

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Firebase SDK 10.7.1**
  - Authentication
  - Firestore Database
  - Storage
- **EmailJS** - envio de e-mails transacionais
- **Mercado Pago SDK** - processamento de pagamentos

### Backend (Serverless)
- **Vercel Functions** (Node.js)
- **Firebase Admin SDK**
- **Mercado Pago API**

### Hospedagem e Infraestrutura
- **Frontend:** Netlify
- **Backend:** Vercel
- **Domínio:** Registro.br
- **Banco de Dados:** Firebase Firestore
- **Storage:** Firebase Storage
- **CDN:** Netlify CDN

---

## 🏗️ Arquitetura do Sistema
```
┌─────────────────┐
│   Cliente Web   │
│  (lofstore.com) │
└────────┬────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌────────────────┐    ┌──────────────────┐
│   Netlify      │    │   Firebase       │
│   (Frontend)   │◄───┤   - Auth         │
│                │    │   - Firestore    │
└────────┬───────┘    │   - Storage      │
         │            └──────────────────┘
         │
         ▼
┌────────────────┐    ┌──────────────────┐
│   Vercel       │◄───┤  Mercado Pago    │
│   (Backend)    │    │  API             │
│   - Pagamentos │    └──────────────────┘
│   - Webhooks   │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│   EmailJS      │
│   (E-mails)    │
└────────────────┘
```

---

## 📦 Instalação e Configuração

### Pré-requisitos

- Conta no [Firebase](https://firebase.google.com/)
- Conta no [Mercado Pago](https://www.mercadopago.com.br/developers)
- Conta no [EmailJS](https://www.emailjs.com/)
- Conta no [Netlify](https://www.netlify.com/)
- Conta no [Vercel](https://vercel.com/)

### 1. Clone os Repositórios
```bash
# Repositório principal (frontend)
git clone https://github.com/seu-usuario/lofstore.git
cd lofstore

# Repositório backend (em outra pasta)
git clone https://github.com/seu-usuario/lofstore-backend.git
cd lofstore-backend
```

### 2. Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative **Authentication** (Email/Password)
3. Crie um banco **Firestore Database**
4. Ative o **Storage**
5. Copie as credenciais do projeto

#### Estrutura do Firestore

Crie as seguintes coleções:
```
📁 Firestore Database
├── 📄 configuracoes/categorias
│   └── { lista: ["Masculino", "Feminino", "Premium"] }
│
├── 📁 perfumes
│   └── 📄 {id}
│       ├── nome: string
│       ├── preco: number
│       ├── categoria: string
│       ├── categorias: array
│       ├── descricao: string
│       ├── imagem: string (URL ou base64)
│       ├── ativo: boolean
│       ├── criadoEm: timestamp
│       └── atualizadoEm: timestamp
│
├── 📁 usuarios
│   └── 📄 {uid}
│       ├── nome: string
│       ├── email: string
│       ├── telefone: string
│       ├── endereco: string
│       ├── tipo: "cliente"
│       └── criadoEm: timestamp
│
└── 📁 pedidos
    └── 📄 {id}
        ├── usuarioId: string
        ├── cliente: object
        ├── itens: array
        ├── total: number
        ├── status: string
        ├── statusPagamento: string
        ├── mercadoPagoId: string
        ├── linkPagamento: string
        └── criadoEm: timestamp
```

#### Regras de Segurança (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Perfumes - leitura pública, escrita apenas admin
    match /perfumes/{perfumeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Categorias - leitura pública, escrita apenas admin
    match /categorias/{categoriaId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /configuracoes/{configId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Usuários - cada usuário acessa apenas seus dados
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Pedidos - usuários veem apenas seus pedidos, admin vê todos
    match /pedidos/{pedidoId} {
      allow read: if request.auth != null && 
        (resource.data.usuarioId == request.auth.uid || 
         get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin');
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.tipo == 'admin';
    }
  }
}
```

#### Regras de Segurança (Storage)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /produtos/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Configuração do Frontend

Edite `js/firebase.js` com suas credenciais:
```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_MESSAGING_ID",
  appId: "SEU_APP_ID"
};
```

### 4. Configuração de Administradores

Edite `js/admins-autorizados.js`:
```javascript
export const ADMINS_AUTORIZADOS = [
    'admin1@email.com',
    'admin2@email.com'
];
```

### 5. Configuração do EmailJS

1. Crie templates no EmailJS:
   - **Template Cliente** (`template_jjxc4sr`)
   - **Template Admin** (`template_cfcay9o`)

2. Edite `js/email-service-emailjs.js`:
```javascript
const EMAILJS_SERVICE_ID = "seu_service_id";
const EMAILJS_TEMPLATE_CLIENTE = "seu_template_cliente";
const EMAILJS_TEMPLATE_ADMIN = "seu_template_admin";
const EMAILJS_PUBLIC_KEY = "sua_public_key";
```

### 6. Configuração do Backend (Vercel)

#### Instale dependências:
```bash
cd lofstore-backend
npm install
```

#### Configure variáveis de ambiente na Vercel:
```env
# Firebase Admin
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_PRIVATE_KEY_ID=sua-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-projeto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=seu-client-id

# Mercado Pago
MP_ACCESS_TOKEN=seu-access-token-mercadopago

# EmailJS
EMAILJS_SERVICE_ID=seu-service-id
EMAILJS_TEMPLATE_CLIENTE=template-cliente-id
EMAILJS_TEMPLATE_ADMIN=template-admin-id
EMAILJS_PUBLIC_KEY=sua-public-key

# URLs
FRONTEND_URL=https://lofstore.com.br
BACKEND_URL=https://lofstore-backend.vercel.app
```

---

## 📁 Estrutura de Pastas
```
lofstore/
│
├── 📂 imagens/              # Imagens estáticas do site
│   ├── logo.png
│   ├── logo2a.png
│   ├── slide1.png
│   └── ...
│
├── 📂 js/                   # Scripts JavaScript
│   ├── firebase.js          # Configuração Firebase
│   ├── produtos.js          # Gerenciamento de produtos
│   ├── carrinho.js          # Sistema de carrinho
│   ├── favoritos.js         # Sistema de favoritos
│   ├── categorias.js        # Categorias dinâmicas
│   ├── admin.js             # Painel administrativo
│   ├── navbar.js            # Navbar responsiva
│   └── ...
│
├── 📄 index.html            # Página inicial
├── 📄 admin.html            # Painel admin
├── 📄 login.html            # Login admin
├── 📄 login-usuario.html    # Login cliente
├── 📄 cadastro.html         # Cadastro cliente
├── 📄 perfil.html           # Perfil do usuário
├── 📄 carrinho.html         # Carrinho de compras
├── 📄 checkout-carrinho.html # Finalização de compra
├── 📄 favoritos.html        # Produtos favoritos
├── 📄 produto-detalhes.html # Detalhes do produto
├── 📄 navbar.html           # Navbar (componente)
├── 📄 style.css             # Estilos principais
├── 📄 favoritos.css         # Estilos favoritos
│
├── 📄 netlify.toml          # Config Netlify
└── 📄 README.md             # Este arquivo
```

---

## 💻 Uso do Sistema

### Como Administrador

1. **Acesse:** `https://lofstore.com.br/login.html`
2. **Login:** Use um e-mail autorizado em `admins-autorizados.js`
3. **Painel Admin:** Gerencie produtos e categorias

#### Adicionar Produto
- Acesse `admin.html`
- Preencha: nome, preço, categoria(s), descrição
- Faça upload da imagem
- Clique em "Salvar Perfume"

#### Gerenciar Categorias
- Acesse `gerenciar-categorias.html`
- Adicione ou remova categorias
- Categorias aparecem automaticamente nos menus

### Como Cliente

1. **Navegue:** Explore produtos por categoria ou busca
2. **Adicione ao Carrinho:** Clique no ícone do carrinho
3. **Favoritos:** Clique no coração para salvar
4. **Finalize:** Acesse o carrinho e prossiga para checkout
5. **Pagamento:** Complete via Mercado Pago
6. **Acompanhe:** Veja seus pedidos em "Meu Perfil"

---

## 🚀 Deploy

### Frontend (Netlify)

1. **Conecte o repositório:**
   - Acesse [Netlify](https://app.netlify.com/)
   - Novo site → Import from Git
   - Selecione o repositório `lofstore`

2. **Configure:**
   - Build command: (deixe vazio)
   - Publish directory: `/`

3. **Domínio personalizado:**
   - Site settings → Domain management
   - Add custom domain: `lofstore.com.br`
   - Configure DNS no Registro.br:
```
     A     @     75.2.60.5
     CNAME www   seu-site.netlify.app
```

### Backend (Vercel)

1. **Deploy:**
```bash
   cd lofstore-backend
   vercel --prod
```

2. **Configure variáveis de ambiente** no dashboard da Vercel

3. **Webhooks do Mercado Pago:**
   - Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel/app)
   - Configure webhook: `https://lofstore-backend.vercel.app/webhook`

---

## 🔒 Segurança

- ✅ Autenticação via Firebase Auth
- ✅ Regras de segurança no Firestore
- ✅ Validação de admins via lista whitelist
- ✅ HTTPS obrigatório
- ✅ CORS configurado
- ✅ Sanitização de inputs

---

## 🐛 Problemas Comuns

### Erro "Firebase not initialized"
- Verifique se `firebase.js` está sendo importado
- Confirme as credenciais do Firebase

### Pagamentos não processam
- Verifique o Access Token do Mercado Pago
- Confirme que o webhook está ativo
- Veja logs na Vercel

### E-mails não enviados
- Verifique credenciais do EmailJS
- Confirme templates criados
- Veja console do navegador

---

## 📄 Licença

Este projeto é propriedade da LofStore. Todos os direitos reservados.

---

**Desenvolvido por Thafany Passos para LofStore**
