# Requisitos actuales de Career-Fit

## Objetivo

Orientar a estudiantes de UCE, Escuela Politécnica Nacional y ESPE desde un panel público, con revisión documental y cuenta opcional.

## Funcionalidad

- Entrada directa al catálogo, sin portada ni registro obligatorio.
- Selector UCE/EPN/ESPE con guías y recursos separados por universidad.
- Revisión documental en dos pasos, sin pedir datos académicos o archivos.
- Resultado de preparación, fuentes consultables, impresión y lista local de documentos.
- Historial de visitante en el navegador, sin escrituras en el servidor.
- Registro y acceso opcionales por correo; Google disponible al configurar el cliente OAuth.
- Historial privado de cuenta y guardado explícito de una revisión de visitante.
- Chat público con guía contextual; Gemini y respaldo para cuentas autenticadas.
- Diseño responsive en móvil y escritorio.

## Límites

Las guías no son convocatorias abiertas ni listas exhaustivas de elegibilidad. Las universidades deciden los requisitos y resultados oficiales. Las reglas anteriores no se reutilizan como si pertenecieran a UCE o EPN; sus registros históricos se conservan.

No se incluyen subida de documentos, administración institucional, instaladores nativos ni despliegue público automático.

## Verificación

El flujo anónimo debe funcionar sin usuario ni token y sin almacenar perfiles personales en la base. Los accesos privados requieren JWT válido, incluso si la aplicación permite visitantes. Google exige verificación en servidor, nonce y vinculación explícita para cuentas existentes.

Fuentes y comandos de ejecución: ver README.md y docs/GOOGLE_SIGN_IN.md.
