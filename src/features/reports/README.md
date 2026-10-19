# Reportes US09

La pantalla esta en /reportes/ejecutivos y pide una sesion como las otras pantallas

El usuario puede elegir columnas e indicadores filtrar los hallazgos revisar la tabla y descargar Excel o PDF

Los filtros se aplican antes de calcular los indicadores y los archivos salen de la misma seleccion

El Excel incluye una hoja con el contexto y otra con los hallazgos
El PDF repite encabezados de tabla y agrega numero de pagina

## Fuente de datos

Por ahora usamos findingsService de la bandeja que devuelve datos de ejemplo
El aviso tambien se incluye en los archivos

Cuando exista una API con hallazgos reales cambiar reportService y el aviso de la fuente
La API debe validar la sesion y devolver solo los registros que el usuario pueda consultar
No quitar el aviso hasta tener esa integracion

No agregamos filtros de fecha ni fuentes de riesgos auditorias o planes porque todavia no tienen los datos necesarios para este reporte

## Indicadores

- Total de hallazgos filtrados
- Hallazgos abiertos con estado diferente a cerrado
- Abiertos de severidad alta
- Porcentaje de cierre igual a cerrados entre total por 100

## Pruebas

npm test
npm run build
npm run preview
npm run test:e2e -- --spec cypress/e2e/reports.cy.ts

Los comentarios y cambios del modulo estan separados de Designer Usuarios y Riesgos
Los puntos compartidos son el registro de ruta el enlace del menu y las dependencias para generar los archivos
