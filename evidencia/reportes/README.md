# Evidencia de testing de Reportes US09

Fecha de trabajo 25 de octubre de 2026 America Monterrey
Los archivos JSON guardan las horas en UTC por eso algunas fechas aparecen como 26 de octubre

## Resultado

- Build de frontend aprobado
- 42 pruebas de frontend aprobadas
- 84 pruebas de backend aprobadas
- 7 pruebas de navegador con respuestas controladas aprobadas
- 3 pruebas de navegador con respuestas guardadas de SQL aprobadas
- 18 comparaciones de consultas y filtros contra E12_FEMSA aprobadas
- 3 archivos Excel y 3 PDF comparados con las respuestas de SQL

## Que se comprobo con la base real

El script del backend llamo getReport con identidades ya existentes y el repositorio real de SQL
Comparo sus resultados con SELECT independientes usando las mismas condiciones
No creo usuarios ni sesiones ni inserto actualizo o borro datos

La comparacion administradora encontro 11 auditorias 14 hallazgos y 8 planes
Tambien se compararon estados periodo de octubre indicadores y ausencia de duplicados
La identidad limitada disponible no tenia registros asignados y recibio cero registros
Esto comprueba la exclusion para esa identidad pero no una sesion de usuario limitado con registros propios en el navegador

Los registros estan almacenados en E12_FEMSA
No se certifico si fueron capturados para operacion o sembrados como pruebas por el equipo

## Diferencia entre los tipos de prueba

Las pruebas unitarias y HTTP usan datos controlados sin Azure
Las capturas REP-14 a REP-18 usan respuestas controladas y sesion simulada
Las capturas REP-19 usan respuestas obtenidas del servicio real y guardadas sin nombres para poder reproducir las exportaciones
En REP-19 se simula la entrega HTTP y la sesion del navegador
La conexion real con SQL se comprueba por separado con el script del backend
No se realizo un inicio de sesion real desde el navegador conectado a Azure

Los Excel y PDF bd-audits bd-findings y bd-plans salen de las respuestas verificadas de SQL con una seleccion de columnas sin nombres de personas
La pantalla normal usa la API real y no carga estos archivos de evidencia

## Archivos para revisar

- [Comparacion contra SQL](comparacion-bd.json)
- [Consultas de verificacion](consultas-verificacion.sql)
- [Resultados backend](pruebas-backend.txt)
- [Resultados frontend](pruebas-frontend.txt)
- [Resultados navegador controlado](pruebas-navegador.txt)
- [Resultados navegador con respuestas de SQL](pruebas-navegador-bd.txt)
- [Build](build.txt)
- [Revision de todas las celdas Excel](verificacion-excel.json)
- [Revision del contenido PDF](verificacion-pdf.json)
- [Excel auditorias](archivos/bd-audits.xlsx)
- [PDF auditorias](archivos/bd-audits.pdf)
- [Excel hallazgos](archivos/bd-findings.xlsx)
- [PDF hallazgos](archivos/bd-findings.pdf)
- [Excel planes](archivos/bd-plans.xlsx)
- [PDF planes](archivos/bd-plans.pdf)
- [Vista PDF auditorias](pdf-audits-pagina-1.png)
- [Vista PDF hallazgos](pdf-findings-pagina-1.png)
- [Vista PDF planes](pdf-plans-pagina-1.png)
- [Capturas](capturas)
- [Casos de prueba](casos-de-prueba.md)

## Como repetir

En FEMSA-Audit-Backend con su archivo de entorno configurado

```bash
npm ci
node --test tests/*.test.js
node scripts/check-reports-db.js ../FEMSA-Audit/evidencia/reportes
```

En FEMSA-Audit

```bash
npm run build
npm test
npm run preview
```

Con preview abierto en otra terminal

```bash
npm run test:e2e -- --spec cypress/e2e/reports.cy.ts
npm run test:e2e -- --config 'specPattern=cypress/evidence/*.cy.ts'
node scripts/check-report-files.mjs
```

La prueba de evidencia esta fuera de cypress/e2e para no depender de Azure ni crear archivos en las pruebas normales de CI
La prueba opcional necesita datos-exportacion.json generado por el script del backend

## Limites y reglas de acceso

El catalogo PERMISSION y ROLE_PERMISSION estaba vacio durante la revision
Para este modulo Administrador role_id 2 y Administrador Funcional code admin pueden consultar todo
Los demas usuarios se limitan a auditorias propias donde participan o registros a su cargo
La regla esta descrita en src/features/reports/README.md y se debera ajustar si el equipo define una politica distinta
La regla no cambia los permisos de los demas modulos

No se altero la estructura ni los datos de la base
