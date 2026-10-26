# Casos de prueba

| Caso | Que se probo | Resultado esperado | Evidencia |
| --- | --- | --- | --- |
| REP-01 | Tipos fechas y filtros invalidos | API rechaza con 400 | pruebas-backend.txt |
| REP-02 | Texto con SQL en busqueda | Se trata como valor y no altera SQL | pruebas-backend.txt y comparacion-bd.json |
| REP-03 | Usuario sin identidad de negocio | Acceso rechazado con 403 | pruebas-backend.txt |
| REP-04 | Datos fechas importes y alcance | Valores correctos sin datos de autenticacion | pruebas-backend.txt |
| REP-05 | Cierres avance promedio y vencidos | Indicadores calculados sin division entre cero | pruebas-backend.txt |
| REP-06 | Fallo de BD | Error sin datos de ejemplo | pruebas-backend.txt |
| REP-07 | Mas de 10000 registros | Error 422 sin resultados parciales | pruebas-backend.txt |
| REP-08 | Peticion HTTP sin sesion | 401 | pruebas-backend.txt |
| REP-09 | Sesion sin identidad permitida | 403 | pruebas-backend.txt |
| REP-10 | Columnas e indicadores seleccionados | Exportar solo la seleccion | pruebas-frontend.txt |
| REP-11 | Filtros y valores vacios | Conservar filtros y mostrar Sin dato | pruebas-frontend.txt |
| REP-12 | Excel con numeros fechas y texto formula | Tipos correctos y texto sin ejecutarse | pruebas-frontend.txt |
| REP-13 | PDF con 100 registros y textos largos | Varias paginas y ultimo registro presente | pruebas-frontend.txt |
| REP-14 | Cambiar y aplicar filtros | Consultar API y bloquear descarga pendiente | capturas/REP-14-filtros-api.png |
| REP-15 | Descargar los tres tipos | Excel y PDF generados | pruebas-navegador.txt |
| REP-16 | Sin columnas o sin resultados | Descargas deshabilitadas y aviso | capturas/REP-16-sin-columnas.png y capturas/REP-16-sin-resultados.png |
| REP-17 | API no disponible | Mostrar error y no dejar exportar | capturas/REP-17-error-bd.png |
| REP-18 | Pantalla movil y nombre del reporte | Controles visibles y autorrelleno desactivado | capturas/REP-18-movil.png |
| REP-19 | Respuestas guardadas de SQL | Exportaciones coinciden con registros verificados | archivos y verificacion-excel.json y verificacion-pdf.json |
| REP-20 | Peticion HTTP autorizada | Respuesta 200 sin cache y parametros separados del SQL | pruebas-backend.txt |
| REP-21 | Cambiar userId u origen ajeno | Rechazar 400 o 403 | pruebas-backend.txt |
| BD-01 | Administrador sin filtros por cada tipo | Mismos ids totales e indicadores que SQL | comparacion-bd.json |
| BD-02 | Usuario limitado | Solo registros permitidos por el alcance | comparacion-bd.json |
| BD-03 | Filtro por estado | Mismos registros que SQL | comparacion-bd.json |
| BD-04 | Periodo octubre 2026 | Incluir todo el ultimo dia | comparacion-bd.json |
| BD-05 | Relacion de planes y avances | Ningun plan duplicado | comparacion-bd.json |
