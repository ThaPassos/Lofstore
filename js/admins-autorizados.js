// Lista de e-mails autorizados como administradores
export const ADMINS_AUTORIZADOS = [
    'thafinhapassos@gmail.com',
    'fbrunosp10@gmail.com'
    // Adicione mais e-mails de admin aqui conforme necessário
];

/**
 * Verifica se um e-mail tem permissão de administrador
 * @param {string} email - E-mail a ser verificado
 * @returns {boolean} - true se for admin, false caso contrário
 */
export function isEmailAdmin(email) {
    if (!email) return false;
    
    const emailNormalizado = email.toLowerCase().trim();
    
    return ADMINS_AUTORIZADOS.some(adminEmail => 
        adminEmail.toLowerCase().trim() === emailNormalizado
    );
}

/**
 * Adiciona um novo e-mail à lista de administradores
 * @param {string} email - E-mail a ser adicionado
 * @returns {boolean} - true se adicionado, false se já existia
 */
export function adicionarAdmin(email) {
    if (!email) return false;
    
    const emailNormalizado = email.toLowerCase().trim();
    
    if (!ADMINS_AUTORIZADOS.includes(emailNormalizado)) {
        ADMINS_AUTORIZADOS.push(emailNormalizado);
        console.log(`✅ Admin adicionado: ${emailNormalizado}`);
        return true;
    }
    
    console.log(`ℹ️ E-mail já está na lista: ${emailNormalizado}`);
    return false;
}

/**
 * Remove um e-mail da lista de administradores
 * @param {string} email - E-mail a ser removido
 * @returns {boolean} - true se removido, false se não encontrado
 */
export function removerAdmin(email) {
    if (!email) return false;
    
    const emailNormalizado = email.toLowerCase().trim();
    const index = ADMINS_AUTORIZADOS.findIndex(adminEmail => 
        adminEmail.toLowerCase().trim() === emailNormalizado
    );
    
    if (index !== -1) {
        ADMINS_AUTORIZADOS.splice(index, 1);
        console.log(`✅ Admin removido: ${emailNormalizado}`);
        return true;
    }
    
    console.log(`❌ E-mail não encontrado: ${emailNormalizado}`);
    return false;
}

/**
 * Lista todos os administradores autorizados
 * @returns {Array<string>} - Array com todos os e-mails de admin
 */
export function listarAdmins() {
    return [...ADMINS_AUTORIZADOS];
}