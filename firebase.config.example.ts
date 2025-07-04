// Ejemplo de configuración de Firebase
// Copia este archivo como src/app/firebase.config.ts y reemplaza con tus credenciales reales

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};

// Configuración para Vertex AI (opcional)
export const vertexAIConfig = {
  projectId: "tu-proyecto-id", // Mismo que Firebase
  location: "us-central1",
  modelName: "gemini-1.5-flash",
  maxTokens: 1024,
  temperature: 0.7
}; 