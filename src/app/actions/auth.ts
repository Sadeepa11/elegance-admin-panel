'use server';

export async function verifyMasterPassword(password: string) {
    const superAdminPassword = process.env.MASTER_PASSWORD_SUPER_ADMIN;
    const adminPassword = process.env.MASTER_PASSWORD_ADMIN;

    if (!superAdminPassword || !adminPassword) {
        console.error('Master passwords not configured in environment variables');
        return { success: false, error: 'Server configuration error' };
    }

    if (password === superAdminPassword) {
        return { success: true, isSuperAdmin: true };
    } else if (password === adminPassword) {
        return { success: true, isSuperAdmin: false };
    }

    return { success: false, error: 'Invalid master password' };
}
