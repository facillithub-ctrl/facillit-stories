import "server-only";
import admin from "firebase-admin";

function initFirebase() {
  if (!admin.apps.length) {
    try {
      let serviceAccount;

      // 1. Tenta estratégia JSON (Antiga)
      const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (rawJson) {
        try {
          serviceAccount = JSON.parse(rawJson);
        } catch (e) { /* Ignora erro de JSON */ }
      }

      // 2. Tenta estratégia Variáveis Individuais (Nova e Mais Segura)
      if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY) {
        serviceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
        };
      }

      if (serviceAccount && serviceAccount.privateKey) {
        // CORREÇÃO CRÍTICA: Garante que \\n (texto) vire \n (nova linha real)
        serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, '\n');

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        
        console.log("🔥 Firebase Admin conectado (Variáveis Individuais)!");
      } else {
        console.warn("⚠️ Aviso: Credenciais do Firebase incompletas. Usando Mock.");
      }

    } catch (error: any) {
      console.error("⚠️ Erro Firebase:", error.message);
      return null;
    }
  }
  
  return admin.apps.length ? admin : null;
}

export async function sendPushNotification(userId: string, title: string, body: string) {
  const firebase = initFirebase();

  if (!firebase) {
    console.log(`[MOCK PUSH] Para: ${userId} | ${title}`);
    return;
  }

  // Aqui entraria o envio real se tivéssemos o token do usuário
  // const messaging = firebase.messaging();
  console.log(`[FIREBASE REAL] Tentando enviar para: ${userId}`);
}