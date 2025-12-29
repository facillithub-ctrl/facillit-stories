import "server-only";
import admin from "firebase-admin";

function initFirebase() {
  if (!admin.apps.length) {
    try {
      const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (rawServiceAccount) {
        // Tenta fazer o parse do JSON
        let serviceAccount;
        try {
            serviceAccount = JSON.parse(rawServiceAccount);
        } catch (e) {
            console.error("❌ Erro de JSON no .env do Firebase. Verifique as aspas.");
            return null;
        }

        // --- CORREÇÃO CRÍTICA DA CHAVE PRIVADA ---
        // Transforma os caracteres literais "\n" em quebras de linha reais
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        
        console.log("🔥 Firebase Admin conectado!");
      } else {
        console.warn("⚠️ Aviso: FIREBASE_SERVICE_ACCOUNT vazio. Notificações desativadas.");
      }
    } catch (error: any) {
      // Captura o erro "Invalid PEM" e impede que o site caia
      console.error("⚠️ Erro na chave do Firebase (PEM):", error.message);
      return null;
    }
  }
  
  return admin.apps.length ? admin : null;
}

export async function sendPushNotification(userId: string, title: string, body: string) {
  const firebase = initFirebase();

  if (!firebase) {
    // Modo Mock se a conexão falhar
    console.log(`[MOCK NOTIFICATION] Para: ${userId} | ${title}`);
    return;
  }

  // Aqui entraria o envio real...
  console.log(`[FIREBASE REAL] Tentando enviar para: ${userId}`);
}