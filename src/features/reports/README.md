# Reportes US09

La pantalla esta en /reportes/ejecutivos y requiere sesion

El modulo consulta GET /api/reports en FEMSA-Audit-Backend
No usa findingsService ni datos de ejemplo
Si la API o SQL fallan se muestra el error y no se permite exportar datos anteriores

## Contenido

- Auditorias desde AUDIT con BUSINESS_UNIT y USER
- Hallazgos desde FINDING con AUDIT BUSINESS_UNIT y USER
- Planes desde REMEDIATION_PLAN con FINDING AUDIT BUSINESS_UNIT USER y la fecha mas reciente de PLAN_PROGRESS

El usuario selecciona columnas e indicadores
Los filtros de unidad estado y severidad o prioridad son por valor completo
La busqueda es por folio descripcion o nombre de auditoria
Las fechas filtran inicio de auditoria identificacion del hallazgo o compromiso del plan
El ultimo dia se incluye completo
Hay que aplicar los filtros antes de descargar

## Acceso

La API resuelve el usuario de negocio desde AuthUsers y la sesion existente
Administrador con role_id 2 y Administrador Funcional con code admin pueden consultar todo
Los demas usuarios solo consultan auditorias a su cargo donde participan o registros de los que son responsables
ROLE_PERMISSION y PERMISSION estan vacias en la base revisada
Por eso usamos este alcance conservador propio de reportes sin cambiar las reglas de otros modulos
Si el equipo define permisos de reportes se debe ajustar esta regla
No se exportan contraseñas tokens correos ni ids de autenticacion

## Indicadores

Total y abiertos se cuentan sobre los registros filtrados
Porcentaje de cierre es cerrados entre total por 100
Se consideran cerrados los estados cerrado cerrada concluido concluida closed completado y completada
Los demas estados cuentan como abiertos
Hallazgos altos o criticos solo cuentan si siguen abiertos
Planes vencidos son los que no estan cerrados no tienen fecha de conclusion y su compromiso es anterior a la consulta
Avance promedio usa progress_pct actual del plan y omite valores sin dato
El historial no multiplica los registros porque se consulta MAX de la fecha de avance

## Archivos

Excel tiene una hoja Reporte con contexto y otra Detalle con las columnas seleccionadas
Las fechas se guardan como fechas y los importes como numeros
PDF repite encabezados y pagina tablas largas
Ambos incluyen fuente fecha de consulta fecha de generacion filtros y alcance
Los datos se exportan desde la misma respuesta usada en la vista previa
La consulta se limita a 10000 registros y pide reducir filtros si se supera sin exportar resultados parciales

## Pruebas y evidencia

Consultar evidencia/reportes/README.md para casos resultados archivos y limites de las comprobaciones
La prueba reports-db-evidence requiere generar antes datos-exportacion.json con el script de backend
No se ejecuta en CI porque requiere evidencia local de Azure
