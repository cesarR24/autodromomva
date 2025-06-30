# Configuración de Firebase para Autodrome App

## 🔧 Pasos para Configurar Firebase

### 1. Habilitar Firestore Database
1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto `dragrace-autodromomva`
3. Ve a **Firestore Database** en el menú lateral
4. Haz clic en **Crear base de datos**
5. Selecciona **Comenzar en modo de prueba** (para desarrollo)
6. Elige una ubicación cercana (ej: `us-central1`)

### 2. Configurar Reglas de Firestore
1. En Firestore Database, ve a la pestaña **Reglas**
2. Reemplaza las reglas existentes con:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
3. Haz clic en **Publicar**

### 3. Habilitar Authentication (Opcional)
1. Ve a **Authentication** en el menú lateral
2. Haz clic en **Get started**
3. Ve a la pestaña **Sign-in method**
4. Habilita **Email/Password**
5. Opcionalmente habilita otros métodos como **Google**

### 4. Verificar Configuración
1. Asegúrate de que tu `firebase.config.ts` tenga la configuración correcta
2. La aplicación debería funcionar sin errores de Firestore

## 🚨 Solución de Problemas

### Error 400 en Firestore
- Verifica que Firestore esté habilitado en tu proyecto
- Asegúrate de que las reglas permitan lectura/escritura
- Revisa la consola del navegador para errores específicos

### Error de Autenticación
- Si Firebase Auth está deshabilitado, la app funcionará en modo desarrollo
- Para producción, habilita Authentication en la consola de Firebase

## 📝 Notas de Desarrollo
- Las reglas actuales permiten acceso total (solo para desarrollo)
- Para producción, implementa reglas de seguridad apropiadas
- La app incluye manejo de errores mejorado con logging 