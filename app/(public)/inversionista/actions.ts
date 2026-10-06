'use server';

import {
  requestInvestorOtp,
  verifyInvestorOtp,
  logoutInvestor,
  grantDemoAccess,
  hasDemoAccess,
  getAuthenticatedInvestorSession,
} from '@/lib/investor/auth';

/**
 * Solicita el código OTP de 6 caracteres enviado por correo al inversionista.
 */
export async function requestOtpAction(email: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  try {
    return await requestInvestorOtp(email);
  } catch (error) {
    console.error('[requestOtpAction] Error:', error);
    return { ok: false, error: 'Ocurrió un error al procesar su solicitud. Intente de nuevo.' };
  }
}

/**
 * Verifica el código OTP de 6 caracteres y crea la sesión en cookie segura.
 */
export async function verifyOtpAction(
  email: string,
  code: string
): Promise<{ ok: boolean; error?: string; publicCode?: string }> {
  try {
    return await verifyInvestorOtp(email, code);
  } catch (error) {
    console.error('[verifyOtpAction] Error:', error);
    return { ok: false, error: 'Ocurrió un error al verificar su código.' };
  }
}

/**
 * Cierra la sesión activa del inversionista.
 */
export async function logoutInvestorAction(): Promise<{ ok: boolean }> {
  try {
    await logoutInvestor();
    return { ok: true };
  } catch (error) {
    console.error('[logoutInvestorAction] Error:', error);
    return { ok: false };
  }
}

/**
 * Verifica el código de acceso a la demostración (/inversionista/demo)
 */
export async function unlockDemoAction(accessCode: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const success = await grantDemoAccess(accessCode);
    if (!success) {
      return { ok: false, error: 'Código de demostración incorrecto.' };
    }
    return { ok: true };
  } catch (error) {
    console.error('[unlockDemoAction] Error:', error);
    return { ok: false, error: 'No se pudo validar el código de demostración.' };
  }
}

/**
 * Obtiene la sesión activa actual del inversionista si existe.
 */
export async function getCurrentInvestorSessionAction() {
  return await getAuthenticatedInvestorSession();
}

/**
 * Verifica si el usuario actual tiene acceso desbloqueado para la ruta de demostración.
 */
export async function checkDemoStatusAction() {
  return await hasDemoAccess();
}
