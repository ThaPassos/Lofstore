// favoritos.js - Sistema completo de gerenciamento de favoritos
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Chave do localStorage
const FAVORITOS_KEY = 'lofstore_favoritos';

// =================== GERENCIAMENTO DE FAVORITOS ===================
export function obterFavoritos() {
  const favoritos = localStorage.getItem(FAVORITOS_KEY);
  return favoritos ? JSON.parse(favoritos) : [];
}

export function salvarFavoritos(favoritos) {
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
  atualizarContadorFavoritos();
}

export function limparFavoritos() {
  localStorage.removeItem(FAVORITOS_KEY);
  atualizarContadorFavoritos();
}

// =================== ADICIONAR/REMOVER FAVORITO ===================
export async function toggleFavorito(produtoId) {
  try {
    const favoritos = obterFavoritos();
    const index = favoritos.findIndex(fav => fav.id === produtoId);
    
    if (index !== -1) {
      // Remove dos favoritos
      favoritos.splice(index, 1);
      salvarFavoritos(favoritos);
      return { 
        sucesso: true, 
        mensagem: 'Removido dos favoritos',
        isFavorito: false 
      };
    } else {
      // Adiciona aos favoritos - busca dados do produto
      const docRef = doc(db, "perfumes", produtoId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Produto não encontrado');
      }
      
      const produto = { id: produtoId, ...docSnap.data() };
      
      favoritos.push({
        id: produtoId,
        nome: produto.nome,
        preco: produto.preco,
        imagem: produto.imagem || '',
        categoria: produto.categoria || '',
        adicionadoEm: new Date().toISOString()
      });
      
      salvarFavoritos(favoritos);
      return { 
        sucesso: true, 
        mensagem: 'Adicionado aos favoritos!',
        isFavorito: true 
      };
    }
  } catch (error) {
    console.error('Erro ao gerenciar favorito:', error);
    return { 
      sucesso: false, 
      mensagem: error.message,
      isFavorito: false 
    };
  }
}

// =================== VERIFICAR SE É FAVORITO ===================
export function isFavorito(produtoId) {
  const favoritos = obterFavoritos();
  return favoritos.some(fav => fav.id === produtoId);
}

// =================== CONTAR FAVORITOS ===================
export function contarFavoritos() {
  return obterFavoritos().length;
}

// =================== ATUALIZAR CONTADOR NA NAVBAR ===================
export function atualizarContadorFavoritos() {
  const contador = document.getElementById('favoritos-contador');
  const total = contarFavoritos();
  
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
export function inicializarFavoritos() {
  atualizarContadorFavoritos();
  console.log('Sistema de favoritos inicializado');
}