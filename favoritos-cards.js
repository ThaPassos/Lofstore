// favoritos-cards.js - Integração de favoritos nos cards de produtos
import { toggleFavorito, isFavorito } from './favoritos.js';
import { adicionarAoCarrinho } from './carrinho.js';

// =================== TOGGLE FAVORITO NO CARD ===================
window.toggleFavoritoCard = async function(produtoId, botao) {
  console.log("Toggle favorito:", produtoId);
  
  const resultado = await toggleFavorito(produtoId);
  
  if (resultado.sucesso) {
    // Atualiza visual do botão
    if (resultado.isFavorito) {
      botao.classList.add('ativo');
      mostrarNotificacaoFavorito('Adicionado aos favoritos!', false);
    } else {
      botao.classList.remove('ativo');
      mostrarNotificacaoFavorito('Removido dos favoritos', true);
    }
  } else {
    alert(resultado.mensagem);
  }
};

// =================== ADICIONAR AO CARRINHO NO CARD ===================
window.adicionarAoCarrinhoCard = async function(produtoId) {
  console.log("Adicionar ao carrinho:", produtoId);
  
  const resultado = await adicionarAoCarrinho(produtoId);
  
  if (resultado.sucesso) {
    mostrarNotificacaoCarrinho(resultado.mensagem);
  } else {
    alert(resultado.mensagem);
  }
};

// =================== VERIFICAR SE É FAVORITO (SÍNCRONO) ===================
window.isFavoritoSync = function(produtoId) {
  return isFavorito(produtoId);
};

// =================== NOTIFICAÇÃO DE FAVORITO ===================
function mostrarNotificacaoFavorito(mensagem, isRemover = false) {
  // Remove notificação existente
  const existente = document.querySelector('.notificacao-favorito');
  if (existente) {
    existente.remove();
  }
  
  // Cria nova notificação
  const notif = document.createElement('div');
  notif.className = `notificacao-favorito mostrar ${isRemover ? 'remover' : ''}`;
  notif.textContent = mensagem;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.classList.remove('mostrar');
    setTimeout(() => notif.remove(), 300);
  }, 2500);
}

// =================== NOTIFICAÇÃO DE CARRINHO ===================
function mostrarNotificacaoCarrinho(mensagem) {
  // Remove notificação existente
  const existente = document.getElementById('notificacao-carrinho');
  if (existente) {
    existente.remove();
  }
  
  // Cria nova notificação
  const notif = document.createElement('div');
  notif.id = 'notificacao-carrinho';
  notif.className = 'notificacao-carrinho mostrar';
  notif.textContent = mensagem;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.classList.remove('mostrar');
    setTimeout(() => notif.remove(), 300);
  }, 2500);
}

// =================== ATUALIZAR TODOS OS BOTÕES DE FAVORITO ===================
export function atualizarBotoesFavoritos() {
  const cards = document.querySelectorAll('.card-produto');
  
  cards.forEach(card => {
    const produtoId = card.dataset.id;
    const botaoFavorito = card.querySelector('.btn-favorito');
    
    if (botaoFavorito && produtoId) {
      if (isFavorito(produtoId)) {
        botaoFavorito.classList.add('ativo');
      } else {
        botaoFavorito.classList.remove('ativo');
      }
    }
  });
  
  console.log("Botões de favorito atualizados");
}

// =================== INICIALIZAÇÃO ===================
document.addEventListener('DOMContentLoaded', () => {
  console.log("favoritos-cards.js carregado");
  
  // Atualiza botões após produtos carregarem
  setTimeout(atualizarBotoesFavoritos, 1000);
});

console.log("Sistema de favoritos nos cards inicializado");