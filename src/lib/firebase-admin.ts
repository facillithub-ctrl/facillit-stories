import "server-only";
import admin from "firebase-admin";

interface NotificationPayload {
  title: string;
  body: string;
}

function initFirebase() {
  if (!admin.apps.length) {
    try {
      // Tenta pegar o JSON completo da variável de ambiente (Recomendado para Vercel)
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
        : null;

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Fallback: Tenta usar a estratégia padrão (GOOGLE_APPLICATION_CREDENTIALS ou metadata server)
        // Isso funciona se você estiver hospedando no Google Cloud (App Engine, Cloud Run)
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
      console.log("🔥 Firebase Admin inicializado com sucesso!");
    } catch (error) {
      console.error("⚠️ Erro ao iniciar Firebase Admin:", error);
    }
  }
  return admin;
}

export async function sendPushNotification(userId: string, title: string, body: string) {
  const firebase = initFirebase();
  
  // Em um cenário real, você buscaria o token FCM do usuário no banco:
  // const { data } = await supabase.from('profiles').select('fcm_token').eq('user_id', userId).single();
  // const fcmToken = data?.fcm_token;

  console.log(`[PUSH MOCK] Enviando para ${userId}: "${title}" - "${body}"`);

  // Código para envio real (descomente quando tiver a lógica de tokens no frontend):
  /*
  if (fcmToken) {
    try {
      await firebase.messaging().send({
        token: fcmToken,
        notification: { title, body },
      });
    } catch (e) {
      console.error("Erro ao enviar FCM:", e);
    }
  }
  */
}