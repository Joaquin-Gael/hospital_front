# Proyecto "Hospital SDLG" – Documento Base

Este documento resume la estructura mínima para armar el informe final del proyecto. Está diseñado para copiar y pegar en un procesador de texto y darle formato posteriormente.

## 1) SECCIONES INICIALES
### 1.a Portada
- **Título del trabajo:** Hospital SDLG – Portal Web y Gestión de Turnos.
- **Autor(es):** (completar)
- **Institución educativa:** (completar)
- **Curso y especialidad:** (completar)
- **Profesor(es):** (completar)
- **Lugar y fecha:** (completar)
- **Versión del documento:** v1.0 (colocar control de cambios si se generan nuevas versiones).

### 1.b Índice
- Generar índice automático con las secciones del documento.
- Añadir lista de figuras, tablas y anexos (para ubicar diagramas de casos de uso, Gantt, mockups, etc.).

### 1.c Resumen ejecutivo
- Breve párrafo (5–8 líneas) que explique el problema, el objetivo del portal hospitalario y los módulos clave (landing informativa, turnos, paneles de usuario y médico).
- Destacar que la solución está construida en Angular 19 con SSR para mejorar rendimiento y SEO.

## 2) PLANTEO DEL PROYECTO
### 2.a Objetivos y descripción (fundamentación)
- **Propósito principal:** Crear un front-end hospitalario con experiencia moderna que centraliza información institucional, noticias y especialidades, e integra flujos para solicitar turnos y acceder a paneles de usuario/médico.
- **Metas específicas:**
  - Ofrecer landing page informativa y atractiva (`home` con héroe, estadísticas, servicios, especialidades, médicos destacados, noticias y FAQs).
  - Proveer guía clara de turnos (`about-appointments`) y acceso directo al turno en línea (`/shifts`).
  - Preparar paneles dedicados para pacientes y médicos (`user-panel`, `medic-panel`) y rutas de autenticación (`auth`).
  - Incorporar datos ficticios de ejemplo para mostrar beneficios y servicios (departamentos, estadísticas, personal médico y noticias).
  - Habilitar SSR con Express para optimizar SEO y tiempos de carga inicial.
  - Implementar diseño responsive y accesible (contrastes, foco, labels y navegación por teclado en formularios).
- **Alcance del MVP:**
  - Contenido estático de información hospitalaria, mock de datos de doctores, especialidades y FAQs.
  - Flujo de solicitud de turno básico sin integración a backend productivo (simulación de envío/validación en front).
  - Paneles con rutas y layout listos para integrar datos reales.
- **Fuera de alcance (versión actual):** pagos en línea, historial clínico, notificaciones push/SMS, integración con aseguradoras.

### 2.a.i Preguntas guía
- ¿Qué problema resuelve? Centralizar turnos y comunicación con pacientes.
- ¿Quién se beneficia? Pacientes, médicos y área administrativa.
- ¿Cómo se mide el éxito? Tasa de solicitudes de turno completadas, tiempo promedio para encontrar información de contacto, feedback de usabilidad.

### 2.c Usuarios y roles
- **Visitante anónimo:** Navega landing, consulta turnos, noticias y FAQs.
- **Paciente registrado:** Solicita y administra turnos desde `user-panel`.
- **Médico:** Revisa agenda, turnos y pacientes asignados en `medic-panel`.
- **Administrador:** Gestiona catálogos (especialidades, médicos, horarios) desde rutas `admin/*`.

### 2.d Historias de usuario sugeridas
- Como paciente, quiero ver horarios y requisitos antes de solicitar turno para llegar preparado.
- Como paciente, quiero agendar un turno online sin llamar por teléfono para ahorrar tiempo.
- Como médico, quiero ver mis turnos en una vista consolidada para planificar el día.
- Como administrador, quiero actualizar especialidades y médicos para que la información esté siempre vigente.

### 2.b Planilla de distribución de tareas
- Incluir tabla con roles sugeridos: Líder técnico, Frontend, UI/UX, QA/Testing, DevOps/CI, Documentación. Completar con nombres y responsabilidades reales.
- Agregar columna de entregables (ej.: mockups, componentes Angular, casos de prueba, pipeline CI) y columna de estado (Pendiente/En progreso/Hecho).

## 3) METODOLOGÍA Y PLANIFICACIÓN
### 3.a Herramientas utilizadas
- **Lenguajes:** TypeScript + HTML + SCSS (Angular standalone components).
- **Frameworks/Librerías:** Angular 19, Angular Material, SSR con Express, animaciones (`@angular/animations`, `animejs`), gráficos (`ng-apexcharts`), fuentes (`@fortawesome/fontawesome`), Tailwind (configurado en `postcss`), formularios reactivos.
- **Gestión de proyectos (sugerido):** Trello/Notion/GitHub Projects para tareas y cronograma; Git y GitHub para control de versiones.
- **Otras herramientas:** npm/Angular CLI, Husky (si se habilita), Figma para UI, Audacity u otras para audio si aplica.
- **Pruebas y calidad:** Jasmine/Karma (unitarias), pruebas manuales exploratorias, linters de Angular/ESLint, Prettier para formato.
- **Despliegue:** SSR con Express para producción; posibilidad de usar Docker/Render/Netlify para hosting.

### 3.b Diagrama de Gantt (cronograma de trabajo)
- Proponer fases: Investigación y UX → Diseño visual → Configuración Angular/SSR → Landing Home → Módulo de turnos (`about-appointments` y `/shifts`) → Panel usuario/médico → Integración de datos y animaciones → Pruebas/QA → Despliegue.
- Incluir hitos semanales con entregables claros:
  1. **Semana 1:** Kick-off, research de usuarios, wireframes.
  2. **Semana 2:** Diseño UI en Figma, paleta, iconografía, componentes base.
  3. **Semana 3:** Configuración Angular, SSR y navegación inicial.
  4. **Semana 4:** Desarrollo de landing (hero, stats, servicios, FAQs).
  5. **Semana 5:** Flujo de turnos (`about-appointments`, `/shifts`) y validaciones.
  6. **Semana 6:** Paneles (`user-panel`, `medic-panel`) con maquetado y rutas protegidas (mock auth).
  7. **Semana 7:** Animaciones, gráficos, integración de datos simulados y pruebas unitarias.
  8. **Semana 8:** QA integral, accesibilidad, optimizaciones y despliegue.

### 3.c Gestión de riesgos
- Identificar riesgos como retrasos en diseño, cambios de requerimientos, falta de datos reales, desempeño en dispositivos móviles.
- Mitigaciones: definir alcance de MVP, pruebas de performance (Lighthouse), backlog priorizado, feature flags para módulos opcionales.

### 3.d Supuestos y dependencias
- Disponibilidad de assets gráficos (logo, paleta de colores, iconografía médica).
- Acceso a cuentas de correo/SMS si se integran notificaciones.
- Participación de médicos/administrativos para validar flujos de turnos y paneles.
- Infraestructura mínima para SSR (servidor Node/Express) y CDN para assets.

### 3.e Criterios de éxito medibles
- 90% de usuarios puede encontrar información de contacto en <30 segundos.
- 80% completa el formulario de turno sin errores en el primer intento.
- Puntuación ≥4/5 en encuesta de usabilidad interna.
- Tiempo de render inicial <3s en dispositivos móviles de gama media.

## 4) DISEÑO Y DESARROLLO
### 4.a Casos de uso (descripción y diagramas)
- **Solicitar turno en línea:** El usuario revisa requisitos en `about-appointments`, presiona “Solicitar turno online” y navega a `/shifts` para completar datos y confirmar disponibilidad.
- **Explorar servicios y especialidades:** Desde `home`, el visitante consulta departamentos (`DEPARTMENTS`), especialidades (`SPECIALTIES`) y servicios destacados; puede filtrar o navegar a secciones específicas.
- **Conocer médicos y noticias:** En `home`, el usuario lee perfiles de médicos (`DOCTORS`), estadísticas (`STATS`) y novedades(`NEWS`), mejorando confianza institucional.
- **Acceso a paneles dedicados:** Usuarios autenticados acceden a `user-panel` para gestionar turnos y a `medic-panel` para revisar agenda (flujo previsto en rutas y layouts).
- **Administración interna (futuro cercano):** Uso de rutas `admin/*` para cargar especialidades, horarios, médicos y usuarios. Los componentes de administración ya existen y pueden conectarse a servicios reales.
- **Casos de excepción:**
  - Usuario intenta solicitar turno sin seleccionar especialidad → mostrar validación y CTA a contacto telefónico.
  - Error de red al enviar formulario → reintentar y ofrecer datos de contacto.
  - Sesión expirada en paneles → redirigir a login y preservar estado previo.

### 4.b Diagrama de clases/arquitectura
- Arquitectura basada en Angular con componentes standalone. Ejemplo de composición en `HomeComponent`:
  - Importa y orquesta `HeroComponent`, `StatsComponent`, `ServicesComponent`, `SpecialtiesComponent`, `ServiceTabsComponent`, `NewsComponent`, `FaqComponent`, `CtaComponent` y `NewsletterComponent`.
  - Datos tipados en `home/data/hospital-data.ts` (interfaces `Department`, `Doctor`, `News`, `FAQ`, `Specialty`, `Stat`, `HeroData`).
- Estructura global sugerida:
  - `core/` para servicios base y configuraciones.
  - `layout/` para header/footer y shell de navegación.
  - `pages/` para vistas (home, turnos, paneles, contacto, autoridades).
  - `shared/` para componentes reutilizables y estilos comunes.
- Patrones y buenas prácticas:
  - Componentes standalone para reducir módulos y facilitar lazy loading.
  - Servicios por dominio (doctor, appointment, department, etc.) centralizando llamadas HTTP y mapeo de modelos.
  - Interfaces tipadas en `services/interfaces` para asegurar consistencia entre datos mock y futuros endpoints.
  - Guards/interceptores en `auth` e `interceptor` para manejo de autenticación y adjuntar tokens.
  - Estilos globales y utilidades compartidas en `layout/styles` y `shared/styles` (si aplica).

### 4.c Requerimientos funcionales (ejemplos)
- RF1: Mostrar hero con call-to-action a turnos y contacto de emergencia.
- RF2: Listar departamentos y especialidades con íconos y descripciones.
- RF3: Visualizar noticias destacadas y estadísticas institucionales.
- RF4: Permitir navegación a guía de turnos y enlace a formulario de solicitud.
- RF5: Acceso a panel de usuario y médico mediante rutas protegidas.
- RF6: Sección de contacto con datos de teléfono, correo y mapa (si se integra).

### 4.d Requerimientos no funcionales
- Rendimiento: Tiempo de carga inicial optimizado por SSR y lazy loading.
- Accesibilidad: Contraste AA, labels asociadas, navegación por teclado.
- Seguridad: Uso de HTTPS en despliegue, sanitización de formularios, protección de rutas con guards.
- Mantenibilidad: Código tipado con interfaces, componentes reutilizables, estructura de carpetas clara.
- Escalabilidad: Separación de dominios en servicios para conectar APIs sin reescribir componentes.

### 4.e Datos de ejemplo y mockups
- Datos semilla en `home/data/hospital-data.ts` para hero, departamentos, doctores, noticias, FAQs y especialidades. Referenciar estas constantes en diagramas.
- Mock de turnos y usuarios puede construirse en `services/appointment` y `services/user` para prototipar.
- Para diseño, usar mockups de secciones hero, stats y formulario de turnos; agregar capturas cuando estén listas.

## 5) ENTREGA Y VALIDACIÓN
### 5.a Manual de usuario (guía rápida)
1. **Inicio:** Ingresar a la landing (`/`) para ver hero, estadísticas y servicios destacados.
2. **Consultar turnos:** Abrir "Nuestros turnos" (`/about-appointments`) para requisitos, horarios y medios de contacto.
3. **Solicitar turno:** Pulsar “Solicitar Turno Online” para ir a `/shifts` y completar el formulario (disponible 24/7).
4. **Panel de usuario:** Tras autenticarse, acceder a `user-panel` para revisar turnos, notificaciones y datos personales.
5. **Panel médico:** Para personal autorizado, ingresar a `medic-panel` y gestionar agenda/consultas.
6. **Contacto y soporte:** Usar los métodos publicados (teléfono 0800-555-4141, correo `turnos.hospital@gmail.com`, ubicación Planta Baja) para dudas o cancelaciones.

- **Notas de accesibilidad:**
  - Todos los botones y links deben tener textos descriptivos; verificar navegación con teclado (Tab/Shift+Tab).
  - Formularios con mensajes de error claros y etiquetas asociadas.
  - Contraste suficiente en textos y fondos, especialmente en hero y CTAs.

- **Preguntas frecuentes para el manual:** Cómo recuperar contraseña (ruta `reset-password`), cómo actualizar datos personales, cómo cancelar un turno y cómo contactar al médico.

### 5.b Video funcional
- Grabar recorrido mostrando: animaciones de entrada, secciones de `home`, navegación a `about-appointments`, solicitud de turno en `/shifts` y vistas de paneles.
- Incluir escena con versión móvil (inspector responsive) para evidenciar adaptabilidad.

### 5.c Presentación visual
- Preparar diapositivas con capturas de hero, estadísticas, servicios, médicos, sección de turnos y paneles. Añadir mockups de flujos críticos.

### 5.d Estrategia de pruebas y validación
- **Pruebas unitarias:** componentes críticos (formularios de turnos, hero, FAQs) con Jasmine/Karma.
- **Pruebas E2E (opcional):** escenarios de solicitud de turno y navegación de paneles.
- **Checklist de QA manual:**
  - Links de navegación funcionan y mantienen estilo activo.
  - Formularios muestran validaciones al enviar vacío.
  - Layout responsive en móviles (menú, hero, cards de servicios).
  - Contenido accesible para lectores de pantalla (atributo `aria` en inputs y botones principales).
- **Métricas de aceptación:** Lighthouse ≥90 en Performance/Accessibility/Best Practices, tasa de errores 0 en consola.

### 5.e Criterios de aceptación
- Contenido de landing visible sin errores y datos maquetados según `hospital-data.ts`.
- CTA de turnos lleva a `/shifts` y permite enviar formulario de ejemplo.
- Rutas de paneles y login accesibles desde navegación principal.
- No se observan warnings críticos en build de producción.

## 6) CIERRE
### 6.a Conclusiones
- El portal unifica información hospitalaria y procesos de turnos, con UX clara y soporte de SSR para mejor rendimiento. La estructura modular de Angular facilita la escalabilidad hacia funcionalidades futuras (historial clínico, pagos en línea, notificaciones, etc.).
- El uso de datos tipados y servicios por dominio reduce deuda técnica y acelera la integración con APIs reales.
- La separación de paneles (usuarios/personal médico) permite añadir roles y permisos sin reestructurar la UI.

### 6.a.i Lecciones aprendidas
- Valorar prototipos tempranos en Figma para alinear expectativas.
- Priorizar accesibilidad desde el diseño inicial evita retrabajos.
- Mantener mocks y servicios desacoplados facilita pruebas sin backend.

### 6.a.ii Trabajo futuro
- Integrar autenticación real (JWT/OAuth), agenda médica conectada a base de datos y pasarela de pagos.
- Añadir notificaciones por correo/SMS y recordatorios de turnos.
- Incorporar módulo de historias clínicas y resultados de laboratorio.

### 6.b Referencias bibliográficas (APA)
- Reservar espacio para citar documentación oficial de Angular, Angular Material, ng-apexcharts, animejs, etc. Formatos sugeridos:
  - Libro → Apellido, N. (Año). *Título*. Editorial.
  - Artículo → Apellido, N. (Año). *Título*. *Revista*, volumen (número), pp–pp.
  - Web → Autor. (Año). *Título*. URL

### 6.c Anexos
- Enlaces al repositorio y branches relevantes.
- Código fuente (estructura del proyecto), diagramas completos y documentación técnica adicional.
- Actas de reunión, capturas de pruebas y reportes de QA.
- Mapas de navegación, diagrama de componentes, backlog priorizado y bitácora de versiones.
