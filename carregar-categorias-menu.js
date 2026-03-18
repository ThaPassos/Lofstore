// Script para carregar categorias no menu desktop e mobile
import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("Carregando categorias nos menus...");

async function carregarCategoriasMenu() {
  try {
    const menuCategoriasDesktop = document.getElementById('menu-categorias-desktop');
    const menuCategoriasMobile = document.getElementById('submenu-categorias-mobile');
    
    if (!menuCategoriasDesktop || !menuCategoriasMobile) {
      console.warn('Elementos do menu de categorias não encontrados');
      return;
    }

    // Busca todas as categorias do Firestore
    const querySnapshot = await getDocs(collection(db, "categorias"));
    
    if (querySnapshot.empty) {
      console.log('Nenhuma categoria encontrada no banco');
      return;
    }

    const categorias = [];
    querySnapshot.forEach((doc) => {
      categorias.push({
        id: doc.id,
        nome: doc.data().nome
      });
    });

    // Ordena alfabeticamente
    categorias.sort((a, b) => a.nome.localeCompare(b.nome));

    console.log('Categorias carregadas:', categorias);

    // Limpa os menus (mantém apenas "Todas as Categorias")
    const todasCategoriasDesktop = menuCategoriasDesktop.querySelector('li:first-child');
    const todasCategoriasMobile = menuCategoriasMobile.querySelector('li:first-child');
    
    menuCategoriasDesktop.innerHTML = '';
    menuCategoriasMobile.innerHTML = '';
    
    // Adiciona "Todas as Categorias" de volta
    if (todasCategoriasDesktop) menuCategoriasDesktop.appendChild(todasCategoriasDesktop);
    if (todasCategoriasMobile) menuCategoriasMobile.appendChild(todasCategoriasMobile);

    // Adiciona cada categoria nos dois menus
    categorias.forEach(categoria => {
      // Desktop
      const liDesktop = document.createElement('li');
      const aDesktop = document.createElement('a');
      aDesktop.href = '#';
      aDesktop.textContent = categoria.nome;
      aDesktop.onclick = (e) => {
        e.preventDefault();
        if (typeof window.filtrarPorCategoria === 'function') {
          window.filtrarPorCategoria(categoria.nome);
        }
      };
      liDesktop.appendChild(aDesktop);
      menuCategoriasDesktop.appendChild(liDesktop);

      // Mobile
      const liMobile = document.createElement('li');
      const aMobile = document.createElement('a');
      aMobile.href = '#';
      aMobile.textContent = categoria.nome;
      aMobile.onclick = (e) => {
        e.preventDefault();
        if (typeof window.filtrarPorCategoria === 'function') {
          window.filtrarPorCategoria(categoria.nome);
        }
        // Fecha o menu mobile após selecionar categoria
        if (typeof window.fecharMenuMobile === 'function') {
          window.fecharMenuMobile();
        }
      };
      liMobile.appendChild(aMobile);
      menuCategoriasMobile.appendChild(liMobile);
    });

    console.log(`${categorias.length} categorias adicionadas aos menus`);

  } catch (error) {
    console.error('Erro ao carregar categorias no menu:', error);
  }
}

// Carrega as categorias quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', carregarCategoriasMenu);
} else {
  carregarCategoriasMenu();
}

export { carregarCategoriasMenu };