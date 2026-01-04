# Sistema de Reserva de Cortes de Cabello

Un sistema minimalista para la reserva de cortes de cabello con funcionalidades completas de calendario, gestión de citas y panel de barbería.

## Características

- **Calendario interactivo**: Vista anual con navegación por meses
- **Sistema de reservas**: Formulario modal para crear nuevas reservas
- **Historial de reservas**: Con filtros por año, mes, semana y día
- **Cifrado de teléfonos**: Números de teléfono cifrados en el historial
- **Panel de barbería**: Gestión de promociones y tipos de cortes
- **Diseño minimalista**: Paleta de colores blanco y negro con bordes redondeados
- **Responsive**: Diseño adaptable a diferentes dispositivos

## Estructura del Proyecto

```
hair-booking-system/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── calendar.js
│   ├── booking.js
│   ├── encryption.js
│   └── barber-panel.js
└── data/
    └── appointments.json
```

## Funcionalidades

### Calendario
- Vista mensual con indicación de días con reservas
- Navegación por mes y año
- Al hacer clic en un día, se abre el formulario de reserva

### Sistema de Reservas
- Formulario modal para crear nuevas reservas
- Validación de campos obligatorios
- Control de disponibilidad horaria
- Cifrado de números de teléfono

### Historial de Reservas
- Listado de todas las reservas
- Filtros por año, mes, día de la semana y día específico
- Visualización con información cifrada

### Panel de Barbería
- Gestión de promociones semanales
- Administración de tipos de cortes
- Configuración de horarios (con código de acceso)

## Tecnologías Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- localStorage para almacenamiento local

## Instalación

1. Clona o descarga el proyecto
2. Abre `index.html` en tu navegador web
3. ¡Listo para usar!

## Uso

### Como Cliente
1. Navega por el calendario para encontrar un día disponible
2. Haz clic en un día para abrir el formulario de reserva
3. Completa los datos y selecciona un horario disponible
4. Confirma la reserva

### Como Barbero
1. Haz clic en el botón "BARBERO" en la barra de navegación
2. Ingresa el código de acceso (por defecto: `barber123`)
3. Gestiona promociones, tipos de cortes y horarios

## Código de Acceso para Barbero
- Código por defecto: `barber123`

## Diseño

- Estilo minimalista con colores blanco y negro
- Bordes redondeados de 20-35px
- Barra de navegación fija con efecto de vidrio
- Transiciones suaves y animaciones

## Almacenamiento

- Todos los datos se almacenan localmente en el navegador usando localStorage
- Los números de teléfono se cifran antes de almacenarse

## Personalización

Puedes personalizar:
- Horarios disponibles (en `js/booking.js`)
- Tipos de cortes predeterminados (en `js/main.js`)
- Promociones iniciales (en `js/main.js`)
- Estilos (en `css/styles.css`)