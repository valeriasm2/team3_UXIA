# Admin Login - Guía de Uso

## ¿Cómo acceder al panel de administración?

1. **Accede a la URL del admin:**

   ```
   http://localhost:5173/admin
   ```

2. **Ingresa tus credenciales:**
   - **Usuario:** admin
   - **Contraseña:** admin123

3. **Resultado:**
   - Una vez autenticado, serás redirigido a `/admin/dashboard`
   - El token de autenticación se guardará en `localStorage`
   - Tendrás acceso al panel de administración de UXIA

## Endpoints de API disponibles

### Autenticación

- **POST** `/api/auth/login`
  - Body: `{ "username": "admin", "password": "admin123" }`
  - Response: `{ "token": "...", "user": "admin" }`

## Rutas disponibles en React

| Ruta               | Descripción                         |
| ------------------ | ----------------------------------- |
| `/`                | Página principal de UXIA (públic)   |
| `/admin`           | Página de login del administrador   |
| `/admin/dashboard` | Panel de administración (protegido) |

## Funcionamiento del sistema

### Frontend (React)

1. El componente `AdminLogin` maneja el formulario de login
2. Al hacer login, se llama a `/api/auth/login` con las credenciales
3. Si es correcto, se guarda el token en `localStorage`
4. El usuario es redirigido a `/admin/dashboard`
5. La ruta `/admin/dashboard` está protegida por `ProtectedRoute`
6. Si no hay token, se redirige automáticamente a `/admin`

### Backend (Django)

1. Nuevo endpoint `/api/auth/login` en `Uxiapp/api.py`
2. Solo permite login si el usuario tiene `is_staff=True`
3. Retorna un token de autenticación usando Django REST Framework
4. La base de datos tiene la tabla `authtoken_token` para almacenar tokens

## Cerrar sesión

En el dashboard, haz clic en el botón "Cerrar Sesión" para:

- Eliminar el token de `localStorage`
- Ser redirigido a `/admin`
- Limpiar la sesión

## Notas importantes

- El token se almacena en `localStorage` del navegador
- Actualmente, la protección es del lado del cliente
- Para producción, se recomienda validar el token también en el backend
- Los usuarios deben tener `is_staff=True` para poder hacer login
- El token nunca expira (configurable en producción)

## Crear más usuarios administradores

Para crear más usuarios administradores, usa el Django shell:

```bash
source uxia_virtual/bin/activate
cd myprojectUxia
python manage.py shell
```

Luego ejecuta:

```python
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

# Crear un nuevo usuario
user = User.objects.create_user(username='nuevo_admin', password='contraseña', is_staff=True, is_superuser=True)

# Crear el token
token = Token.objects.get_or_create(user=user)
print(f"Usuario: {user.username}, Token: {token[0].key}")
```

O usa el Django admin tradicional en `/admin/` del navegador con el usuario `admin`.
