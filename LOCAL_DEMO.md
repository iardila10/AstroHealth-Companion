# Demo local sin hardware

La demo genera lecturas **sintéticas** en el backend local, las evalúa con el
motor existente y las guarda en SQLite. No requiere Render, Internet ni sensores
físicos mientras la aplicación ya esté instalada. No usar sus resultados para
decisiones médicas.

## Iniciar en Windows

Abre dos terminales en la carpeta del proyecto.

En la primera, inicia el backend:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

En la segunda, inicia el dashboard:

```powershell
npm install
npm run dev
```

Abre la URL local que muestra Vite (normalmente `http://localhost:5173`),
registra un tripulante y pulsa **Iniciar demo**. Elige un perfil normal, de
atención o crítico; la API genera y evalúa una lectura cada 2,5 segundos.
**Pausar demo** detiene la generación. El indicador de conexión a la API se
mantiene separado del estado de Internet.

La base SQLite local se crea en `backend/astrohealth.db`. El endpoint del
simulador no está disponible cuando el backend está en modo producción. Para
volver a usar la demo sin Internet, instala primero las dependencias y abre el
dashboard desde el mismo equipo que ejecuta la API.
