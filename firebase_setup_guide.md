# Guía de Conexión a Firebase Cloud y Despliegue en Hosting

Para conectar tu CMS a la nube de Firebase, permitir la carga de imágenes en Storage y preparar tu portafolio para un dominio propio, sigue estos pasos estructurados.

---

## Paso 1: Crear el Proyecto en Firebase Console
1. Ingresa a [Firebase Console](https://console.firebase.google.com/) con tu cuenta de Google.
2. Haz clic en **Agregar proyecto** (Add project).
3. Escribe el nombre de tu proyecto (ej. `portafolio-pepe-cardenas`) y haz clic en **Continuar**.
4. Puedes deshabilitar Google Analytics (es opcional) y hacer clic en **Crear proyecto**.
5. Espera a que se prepare y haz clic en **Continuar**.

---

## Paso 2: Registrar tu Aplicación Web y Copiar Credenciales
1. En la pantalla principal del proyecto (Overview), haz clic en el icono web **`</>`** (plataforma Web).
2. Escribe el apodo de tu app (ej. `Portafolio Web`) y haz clic en **Registrar app**.
3. Verás un bloque de código con un objeto llamado `firebaseConfig`. Copia **únicamente** el objeto de configuración:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
4. Abre el archivo [firebase-config.js](file:///c:/Users/SalaCardenas/Desktop/portafolio/js/firebase-config.js) en tu editor de código.
5. Reemplaza el objeto `firebaseConfig` existente (líneas 4 a 11) con los valores reales que acabas de copiar y guarda el archivo.

---

## Paso 3: Configurar Firestore Database en la Nube
1. En el menú de la izquierda de Firebase Console, ve a **Firestore Database** (debajo de compilación/build).
2. Haz clic en **Crear base de datos** (Create database).
3. Selecciona la ubicación del servidor (ej: `us-central1` o la más cercana a tu país) y haz clic en **Siguiente**.
4. Selecciona **Comenzar en modo de prueba** (esto es crucial para permitir lecturas/escrituras iniciales sin autenticación obligatoria) y haz clic en **Crear**.
5. Una vez creada, ve a la pestaña **Reglas** (Rules) en la parte superior y asegúrate de que la regla permita acceso público durante tus pruebas de desarrollo:
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
   *(Haz clic en **Publicar** si realizas algún cambio en la pestaña Reglas).*

---

## Paso 4: Configurar Firebase Storage para Imágenes y GIFs
1. En el menú izquierdo de Firebase Console, ve a **Storage**.
2. Haz clic en **Comenzar** (Get started).
3. Selecciona **Comenzar en modo de prueba** y haz clic en **Siguiente** y luego en **Listo**.
4. Ve a la pestaña **Reglas** (Rules) de Storage y edítalas para permitir subir archivos sin autenticación de la siguiente forma:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }
   ```
5. Haz clic en **Publicar** (Publish).

---

## Paso 5: Despliegue en Firebase Hosting (Gratuito + Dominio Propio)
Firebase ofrece un plan de hosting gratuito excelente con SSL automático y soporte para vincular tu propio dominio personalizado.

### 5.1. Instalar la herramienta CLI de Firebase
Si no tienes la herramienta de comandos de Firebase, abre una terminal en tu computadora (PowerShell o CMD) y corre:
```bash
npm install -g firebase-tools
```
*(Nota: Para instalar esto, es necesario tener Node.js instalado en tu sistema).*

### 5.2. Iniciar sesión en tu terminal
Corre el siguiente comando para iniciar sesión con tu cuenta de Google en la consola de comandos:
```bash
firebase login
```

### 5.3. Inicializar el proyecto en la carpeta del portafolio
Asegúrate de estar ubicado en tu terminal dentro de la carpeta `c:\Users\SalaCardenas\Desktop\portafolio` y corre:
```bash
firebase init
```

Durante el asistente de configuración, selecciona las siguientes opciones:
1. **¿Qué características deseas configurar?** 
   * Selecciona **Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys** (Usa la barra espaciadora para seleccionar y Enter para confirmar).
2. **Project Setup (Configuración del proyecto):**
   * Elige **Use an existing project** (Usar un proyecto existente).
   * Selecciona el proyecto de portafolio que creaste en el Paso 1 de la lista.
3. **Hosting Setup (Configuración del hosting):**
   * **What do you want to use as your public directory?** Escribe **`.`** (un punto, que representa la carpeta raíz actual donde están tus archivos html/css).
   * **Configure as a single-page app (rewrite all urls to /index.html)?** Escribe **`N`** (No, porque tienes múltiples archivos HTML estáticos independientes como `sobre-mi.html`, `proyecto.html`, etc.).
   * **Set up automatic builds and deploys with GitHub?** Escribe **`N`** (No).
   * Si te pregunta si deseas sobreescribir `index.html`, escribe **`N`** (No, para conservar tu diseño).

### 5.4. Subir la web a internet
Una vez configurado todo, simplemente corre:
```bash
firebase deploy
```
La terminal te devolverá una URL pública (ej. `https://tu-proyecto.web.app` o `https://tu-proyecto.firebaseapp.com`). ¡Tu sitio web y el CMS ya estarán funcionando online y sincronizados en tiempo real!

---

## Paso 6: Vincular tu Dominio Personalizado
Una vez que el sitio está subido a Firebase Hosting:
1. Ve a **Hosting** en el menú izquierdo de Firebase Console.
2. Haz clic en el botón **Agregar dominio personalizado** (Add custom domain).
3. Escribe tu dominio (ej. `www.pepecardenas.com`).
4. Firebase te dará unos registros DNS de tipo **TXT** y **A** (valores numéricos de IP).
5. Ve al panel del proveedor donde compraste tu dominio (ej: GoDaddy, Namecheap, etc.) e introduce esos registros en la zona DNS.
6. Espera un lapso de 1 a 24 horas para la propagación del dominio. Firebase creará y activará el certificado de seguridad SSL (HTTPS) de forma automática y gratuita.
