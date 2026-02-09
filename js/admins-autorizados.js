export const ADMINS_AUTORIZADOS = [
    'thafinhapassos@gmail.com',
    'fbrunosp10@gmail.com'

];

export function isEmailAdmin(email) {
    if (!email) return false;
    
    const emailNormalizado = email.toLowerCase().trim();
    
    return ADMINS_AUTORIZADOS.some(adminEmail => 
        adminEmail.toLowerCase().trim() === emailNormalizado
    );
}

export function adicionarAdmin(email) {
    if (!email) return false;
    
    const emailNormalizado = email.toLowerCase().trim();
    
    if (!ADMINS_AUTORIZADOS.includes(emailNormalizado)) {
        ADMINS_AUTORIZADOS.push(emailNormalizado);
        console.log(`Admin adicionado: ${emailNormalizado}`);
        return true;
    }
    
    console.log(`Email já está na lista: ${emailNormalizado}`);
    return false;
}

export function removerAdmin(email) {
    if (!email) return false;
    
    const emailNormalizado = email.toLowerCase().trim();
    const index = ADMINS_AUTORIZADOS.findIndex(adminEmail => 
        adminEmail.toLowerCase().trim() === emailNormalizado
    );
    
    if (index !== -1) {
        ADMINS_AUTORIZADOS.splice(index, 1);
        console.log(`Admin removido: ${emailNormalizado}`);
        return true;
    }
    
    console.log(`Email não encontrado: ${emailNormalizado}`);
    return false;
}