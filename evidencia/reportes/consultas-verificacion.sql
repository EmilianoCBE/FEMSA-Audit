SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(a.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed  FROM dbo.AUDIT a WHERE 1=1

-- audits administrador sin filtros
SELECT a.audit_id AS recordId, a.state AS state FROM dbo.AUDIT a WHERE 1=1 ORDER BY a.audit_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "en_ejecucion"


SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(a.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed  FROM dbo.AUDIT a WHERE 1=1 AND a.state=@state

-- audits administrador por estado
SELECT a.audit_id AS recordId, a.state AS state FROM dbo.AUDIT a WHERE 1=1 AND a.state=@state ORDER BY a.audit_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "en_ejecucion"


SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(a.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed  FROM dbo.AUDIT a WHERE (a.user_id=@userId OR a.user_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId))

-- audits usuario limitado sin filtros
SELECT a.audit_id AS recordId, a.state AS state FROM dbo.AUDIT a WHERE (a.user_id=@userId OR a.user_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId)) ORDER BY a.audit_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "estado_sin_registros"


SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(a.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed  FROM dbo.AUDIT a WHERE (a.user_id=@userId OR a.user_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId)) AND a.state=@state

-- audits usuario limitado por estado
SELECT a.audit_id AS recordId, a.state AS state FROM dbo.AUDIT a WHERE (a.user_id=@userId OR a.user_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId)) AND a.state=@state ORDER BY a.audit_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "estado_sin_registros"


SELECT COUNT(*) AS total FROM dbo.AUDIT a WHERE a.start_date >= '2026-10-01' AND a.start_date < '2026-11-01'

SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(f.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed , SUM(CASE WHEN NOT (LOWER(f.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada')) AND LOWER(f.severity) COLLATE Latin1_General_CI_AI IN ('alta','critica','high','critical') THEN 1 ELSE 0 END) AS high FROM dbo.FINDING f JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE 1=1

-- findings administrador sin filtros
SELECT f.finding_id AS recordId, f.state AS state FROM dbo.FINDING f JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE 1=1 ORDER BY f.finding_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "esperando_plan"


SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(f.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed , SUM(CASE WHEN NOT (LOWER(f.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada')) AND LOWER(f.severity) COLLATE Latin1_General_CI_AI IN ('alta','critica','high','critical') THEN 1 ELSE 0 END) AS high FROM dbo.FINDING f JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE 1=1 AND f.state=@state

-- findings administrador por estado
SELECT f.finding_id AS recordId, f.state AS state FROM dbo.FINDING f JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE 1=1 AND f.state=@state ORDER BY f.finding_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "esperando_plan"


SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(f.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed , SUM(CASE WHEN NOT (LOWER(f.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada')) AND LOWER(f.severity) COLLATE Latin1_General_CI_AI IN ('alta','critica','high','critical') THEN 1 ELSE 0 END) AS high FROM dbo.FINDING f JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE (a.user_id=@userId OR f.responsible_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId))

-- findings usuario limitado sin filtros
SELECT f.finding_id AS recordId, f.state AS state FROM dbo.FINDING f JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE (a.user_id=@userId OR f.responsible_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId)) ORDER BY f.finding_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "estado_sin_registros"


SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(f.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed , SUM(CASE WHEN NOT (LOWER(f.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada')) AND LOWER(f.severity) COLLATE Latin1_General_CI_AI IN ('alta','critica','high','critical') THEN 1 ELSE 0 END) AS high FROM dbo.FINDING f JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE (a.user_id=@userId OR f.responsible_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId)) AND f.state=@state

-- findings usuario limitado por estado
SELECT f.finding_id AS recordId, f.state AS state FROM dbo.FINDING f JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE (a.user_id=@userId OR f.responsible_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId)) AND f.state=@state ORDER BY f.finding_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "estado_sin_registros"


SELECT COUNT(*) AS total FROM dbo.FINDING f JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE f.identified_at >= '2026-10-01' AND f.identified_at < '2026-11-01'

SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(p.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed , SUM(CASE WHEN NOT (LOWER(p.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada')) AND p.concluded_at IS NULL AND p.due_date < @now THEN 1 ELSE 0 END) AS overdue, AVG(CAST(p.progress_pct AS float)) AS averageProgress FROM dbo.REMEDIATION_PLAN p JOIN dbo.FINDING f ON f.finding_id=p.finding_id JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE 1=1

-- plans administrador sin filtros
SELECT p.remediation_plan_id AS recordId, p.state AS state FROM dbo.REMEDIATION_PLAN p JOIN dbo.FINDING f ON f.finding_id=p.finding_id JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE 1=1 ORDER BY p.remediation_plan_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "en_progreso"


SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(p.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed , SUM(CASE WHEN NOT (LOWER(p.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada')) AND p.concluded_at IS NULL AND p.due_date < @now THEN 1 ELSE 0 END) AS overdue, AVG(CAST(p.progress_pct AS float)) AS averageProgress FROM dbo.REMEDIATION_PLAN p JOIN dbo.FINDING f ON f.finding_id=p.finding_id JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE 1=1 AND p.state=@state

-- plans administrador por estado
SELECT p.remediation_plan_id AS recordId, p.state AS state FROM dbo.REMEDIATION_PLAN p JOIN dbo.FINDING f ON f.finding_id=p.finding_id JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE 1=1 AND p.state=@state ORDER BY p.remediation_plan_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "en_progreso"


SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(p.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed , SUM(CASE WHEN NOT (LOWER(p.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada')) AND p.concluded_at IS NULL AND p.due_date < @now THEN 1 ELSE 0 END) AS overdue, AVG(CAST(p.progress_pct AS float)) AS averageProgress FROM dbo.REMEDIATION_PLAN p JOIN dbo.FINDING f ON f.finding_id=p.finding_id JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE (a.user_id=@userId OR p.responsible_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId))

-- plans usuario limitado sin filtros
SELECT p.remediation_plan_id AS recordId, p.state AS state FROM dbo.REMEDIATION_PLAN p JOIN dbo.FINDING f ON f.finding_id=p.finding_id JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE (a.user_id=@userId OR p.responsible_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId)) ORDER BY p.remediation_plan_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "estado_sin_registros"


SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(p.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada') THEN 1 ELSE 0 END) AS closed , SUM(CASE WHEN NOT (LOWER(p.state) IN ('cerrado','cerrada','concluido','concluida','closed','completado','completada')) AND p.concluded_at IS NULL AND p.due_date < @now THEN 1 ELSE 0 END) AS overdue, AVG(CAST(p.progress_pct AS float)) AS averageProgress FROM dbo.REMEDIATION_PLAN p JOIN dbo.FINDING f ON f.finding_id=p.finding_id JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE (a.user_id=@userId OR p.responsible_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId)) AND p.state=@state

-- plans usuario limitado por estado
SELECT p.remediation_plan_id AS recordId, p.state AS state FROM dbo.REMEDIATION_PLAN p JOIN dbo.FINDING f ON f.finding_id=p.finding_id JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE (a.user_id=@userId OR p.responsible_id=@userId OR EXISTS (SELECT 1 FROM dbo.AUDIT_PARTICIPANT ap WHERE ap.audit_id=a.audit_id AND ap.user_id=@userId)) AND p.state=@state ORDER BY p.remediation_plan_id
-- @userId se obtiene de la identidad de prueba y no se guarda en evidencia
-- @state = "estado_sin_registros"


SELECT COUNT(*) AS total FROM dbo.REMEDIATION_PLAN p JOIN dbo.FINDING f ON f.finding_id=p.finding_id JOIN dbo.AUDIT a ON a.audit_id=f.audit_id WHERE p.due_date >= '2026-10-01' AND p.due_date < '2026-11-01'