# 🔐 Secure Password Manager

## 🛡️ Descripción del proyecto

Secure Password Manager es una aplicación web diseñada para gestionar contraseñas de manera segura, aplicando principios modernos de criptografía. Todo el cifrado ocurre **en el navegador** gracias a WebCrypto API, protegiendo al usuario incluso si el servidor es comprometido.

📌 Características principales:

- Modelo **Zero-Knowledge Backend**
- Cifrado autenticado con **AES-256-GCM**
- Derivación de clave local con **PBKDF2-HMAC-SHA256**
- Funciona **offline** con IndexedDB
- Sincronización segura mediante **JWT + ETag**
- Generación y gestión de contraseñas

---

## 🧱 Arquitectura

React (WebCrypto)  ← cifrado y UI
     |
 REST API (JWT + ETag)
     |
PostgreSQL (solo blobs cifrados)

El backend nunca ve la Master Password ni datos en texto plano.

---

## 🔐 Seguridad aplicada

| Función | Tecnología |
|--------|------------|
| Derivación de clave | PBKDF2-SHA256 (300k iteraciones) |
| Cifrado autenticado | AES-256-GCM |
| Persistencia local | IndexedDB (offline-first) |
| Autenticación | JWT |
| Control de versiones | ETag + If-Match |
| Transporte | HTTPS |

Incluso si un atacante accede a la base de datos:

> Los datos permanecen cifrados → **Confidencialidad preservada**

---

## 🚀 Tecnologías utilizadas

| Área | Stack |
|------|------|
| Frontend | React + Vite + Zustand + TailwindCSS |
| Criptografía | WebCrypto API |
| Backend | FastAPI + SQLAlchemy + JWT |
| Base de datos | PostgreSQL |
| Infraestructura | Docker & Docker Compose |

---

## 📦 Instalación y ejecución

### Backend

cd backend
docker-compose up --build

API: http://localhost:8000

---

### Frontend

cd frontend
npm install
npm run dev

Web app: http://localhost:5173

> El proxy del frontend redirige automáticamente `/api` hacia el backend

---

## 🗄️ Base de datos

users(
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  password_h TEXT -- hash PBKDF2
)

vaults(
  user_id INTEGER REFERENCES users(id),
  blob BYTEA,      -- contenido cifrado
  version INTEGER,
  etag TEXT,
  PRIMARY KEY(user_id)
)

---

## 🧪 Flujo de uso

1️⃣ Usuario se registra → hash de contraseña guardado  
2️⃣ Usuario crea Master Password → solo local  
3️⃣ Cifrado del vault vacío → upload seguro  
4️⃣ Gestión de contraseñas → cifrado Authenticated Encryption

---

## 🧩 Limitaciones

- Aún no hay sincronización multi-dispositivo
- Argon2id no se usa por restricciones actuales del navegador
- Faltan análisis de seguridad sobre canales laterales

---

## 👥 Autor

| Nombre | Rol |
|--------|-----|
| Sanders Chancan | Desarrollo completo |

Universidad: **UTEC — Curso de Criptografía 2025-1**

---

## 📚 Referencias

- RFC 8018 — PKCS#5: Password-Based Cryptography Specification
- NIST SP 800-38D — Galois/Counter Mode (AES-GCM)
- Bonneau et al. — The Science of Guessing: Password Analysis

---

🎯 **Objetivo logrado**

Se implementó un sistema donde la seguridad depende únicamente del usuario, aplicando correctamente técnicas criptográficas modernas dentro de una arquitectura realista y usable.
