# SIIID · Interfaz de demostración

**Angular 21 · TypeScript · Formularios · Estados de carga · Validación y revisión**

Interfaz independiente de portafolio con ocho escenarios para demostrar carga mensual, complementarios BANCI, reclasificación por víctima y conciliación. Todos los registros son ficticios; no incluye imágenes oficiales, nombres de personas, credenciales, destinos de infraestructura ni historial de trabajo.

## Componentes relacionados

| Componente | Función |
|---|---|
| **SIIID2.FrontEnd-Portfolio** | Recorrido guiado, editor JSON, errores, revisión y tablas aprobadas |
| [SIIID.API-Portfolio](https://github.com/gerardomelkart/SIIID.API-Portfolio) | API .NET 10 con reglas y estado en memoria |
| [SIIID2BD-Portfolio](https://github.com/gerardomelkart/SIIID2BD-Portfolio) | Modelo SQL Server de laboratorio, independiente de la demo HTTP |

El Front no decide si una carga es válida: envía la propuesta a la API. Solo después de aprobar se actualizan las tablas del estado aprobado. Rechazar descarta la propuesta.

## Ejecutar

Requiere Node.js 22.12 o superior compatible con Angular 21 y npm. Primero inicia la API siguiendo su README. Desde este repositorio:

```bash
npm ci
npm start
```

Abre `http://127.0.0.1:4200`. El proxy local reenvía `/api` a `http://127.0.0.1:5088`; no contiene conexiones remotas ni secretos.

```bash
npm run build
```

La compilación queda en `dist/portfolio/browser`. Servir solamente los archivos compilados no configura el proxy de API; `npm start` es el recorrido de demostración recomendado.

## Recorrido de cinco minutos

Inicia la API sin datos y elige los escenarios en orden. En los pasos correctos pulsa **Validar y enviar a revisión** y luego **Aprobar propuesta**. Los errores de los pasos 4 y 5 deben mostrarse sin crear propuesta pendiente.

| Paso | Acción | Resultado aprobado o bloqueo esperado |
|---|---|---|
| 1 | Carga mensual | 2 víctimas en una carpeta |
| 2 | Complementar BANCI | 2 desapariciones vigentes |
| 3 | Reclasificar DEMO-V001 | 1 vigente y 1 reclasificada; mensual aún con 2 |
| 4 | Error de contradicción | No permite volver a reportar DEMO-V001 como desaparición |
| 5 | Error de complemento | Exige datos BANCI para la nueva DEMO-V003 |
| 6 | Cruce correcto | Mensual con V002/V003; BANCI conserva V001/V002/V003 |
| 7 | Revertir reclasificación | V001 vuelve a desaparición vigente |
| 8 | Alinear mensual | Las tres víctimas vuelven a coincidir |

También puedes editar el JSON, probar duplicados o rechazar una propuesta. No hay carga manual de personas ni importación de Excel: el editor representa un lote reducido para revisar el contrato. Las claves deben ser ficticias y comenzar por `DEMO-`.

## Diseño y límites

La vista utiliza indicadores, revisión previa, mensajes por operación, histórico BANCI y bitácora. Incluye diseño adaptable, etiquetas para controles, estados de espera y contenido escapado por Angular. No utiliza iconos ni logotipos institucionales.

La API no tiene autenticación; los roles de enlace y administración se representan solo mediante los pasos de envío y revisión. La información se pierde al reiniciar la API. No conectar a datos reales ni publicar la API sin implementar seguridad y persistencia.

El build verifica TypeScript y plantillas con modo estricto. Las reglas se comprueban en el repositorio API. El script `tests/http_smoke.py` de ese repositorio recorre los endpoints; no constituye una prueba automatizada de interacción visual del Front.

No se concede una licencia de reutilización por el solo hecho de ser público. Las dependencias conservan sus licencias.
