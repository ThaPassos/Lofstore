import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Verifica se o usuário está logado e atualiza a interface
export function configurarAuthDisplay() {
  onAuthStateChanged(auth, (user) => {
    const loginLink = document.getElementById('login-link');
    const loginItem = document.getElementById('login-admin-item');
    
    if (user) {
      // USUÁRIO LOGADO - mostra "Painel Admin" com link para admin.html
      if (loginLink) {
        loginLink.innerHTML = `Painel Admin`;
        loginLink.href = "admin.html"; // Direciona para o painel
        loginItem.classList.add('admin-logado');
      }
      
      // Remove evento de logout anterior (se houver)
      const novoLink = loginLink.cloneNode(true);
      loginLink.parentNode.replaceChild(novoLink, loginLink);
      
      // Não adiciona evento de logout - deixa o link funcionar normalmente
      
      // Adiciona status do admin
      const statusExistente = loginItem.querySelector('.status-admin');
      if (!statusExistente) {
        const status = document.createElement('span');
        status.className = 'status-admin';
        status.textContent = `Logado: ${user.email}`;
        loginItem.appendChild(status);
      }
      
      // Habilita botões de edição nos produtos
      setTimeout(() => habilitarBotoesEdicao(), 500);
      
    } else {
      // USUÁRIO NÃO logado - mostra "Login Admin"
      if (loginLink) {
        loginLink.innerHTML = `Login Admin`;
        loginLink.href = "login.html";
        loginItem.classList.remove('admin-logado');
      }
      
      // Remove status se existir
      const status = loginItem?.querySelector('.status-admin');
      if (status) status.remove();
      
      // Remove botões de edição
      removerBotoesEdicao();
    }
  });
}

// Habilita botões de edição nos produtos
function habilitarBotoesEdicao() {
  const cards = document.querySelectorAll('.card-produto');
  
  cards.forEach(card => {
    // Verifica se já tem botões
    if (!card.querySelector('.botoes-admin')) {
      const produtoId = card.dataset.id;
      const produtoNome = card.querySelector('.nome-produto')?.textContent || 'Produto';
      
      
      card.insertAdjacentHTML('beforeend', botoesHTML);
    }
  });
}

// Remove botões de edição
function removerBotoesEdicao() {
  const botoes = document.querySelectorAll('.botoes-admin');
  botoes.forEach(btn => btn.remove());
}

// Função de logout (pode ser chamada de qualquer lugar)
export function fazerLogout() {
  if (confirm('Deseja sair do painel admin?')) {
    signOut(auth).then(() => {
      localStorage.removeItem('adminLogado');
      localStorage.removeItem('adminEmail');
      window.location.href = 'index.html';
    }).catch((error) => {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao fazer logout. Tente novamente.');
    });
  }
}

export function adicionarModal() {
  // Verifica se o modal já existe
  if (document.getElementById('modal-overlay')) {
    return;
  }
  
  const modalHTML = `
    <div id="modal-overlay" class="modal-overlay">
      <div class="modal-edicao">
        <div class="modal-header">
          <h3>Editar Produto</h3>
          <button class="fechar-modal" onclick="fecharModal()">×</button>
        </div>
        <form id="form-editar" class="modal-form">
          <input type="hidden" id="produto-id">
          
          <!-- SEÇÃO DE IMAGEM SIMPLIFICADA -->
          <div class="secao-imagem">
            <h4>Imagem do Produto</h4>
            
            <!-- Preview da imagem -->
            <div class="imagem-preview-area">
              <img id="imagem-preview" src="" alt="Preview" class="imagem-preview">
              <div class="sem-imagem" id="sem-imagem">
                <span></span>
                <p>Nenhuma imagem selecionada</p>
              </div>
            </div>
            
            <!-- Botão de upload -->
            <label for="upload-imagem" class="btn-upload-imagem">
              <span>Escolher imagem</span>
              <input type="file" id="upload-imagem" accept="image/*" style="display: none;">
            </label>
            
            <div class="dicas-imagem">
              <small>• Formatos: JPG, PNG, WebP</small><br>
              <small>• Tamanho máximo: 5MB</small><br>
              <small>• Recomendado: 600x600px</small>
            </div>
            
            <!-- Status do upload -->
            <div class="status-upload" id="status-upload"></div>
          </div>
          
          <!-- Campos do produto -->
          <input type="text" id="produto-nome" placeholder="Nome do produto" required>
          <input type="number" id="produto-preco" placeholder="Preço" step="0.01" required>
          <textarea id="produto-descricao" placeholder="Descrição"></textarea>
          <input type="text" id="produto-categoria" placeholder="Categoria">
          
          <!-- Campo oculto para URL da imagem -->
          <input type="hidden" id="produto-imagem">
          
          <select id="produto-ativo">
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
          
          <div class="botoes-modal">
            <button type="button" class="btn-cancelar" onclick="fecharModal()">Cancelar</button>
            <button type="submit" class="btn-salvar">Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}