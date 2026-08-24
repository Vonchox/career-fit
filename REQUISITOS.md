# career-fit — Requisitos del Proyecto

## 1. ¿Qué es este proyecto?

**career-fit** es una plataforma web que permite a estudiantes de la ESPE evaluar
su **elegibilidad para programas de movilidad académica e intercambio
estudiantil**, según su carrera, semestre y promedio académico. El sistema le
indica al estudiante:

- Si califica (o qué tan cerca está de calificar) para movilidad académica
- Qué requisitos específicos cumple y cuáles le faltan
- Qué documentos necesita reunir
- Qué ayudas económicas ofrece la universidad para ese tipo de movilidad

Basado en información pública del **Reglamento de Becas y Ayudas Económicas de
la Universidad de las Fuerzas Armadas ESPE** (Art. 29-30), publicado por la
Unidad de Bienestar Universitario (ube.espe.edu.ec).

> **Nota:** esta herramienta es informativa. No reemplaza el proceso oficial
> ante la Unidad de Bienestar Universitario ni garantiza la aprobación de
> ninguna beca.

---

## 2. Objetivo del sistema

Permitir que un estudiante, en pocos minutos, entienda si es candidato viable
a un programa de movilidad académica, sin tener que leer el reglamento
completo ni acercarse presencialmente a preguntar.

---

## 3. Usuarios del sistema

| Usuario | Descripción | Qué necesita hacer |
|---|---|---|
| Estudiante | Alumno regular de la ESPE | Ingresar sus datos y ver su resultado de elegibilidad |
| (Futuro) Administrador | Encargado de Bienestar Universitario | Actualizar requisitos/tipos de movilidad sin tocar código |

Para la primera versión, **solo se construye el flujo del estudiante**. El
panel de administrador queda fuera de alcance (ver sección 7).

---

## 4. Requisitos funcionales

### RF1 — Formulario de datos del estudiante
El sistema debe permitir ingresar:
- Carrera
- Semestre actual
- Promedio acumulado
- Créditos/horas matriculados actualmente
- Si cuenta con convenio, invitación o reconocimiento a un evento/programa
  (sí/no)
- Si tiene alguna resolución de Consejo de Carrera aprobada para el proyecto
  de movilidad (sí/no)

### RF2 — Motor de evaluación de elegibilidad
El sistema debe comparar los datos ingresados contra las reglas de
elegibilidad para movilidad académica y determinar:
- Si el estudiante es candidato viable
- Un listado de requisitos cumplidos
- Un listado de requisitos pendientes/faltantes

### RF3 — Resultado detallado
El sistema debe mostrar al estudiante:
- Resultado general (candidato viable / no viable todavía / falta información)
- Detalle de cada requisito (cumplido / no cumplido) con una breve explicación
- Documentos que debe reunir para aplicar
- Montos de referencia de ayuda económica (hospedaje, alimentación,
  transporte, seguro, inscripción) según si la movilidad es nacional o
  internacional

### RF4 — Enlaces a formatos oficiales
El sistema debe enlazar directamente a los formatos descargables oficiales
de la ESPE relacionados (solicitud de beca de movilidad, carta de
compromiso, declaración de no tener beca, etc.)

### RF5 — Persistencia (opcional en v1)
El sistema puede guardar las evaluaciones realizadas, para que el estudiante
no tenga que volver a llenar el formulario si regresa.

---

## 5. Requisitos no funcionales

- **Responsive**: debe verse bien en celular, ya que muchos estudiantes lo
  usarán desde el teléfono aunque sea una app web.
- **Rendimiento**: el resultado de la evaluación debe mostrarse en menos de
  2 segundos tras enviar el formulario.
- **Disponibilidad**: desplegado en un servicio gratuito (Render/Vercel),
  aceptando que el backend gratuito puede tardar unos segundos en
  "despertar" tras inactividad.
- **Mantenibilidad**: las reglas de elegibilidad deben vivir en la base de
  datos (no hardcodeadas en el frontend), para poder actualizarlas sin
  redeploy.
- **Accesibilidad de la fuente**: toda regla o requisito mostrado debe poder
  rastrearse al artículo del reglamento del que proviene.

---

## 6. Modelo de datos (alto nivel)

```
Estudiante
 ├─ carrera
 ├─ semestre
 ├─ promedio
 ├─ creditosMatriculados
 ├─ tieneConvenioOInvitacion (bool)
 └─ tieneResolucionConsejoCarrera (bool)

TipoMovilidad
 ├─ nombre (ej. "Movilidad Académica Internacional")
 ├─ descripcion
 ├─ ambito (nacional / internacional)
 └─ requisitos [ ] → relación con Requisito

Requisito
 ├─ nombre
 ├─ descripcion
 ├─ documentoRespaldo
 └─ articuloReglamento (referencia legal)

Evaluacion
 ├─ estudianteId
 ├─ tipoMovilidadId
 ├─ resultado (viable / no viable / incompleto)
 └─ fecha
```

*(Este modelo se irá afinando cuando pasemos a `schema.prisma`.)*

---

## 7. Fuera de alcance (v1)

Para no perder el foco en la primera versión, **no se incluye**:
- Panel de administrador para editar requisitos desde una interfaz
- Autenticación de usuarios (login/registro) — se evalúa sin cuenta
- Otras becas que no sean de movilidad académica (vulnerabilidad,
  discapacidad, deportistas, etc.)
- Versión móvil o de escritorio (se evalúa como fase 2 si el proyecto crece)
- Subida real de documentos (solo se listan cuáles se necesitan)

---

## 8. Criterios de aceptación (para saber cuándo v1 está "lista")

- [ ] Un estudiante puede completar el formulario en menos de 2 minutos
- [ ] El resultado muestra claramente qué cumple y qué le falta
- [ ] Los datos de requisitos y montos corresponden a la información real
  citada del reglamento ESPE
- [ ] La app funciona correctamente en móvil y escritorio (responsive)
- [ ] El proyecto está desplegado y accesible por un link público
- [ ] El README explica claramente qué hace el proyecto y cómo correrlo
  localmente
