// carrinho.js - Sistema completo de carrinho de compras
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Chave do localStorage
const CARRINHO_KEY = 'lofstore_carrinho';

// =================== GERENCIAMENTO DO CARRINHO ===================
export function obterCarrinho() {
  const carrinho = localStorage.getItem(CARRINHO_KEY);
  return carrinho ? JSON.parse(carrinho) : [];
}

export function salvarCarrinho(carrinho) {
  localStorage.setItem(CARRINHO_KEY, JSON.stringify(carrinho));
  atualizarContadorCarrinho();
}

export function limparCarrinho() {
  localStorage.removeItem(CARRINHO_KEY);
  atualizarContadorCarrinho();
}

// =================== ADICIONAR AO CARRINHO ===================
export async function adicionarAoCarrinho(produtoId) {
  try {
    // Busca dados do produto
    const docRef = doc(db, "perfumes", produtoId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Produto não encontrado');
    }
    
    const produto = { id: produtoId, ...docSnap.data() };
    
    // Verifica se está ativo
    if (!produto.ativo) {
      throw new Error('Produto indisponível no momento');
    }
    
    // Pega carrinho atual
    const carrinho = obterCarrinho();
    
    // Verifica se já existe
    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
      // Incrementa quantidade
      itemExistente.quantidade += 1;
    } else {
      // Adiciona novo item
      carrinho.push({
        id: produtoId,
        nome: produto.nome,
        preco: produto.preco,
        imagem: produto.imagem || '',
        categoria: produto.categoria || '',
        quantidade: 1
      });
    }
    
    salvarCarrinho(carrinho);
    
    return { sucesso: true, mensagem: 'Produto adicionado ao carrinho!' };
    
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    return { sucesso: false, mensagem: error.message };
  }
}

// =================== REMOVER DO CARRINHO ===================
export function removerDoCarrinho(produtoId) {
  const carrinho = obterCarrinho();
  const novoCarrinho = carrinho.filter(item => item.id !== produtoId);
  salvarCarrinho(novoCarrinho);
}

// =================== ATUALIZAR QUANTIDADE ===================
export function atualizarQuantidade(produtoId, quantidade) {
  const carrinho = obterCarrinho();
  const item = carrinho.find(item => item.id === produtoId);
  
  if (item) {
    if (quantidade <= 0) {
      removerDoCarrinho(produtoId);
    } else {
      item.quantidade = quantidade;
      salvarCarrinho(carrinho);
    }
  }
}

// =================== CALCULAR TOTAL ===================
export function calcularTotal() {
  const carrinho = obterCarrinho();
  return carrinho.reduce((total, item) => {
    return total + (item.preco * item.quantidade);
  }, 0);
}

// =================== CONTADOR DE ITENS ===================
export function contarItens() {
  const carrinho = obterCarrinho();
  return carrinho.reduce((total, item) => total + item.quantidade, 0);
}

// =================== ATUALIZAR CONTADOR NA NAVBAR ===================
export function atualizarContadorCarrinho() {
  const contador = document.getElementById('carrinho-contador');
  const total = contarItens();
  
  if (contador) {
    if (total > 0) {
      contador.textContent = total;
      contador.style.display = 'flex';
    } else {
      contador.style.display = 'none';
    }
  }
}

// =================== FORMATAR PREÇO ===================
export function formatarPreco(preco) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(preco);
}

// =================== INICIALIZAR ===================
export function inicializarCarrinho() {
  atualizarContadorCarrinho();
}