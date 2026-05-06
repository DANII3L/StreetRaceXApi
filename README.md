# STREET RACE X - BACKEND

### SISTEMA DE GESTIÓN PARA COMPETENCIAS URBANAS DE PIQUES LEGALES
Diseñado bajo principios de Clean Architecture y comunicación en tiempo real.

========================================================================
#### 1. TECNOLOGÍAS PRINCIPALES
========================================================================
* Node.js & TypeScript: Entorno de ejecución y lenguaje principal.
* Express: Framework para el desarrollo de la API REST.
* Firebase Admin SDK: Persistencia de datos en Firestore y Autenticación.
* Socket.io: Motor de notificaciones y eventos en tiempo real.
* Swagger: Documentación interactiva de la API.

========================================================================
#### 2. ARQUITECTURA DEL PROYECTO
========================================================================
El proyecto utiliza una estructura de capas para asegurar el desacoplamiento:
- Domain: Entidades y reglas de negocio centrales (Rangos, Puntuación).
- Use Cases: Lógica de aplicación (Gestión de retos, vehículos).
- Interfaces: Definición de contratos y abstracciones de repositorios.
- Infrastructure: Implementaciones de Firebase, controladores y sockets.

========================================================================
#### 3. INSTALACIÓN Y USO
========================================================================
1. Clonar el repositorio e instalar dependencias:
   npm install

2. Configurar variables de entorno:
   Crea un archivo .env con los siguientes puntos:
    PORT=...
    JWT_SECRET=...
    FIREBASE_PROJECT_ID=...
   Y crear el archivo firebase-service-account.json con las credenciales de FireBase para su uso.

3. Iniciar en modo desarrollo:
    npm run dev

4. Acceder a la documentación interactiva:
   Visita http://localhost:3000/api-docs

------------------------------------------------------------------------
Proyecto desarrollado para la asignatura de Software II.