'use server';

export async function verifyMasterPassword(password: string) {
    const adminPassword = "Semini@123";

    if (!adminPassword) {
        console.error('Master password not configured in environment variables');
        return { success: false, error: 'Server configuration error' };
    }

    if (password === adminPassword) {
        return { success: true, isSuperAdmin: false };
    }

    return { success: false, error: 'Invalid master password' };
}
