// =================== CARREGA A NAVBAR AUTOMATICAMENTE ===================
async function carregarNavbar() {
  try {
    const response = await fetch('navbar.html');
    const html = await response.text();
    
    // Insere a navbar no início do body
    document.body.insertAdjacentHTML('afterbegin', html);
    
    console.log('✅ Navbar carregada');
    
    // Inicializa imediatamente
    inicializarNavbar();
    
  } catch (error) {
    console.error('❌ Erro ao carregar navbar:', error);
  }
}

// =================== INICIALIZA TODAS AS FUNCIONALIDADES ===================
function inicializarNavbar() {
  console.log('🔧 Inicializando navbar...');
  
  // Primeiro inicializa tudo menos a auth
  inicializarMenuMobile();
  inicializarScrollNavbar();
  inicializarBusca();
  verificarAdmin();
  inicializarCarrinhoContador();
  
  // Depois configura autenticação
  setTimeout(() => {
    configurarAutenticacao();
  }, 100);
}

// =================== CONFIGURAR AUTENTICAÇÃO (VERSÃO ROBUSTA) ===================
async function configurarAutenticacao() {
  console.log("🔐 Configurando autenticação...");
  
  // 1. Verifica localStorage primeiro
  verificarAuthLocal();
  
  // 2. Tenta configurar Firebase
  setTimeout(async () => {
    try {
      const { auth } = await import('./firebase.js');
      const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      
      console.log("✅ Firebase Auth carregado");
      
      // Listener do Firebase
      onAuthStateChanged(auth, (user) => {
        console.log("🔄 Auth state changed:", user ? user.email : "null");
        
        // Atualiza localStorage
        if (user) {
          localStorage.setItem('userLogado', 'true');
          localStorage.setItem('userEmail', user.email);
          localStorage.setItem('userName', user.displayName || user.email.split('@')[0]);
        } else {
          localStorage.removeItem('userLogado');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
        }
        
        // Força atualização da interface
        atualizarInterfaceAuth(user);
      });
      
    } catch (error) {
      console.log("⚠️ Firebase não carregado:", error.message);
      // Continua com localStorage apenas
    }
  }, 200);
}

// =================== VERIFICAR AUTENTICAÇÃO LOCAL ===================
function verificarAuthLocal() {
  // Verifica múltiplas chaves possíveis
  const userLogado = localStorage.getItem('userLogado') || 
                    localStorage.getItem('isLoggedIn') || 
                    'false';
  
  const userEmail = localStorage.getItem('userEmail') || 
                    localStorage.getItem('user_email') || 
                    localStorage.getItem('email');
  
  const userName = localStorage.getItem('userName') || 
                   localStorage.getItem('user_name') || 
                   localStorage.getItem('name') || 
                   (userEmail ? userEmail.split('@')[0] : '');

  console.log("📦 Verificando localStorage:", { 
    userLogado, 
    userEmail: userEmail ? `${userEmail.substring(0, 15)}...` : 'null',
    userName 
  });

  if (userLogado === 'true' && userEmail) {
    const user = {
      email: userEmail,
      displayName: userName,
      uid: localStorage.getItem('userId') || localStorage.getItem('user_uid') || ''
    };
    console.log("✅ Usuário encontrado no localStorage");
    atualizarInterfaceAuth(user);
  } else {
    console.log("❌ Nenhum usuário no localStorage");
    atualizarInterfaceAuth(null);
  }
}

function resetarInterfaceAuth() {
  // Desktop
  const linkContaDesktop = document.getElementById('link-conta-desktop');
  if (linkContaDesktop) {
    linkContaDesktop.textContent = '';
    linkContaDesktop.href = '#';
  }

  // Mobile
  const mobileLoginBox = document.getElementById('mobile-login-box');
  const mobileProfileBox = document.getElementById('mobile-profile-box');

  if (mobileLoginBox) mobileLoginBox.style.display = 'none';
  if (mobileProfileBox) mobileProfileBox.style.display = 'none';
}


function atualizarInterfaceAuth(user) {
  console.log("👤 Atualizando interface...");
  console.log("User:", user ? user.email : "null");

  setTimeout(() => {
    // 🔥 LIMPA ESTADO ANTERIOR
    resetarInterfaceAuth();

    // ========== DESKTOP ==========
    const linkContaDesktop = document.getElementById('link-conta-desktop');

    if (linkContaDesktop) {
      if (user && user.email) {
        linkContaDesktop.textContent = 'Minha Conta';
        linkContaDesktop.href = 'perfil.html';
        console.log('✅ Desktop: Minha Conta');
      } else {
        linkContaDesktop.textContent = 'Faça Login';
        linkContaDesktop.href = 'login-usuario.html';
        console.log('✅ Desktop: Faça Login');
      }
    }

    // ========== MOBILE ==========
    const mobileLoginBox = document.getElementById('mobile-login-box');
    const mobileProfileBox = document.getElementById('mobile-profile-box');

    if (user && user.email) {
      // LOGADO
      if (mobileProfileBox) {
        mobileProfileBox.style.display = 'flex';

        const mobileUserName = document.getElementById('mobile-user-name');
        const mobileUserEmail = document.getElementById('mobile-user-email');

        if (mobileUserName) {
          mobileUserName.textContent =
            user.displayName || user.email.split('@')[0];
        }

        if (mobileUserEmail) {
          mobileUserEmail.textContent = user.email;
        }
      }

      console.log('✅ Mobile: Perfil do usuário');
    } else {
      // NÃO LOGADO
      if (mobileLoginBox) {
        mobileLoginBox.style.display = 'flex';
      }

      console.log('✅ Mobile: Visitante');
    }

    configurarLogoutMobile();
  }, 50);
}

// =================== CONFIGURAR LOGOUT MOBILE ===================
function configurarLogoutMobile() {
  const btnLogoutMobile = document.getElementById('btn-logout-mobile');
  
  if (!btnLogoutMobile) {
    console.log('⚠️ Botão logout não encontrado');
    return;
  }
  
  // Remove event listeners antigos
  const newBtn = btnLogoutMobile.cloneNode(true);
  btnLogoutMobile.parentNode.replaceChild(newBtn, btnLogoutMobile);
  
  // Novo event listener
  newBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (confirm('Deseja realmente sair?')) {
      try {
        // Tenta logout do Firebase
        try {
          const { auth } = await import('./firebase.js');
          const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
          await signOut(auth);
          console.log('✅ Logout Firebase realizado');
        } catch (firebaseError) {
          console.log('⚠️ Firebase não disponível para logout');
        }
        
        // Limpa localStorage
        const keysToRemove = [
          'userLogado', 'userEmail', 'userName',
          'isLoggedIn', 'user_email', 'user_name',
          'userId', 'user_uid'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('✅ LocalStorage limpo');
        
        // Atualiza interface
        atualizarInterfaceAuth(null);
        
        // Fecha menu mobile se estiver aberto
        fecharMenuMobile();
        
        // Redireciona para home
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
        
      } catch (error) {
        console.error('❌ Erro no logout:', error);
        alert('Erro ao fazer logout');
      }
    }
  });
}

// =================== FUNÇÃO GLOBAL PARA FORÇAR ATUALIZAÇÃO ===================
window.atualizarEstadoLoginNavbar = function() {
  console.log('🔄 Forçando atualização do estado de login...');
  verificarAuthLocal();
};

// =================== MENU MOBILE ===================
function inicializarMenuMobile() {
  const hamburger = document.getElementById('hamburger');
  const menuOverlay = document.getElementById('menu-mobile-overlay');
  const btnFechar = document.getElementById('btn-fechar-menu');
  const categoriasToggleMobile = document.getElementById('categorias-toggle-mobile');

  console.log('📱 Inicializando menu mobile...');

  hamburger?.addEventListener('click', (e) => {
    e.stopPropagation();
    abrirMenuMobile();
  });

  btnFechar?.addEventListener('click', (e) => {
    e.stopPropagation();
    fecharMenuMobile();
  });

  menuOverlay?.addEventListener('click', (e) => {
    if (e.target === menuOverlay) {
      fecharMenuMobile();
    }
  });

  categoriasToggleMobile?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropdownMobile = categoriasToggleMobile.closest('.dropdown-mobile');
    dropdownMobile?.classList.toggle('ativo');
  });

  document.querySelectorAll('.menu-mobile-nav a:not(.dropdown-toggle-mobile)').forEach(link => {
    link.addEventListener('click', () => {
      fecharMenuMobile();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOverlay?.classList.contains('ativo')) {
      fecharMenuMobile();
    }
  });
}

window.fecharMenuMobile = function() {
  const menuOverlay = document.getElementById('menu-mobile-overlay');
  const hamburger = document.getElementById('hamburger');
  
  menuOverlay?.classList.remove('ativo');
  hamburger?.classList.remove('active');
  document.body.style.overflow = '';
  
  console.log('Menu mobile fechado');
}

function abrirMenuMobile() {
  const menuOverlay = document.getElementById('menu-mobile-overlay');
  const hamburger = document.getElementById('hamburger');
  
  menuOverlay?.classList.add('ativo');
  hamburger?.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  console.log('📱 Menu mobile aberto');
}

// =================== SCROLL NAVBAR ===================
function inicializarScrollNavbar() {
  const navbar = document.querySelector(".navbar");
  
  window.addEventListener("scroll", () => {
    if (window.scrollY > 80) {
      navbar?.classList.add("scrolled");
    } else {
      navbar?.classList.remove("scrolled");
    }
  });
}

// =================== BUSCA ===================
function inicializarBusca() {
  window.buscarProdutos = function() {
    const searchInput = document.getElementById('searchInput');
    const termo = searchInput?.value.trim();
    
    console.log("🔍 Buscando:", termo);
    
    if (!termo) return;
    
    if (typeof window.filtrarProdutosPorBusca === 'function') {
      window.filtrarProdutosPorBusca(termo);
    } else {
      window.location.href = `index.html?busca=${encodeURIComponent(termo)}`;
    }
  };

  document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      buscarProdutos();
    }
  });
}

// =================== VERIFICA SE É ADMIN ===================
function verificarAdmin() {
  const adminLogado = localStorage.getItem('adminLogado');
  const btnPainelAdmin = document.getElementById('btn-painel-admin');
  const liPainelAdminMobile = document.getElementById('li-painel-admin-mobile');
  
  if (adminLogado === 'true') {
    if (btnPainelAdmin) btnPainelAdmin.classList.add('mostrar');
    if (liPainelAdminMobile) liPainelAdminMobile.style.display = 'block';
    console.log('✅ Admin detectado');
  } else {
    if (btnPainelAdmin) btnPainelAdmin.classList.remove('mostrar');
    if (liPainelAdminMobile) liPainelAdminMobile.style.display = 'none';
    console.log('❌ Não é admin');
  }
}

// =================== CONTADOR DO CARRINHO ===================
function inicializarCarrinhoContador() {
  function atualizarContador() {
    const contador = document.getElementById('carrinho-contador');
    if (!contador) return;
    
    const carrinho = JSON.parse(localStorage.getItem('lofstore_carrinho') || '[]');
    const totalItens = carrinho.reduce((total, item) => total + (item.quantidade || 1), 0);
    
    contador.textContent = totalItens;
    contador.style.display = totalItens > 0 ? 'flex' : 'none';
    
    console.log(`🛒 Carrinho: ${totalItens} itens`);
  }
  
  // Atualiza ao carregar
  atualizarContador();
  
  // Escuta eventos de atualização do carrinho
  window.addEventListener('storage', (e) => {
    if (e.key === 'lofstore_carrinho') {
      atualizarContador();
    }
  });
}

// =================== ATUALIZA MENUS COM CATEGORIAS ===================
window.atualizarMenusCategorias = function(categorias) {
  console.log('🏷️ Atualizando menus com categorias:', categorias);
  
  const menuCategoriasDesktop = document.getElementById('menu-categorias-desktop');
  const menuCategoriasMobile = document.getElementById('submenu-categorias-mobile');
  
  if (!menuCategoriasDesktop || !menuCategoriasMobile) {
    console.warn('⚠️ Elementos do menu não encontrados');
    return;
  }
  
  // Limpa menus
  const todasDesktop = '<li><a href="#" onclick="filtrarPorCategoria(\'\'); return false;">Todas as Categorias</a></li>';
  const todasMobile = '<li><a href="#" onclick="filtrarPorCategoria(\'\'); fecharMenuMobile(); return false;">Todas as Categorias</a></li>';
  
  menuCategoriasDesktop.innerHTML = todasDesktop;
  menuCategoriasMobile.innerHTML = todasMobile;
  
  // Adiciona cada categoria
  categorias.forEach(categoria => {
    // Desktop
    const liDesktop = document.createElement('li');
    const aDesktop = document.createElement('a');
    aDesktop.href = '#';
    aDesktop.textContent = categoria;
    aDesktop.onclick = (e) => {
      e.preventDefault();
      if (typeof window.filtrarPorCategoria === 'function') {
        window.filtrarPorCategoria(categoria);
      }
    };
    liDesktop.appendChild(aDesktop);
    menuCategoriasDesktop.appendChild(liDesktop);

    // Mobile
    const liMobile = document.createElement('li');
    const aMobile = document.createElement('a');
    aMobile.href = '#';
    aMobile.textContent = categoria;
    aMobile.onclick = (e) => {
      e.preventDefault();
      if (typeof window.filtrarPorCategoria === 'function') {
        window.filtrarPorCategoria(categoria);
      }
      fecharMenuMobile();
    };
    liMobile.appendChild(aMobile);
    menuCategoriasMobile.appendChild(liMobile);
  });
  
  console.log(`✅ ${categorias.length} categorias adicionadas`);
};

// =================== EXECUTA AO CARREGAR ===================
// Executa imediatamente se o DOM já estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', carregarNavbar);
} else {
  carregarNavbar();
}

// Função global para forçar atualização
window.forcarAtualizacaoNavbar = function() {
  console.log('🔄 Forçando atualização completa da navbar...');
  verificarAuthLocal();
  inicializarCarrinhoContador();
  verificarAdmin();
};