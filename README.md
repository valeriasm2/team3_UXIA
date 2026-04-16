# 🚗 Projecte Django + React

Projecte base amb Django (backend/API) i React (frontend), connectats entre si.

---

## 🗂️ Estructura del projecte

```
myprojectUxia/
├── db.sqlite3
├── manage.py
├── requirements.txt
├── myprojectUxia/        ← configuració Django (settings.py, urls.py)
├── Uxiapp/               ← app Django (models, api...)
└── react/                ← frontend React (Vite)
    ├── src/
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## ⚙️ Com funciona

- **Django** corre a `http://localhost:8000` → és el backend, guarda dades i respon peticions
- **React** corre a `http://localhost:5173` → és el frontend, pinta el que Django li dona
- React parla amb Django mitjançant `fetch()` a les URLs de l'API (`/api/...`)

---

## 🖥️ Desplegar en local (pas a pas)

### 1. Clonar el repositori

```bash
git clone <URL_DEL_REPO>
cd myprojectUxia
```

### 2. Crear i activar l'entorn virtual de Python

```bash
python3 -m venv uxia_virtual
source uxia_virtual/bin/activate
```

> A Windows seria: `uxia_virtual\Scripts\activate`

### 3. Instal·lar dependències de Django

```bash
pip install -r requirements.txt
```

### 4. Fer les migracions de la base de dades

```bash
python manage.py migrate
```

### 5. Crear superusuari (per accedir a l'admin)

```bash
python manage.py createsuperuser
```

### 6. Arrancar Django

```bash
python manage.py runserver
```

✅ Django corrent a → `http://localhost:8000`  
✅ Admin panel a → `http://localhost:8000/admin`  
✅ API de prova a → `http://localhost:8000/api/test`  

---

### 7. Instal·lar dependències de React (només el primer cop)

```bash
cd react
npm install
```

### 8. Arrancar React

```bash
npm run dev
```

✅ React corrent a → `http://localhost:5173`

---

## 🔗 Verificar que estan connectats

Amb els dos servidors arrancats, ves a `http://localhost:5173`.  
Hauries de veure: **"Django y React conectados!"**

---

## 📋 Resum de terminals

Sempre necessites **dues terminals obertes**:

| Terminal 1 (Django) | Terminal 2 (React) |
|---|---|
| `source uxia_virtual/bin/activate` | `cd react` |
| `python manage.py runserver` | `npm run dev` |
| `http://localhost:8000` | `http://localhost:5173` |

---
