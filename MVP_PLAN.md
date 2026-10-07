# MVP PLAN
## Sistema Inteligente de Atención y Conversión de Leads
### Juegos del Siglo XXI — Primera Implementación

**Versión:** 1.0  
**Fecha:** Octubre 2025  
**Stack:** Node.js + PostgreSQL + OpenAI GPT-4o + React  
**Deploy:** Railway  
**Canal inicial:** Widget embebido en juegosdelsigloxxi.com.ar

---

## 1. RESUMEN EJECUTIVO

El sistema es un motor de conversación con IA que:
1. Se embebe como widget en el sitio web del cliente
2. Responde consultas automáticamente usando la Knowledge Base
3. Califica leads con un sistema de scoring
4. Detecta intención de compra
5. Deriva al vendedor cuando corresponde
6. Hace seguimiento automático de leads sin respuesta
7. Muestra todo en un dashboard

**Métrica principal de éxito:**
> "Cuántas oportunidades comerciales que antes se perdían ahora llegan a un vendedor."

---

## 2. DECISIONES TÉCNICAS

| Decisión | Elección | Motivo |
|---|---|---|
| Lenguaje backend | Node.js (TypeScript) | Ecosistema maduro, async por defecto, ideal para chat en tiempo real |
| Framework backend | Express.js | Simple, sin magia, fácil de mantener |
| Base de datos | PostgreSQL | Relacional, robusto, gratuito en Railway |
| ORM | Prisma | Migrations automáticas, typesafe, excelente DX |
| IA | OpenAI GPT-4o | Mejor manejo de español, bajo costo, API estable |
| Frontend dashboard | React + Vite | Rápido, moderno, componentes reutilizables |
| UI Components | Tailwind CSS + shadcn/ui | Sin diseñador, componentes listos, profesional |
| Widget de chat | Vanilla JS (sin framework) | Se embebe en cualquier página sin conflictos |
| Tiempo real | Socket.io | Mensajes en tiempo real entre widget y dashboard |
| Autenticación | JWT + bcrypt | Simple, seguro, sin dependencias externas |
| Jobs / Cron | node-cron | Seguimientos automáticos programados |
| Deploy | Railway | Un click, PostgreSQL incluido, ~$5/mes |
| Repositorio | GitHub | Integración directa con Railway |
| Variables de entorno | .env (nunca en el repo) | Seguridad básica |

---

## 3. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                 │
│  Widget Web    WhatsApp (futuro)    Instagram (futuro)           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    CHANNEL ADAPTER LAYER                         │
│   WebChatAdapter   WhatsAppAdapter*   InstagramAdapter*          │
│   (* = interfaz definida, implementación futura)                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                  CONVERSATION ENGINE                             │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  AI Engine  │  │ Lead Manager │  │  Intent Detector       │  │
│  │  (GPT-4o)   │  │  (scoring)   │  │  (clasificación)       │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘  │
│         │                │                       │               │
│  ┌──────▼──────────────────────────────────────────────────────┐ │
│  │              KNOWLEDGE BASE ENGINE                          │ │
│  │  (lee BUSINESS_KNOWLEDGE.md + tabla productos en DB)        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    CORE SERVICES                                  │
│                                                                  │
│  FollowUpEngine    HumanHandoff    NotificationService           │
│  (cron jobs)       (alertas)       (email/webhook futuro)        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    DATA LAYER                                     │
│                                                                  │
│  PostgreSQL (via Prisma)                                         │
│  Tenants │ Leads │ Conversations │ Messages │ Products │ Users   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                    INTERFACES                                     │
│                                                                  │
│  Dashboard Admin (React)    API REST    Widget (Vanilla JS)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. ESTRUCTURA DE CARPETAS

```
crm-leads/
│
├── backend/
│   ├── src/
│   │   ├── channels/           # Adaptadores por canal
│   │   │   ├── web-chat.ts     # Widget web (MVP)
│   │   │   ├── whatsapp.ts     # Interfaz (implementación futura)
│   │   │   └── instagram.ts    # Interfaz (implementación futura)
│   │   │
│   │   ├── conversation/       # Motor de conversación
│   │   │   ├── engine.ts       # Orquestador principal
│   │   │   ├── ai-engine.ts    # Integración con OpenAI
│   │   │   ├── intent.ts       # Detección de intención
│   │   │   └── prompts.ts      # System prompts del bot
│   │   │
│   │   ├── knowledge/          # Base de conocimiento
│   │   │   ├── loader.ts       # Lee la KB desde DB + archivos
│   │   │   └── kb.service.ts   # Servicio de consultas a la KB
│   │   │
│   │   ├── leads/              # Gestión de leads
│   │   │   ├── lead.service.ts # CRUD de leads
│   │   │   ├── scoring.ts      # Motor de scoring
│   │   │   └── classifier.ts   # Clasificación frío/tibio/caliente
│   │   │
│   │   ├── followup/           # Seguimiento automático
│   │   │   ├── engine.ts       # Orquestador de seguimientos
│   │   │   └── scheduler.ts    # Cron jobs
│   │   │
│   │   ├── handoff/            # Derivación a humano
│   │   │   ├── handoff.service.ts
│   │   │   └── notification.ts # Alertas al vendedor
│   │   │
│   │   ├── analytics/          # Métricas
│   │   │   └── analytics.service.ts
│   │   │
│   │   ├── api/                # API REST
│   │   │   ├── routes/
│   │   │   │   ├── chat.ts
│   │   │   │   ├── leads.ts
│   │   │   │   ├── conversations.ts
│   │   │   │   ├── analytics.ts
│   │   │   │   ├── products.ts
│   │   │   │   └── auth.ts
│   │   │   └── middlewares/
│   │   │       ├── auth.ts
│   │   │       └── tenant.ts
│   │   │
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Esquema de base de datos
│   │   │
│   │   └── index.ts            # Entry point
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Vista principal
│   │   │   ├── Leads.tsx           # Lista de leads
│   │   │   ├── Conversations.tsx   # Conversaciones
│   │   │   ├── Analytics.tsx       # Métricas
│   │   │   ├── Products.tsx        # Gestión de productos
│   │   │   ├── Settings.tsx        # Configuración
│   │   │   └── Login.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── LeadCard.tsx
│   │   │   ├── ConversationView.tsx
│   │   │   ├── ScoreBadge.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── MetricsFunnel.tsx
│   │   │
│   │   └── main.tsx
│   │
│   └── package.json
│
├── widget/
│   ├── src/
│   │   ├── widget.ts           # Widget embebible (Vanilla TS → compila a JS)
│   │   └── styles.css
│   └── package.json
│
├── knowledge/
│   ├── juegosdelsigloxxi/
│   │   ├── BUSINESS_KNOWLEDGE.md    # ← ya creado
│   │   └── products.json            # Catálogo en formato JSON para la API
│   └── template/
│       └── BUSINESS_KNOWLEDGE.md   # Template para nuevos clientes
│
├── BUSINESS_KNOWLEDGE.md       # ← ya creado
├── CONVERSATION_FLOWS.md       # ← ya creado
├── MVP_PLAN.md                 # ← este documento
└── README.md
```

---

## 5. MODELO DE DATOS (Prisma Schema)

```prisma
// Multiempresa
model Tenant {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  config      Json     // personalidad, scoring, seguimientos
  createdAt   DateTime @default(now())
  leads       Lead[]
  users       User[]
  products    Product[]
}

// Usuarios del sistema (vendedores y admins)
model User {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  email     String
  password  String
  name      String
  role      Role     @default(SELLER)
  createdAt DateTime @default(now())
}

enum Role {
  ADMIN
  SELLER
}

// Leads (potenciales clientes)
model Lead {
  id            String         @id @default(cuid())
  tenantId      String
  tenant        Tenant         @relation(fields: [tenantId], references: [id])
  name          String?
  phone         String?
  city          String?
  province      String?
  channel       String         // "web", "whatsapp", "instagram"
  score         Int            @default(0)
  temperature   Temperature    @default(COLD)
  status        LeadStatus     @default(NEW)
  intention     String?        // intención detectada
  product       String?        // producto de interés
  use           String?        // "particular", "commercial", "institutional"
  notes         String?
  assignedTo    String?        // userId del vendedor asignado
  isRecovered   Boolean        @default(false) // métrica "ventas recuperadas"
  firstResponseAt DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  conversations Conversation[]
  followUps     FollowUp[]
}

enum Temperature {
  COLD
  WARM
  HOT
}

enum LeadStatus {
  NEW
  IN_PROGRESS
  WAITING_HUMAN
  ASSIGNED
  FOLLOWUP
  CONVERTED
  LOST
  CLOSED
}

// Conversaciones
model Conversation {
  id        String    @id @default(cuid())
  leadId    String
  lead      Lead      @relation(fields: [leadId], references: [id])
  channel   String
  summary   String?   // resumen generado por IA al derivar
  createdAt DateTime  @default(now())
  messages  Message[]
}

// Mensajes individuales
model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  role           MessageRole  // "user" o "assistant"
  content        String
  intentDetected String?
  scoreChange    Int?         // cuántos puntos sumó este mensaje
  createdAt      DateTime     @default(now())
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// Productos (Knowledge Base en DB)
model Product {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  code        String
  name        String
  category    String
  subcategory String?
  description String?
  dimensions  String?
  materials   String?
  use         String?  // "particular", "commercial", "institutional", "all"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Seguimientos automáticos
model FollowUp {
  id          String         @id @default(cuid())
  leadId      String
  lead        Lead           @relation(fields: [leadId], references: [id])
  scheduledAt DateTime
  sentAt      DateTime?
  message     String
  status      FollowUpStatus @default(PENDING)
  attempt     Int            @default(1) // 1, 2 o 3
}

enum FollowUpStatus {
  PENDING
  SENT
  CANCELLED
}
```

---

## 6. SYSTEM PROMPT DEL BOT

El prompt base que se envía a OpenAI en cada conversación:

```
Sos un asistente comercial de Juegos del Siglo XXI, empresa argentina 
fabricante de juegos infantiles y peloteros con 30 años de trayectoria.

Tu objetivo es ayudar a los clientes a encontrar el producto que necesitan 
y avanzar hacia un presupuesto o contacto con el equipo de ventas.

REGLAS CRÍTICAS:
1. NUNCA inventes precios, plazos, stock ni condiciones comerciales.
2. Si no tenés la información en la Knowledge Base, decí: 
   "Para confirmarte ese dato necesito que lo revise alguien del equipo."
3. Hacé UNA sola pregunta a la vez.
4. Hablá como un vendedor argentino: cálido, directo, natural.
5. Mensajes cortos (máximo 3-4 líneas).
6. Usá emojis con moderación (máximo 1-2 por mensaje, no en todos).
7. NUNCA digas que sos una IA, a menos que el cliente lo pregunte.
8. Tu objetivo es avanzar: consulta → necesidad → producto → presupuesto → vendedor.

INFORMACIÓN DE LA EMPRESA:
{knowledge_base}

HISTORIAL DE CONVERSACIÓN:
{conversation_history}

DATOS DEL LEAD HASTA AHORA:
{lead_data}
```

---

## 7. ORDEN DE IMPLEMENTACIÓN (Sprints)

### SPRINT 0 — Fundamentos (2–3 días)
**Objetivo:** Proyecto corriendo localmente, base de datos lista.

- [ ] Inicializar monorepo (backend + frontend + widget)
- [ ] Configurar TypeScript en los tres proyectos
- [ ] Configurar Prisma + PostgreSQL local
- [ ] Ejecutar migraciones (crear todas las tablas)
- [ ] Cargar datos iniciales: tenant Juegos del Siglo XXI + productos del catálogo
- [ ] Configurar variables de entorno (.env)
- [ ] Probar conexión a OpenAI

**Criterio de éxito:** `npm run dev` levanta sin errores, las tablas existen en la DB.

---

### SPRINT 1 — Motor de chat (3–4 días)
**Objetivo:** El bot responde mensajes usando la Knowledge Base.

- [ ] Endpoint `POST /api/chat/message`
- [ ] Integración con OpenAI GPT-4o
- [ ] Loader de Knowledge Base (lee BUSINESS_KNOWLEDGE.md + productos de DB)
- [ ] System prompt con contexto inyectado
- [ ] Guardado de conversaciones y mensajes en DB
- [ ] Creación automática de lead en el primer mensaje
- [ ] Detección básica de intención (clasificar el mensaje)
- [ ] Test manual: enviar mensajes y ver respuestas correctas

**Criterio de éxito:** Puedo enviar "Hola, cuánto sale un pelotero?" via Postman y recibir una respuesta coherente que NO inventa precios.

---

### SPRINT 2 — Lead scoring y calificación (2–3 días)
**Objetivo:** El sistema puntúa cada conversación automáticamente.

- [ ] Motor de scoring (tabla de puntos por acción)
- [ ] Actualización de score en cada mensaje
- [ ] Clasificación automática: frío / tibio / caliente
- [ ] Extracción de datos del lead desde la conversación (nombre, ciudad, producto)
- [ ] Detección de urgencia (fecha límite)
- [ ] Test: conversación que sube de frío a caliente

**Criterio de éxito:** Una conversación que incluye "Lo necesito para diciembre con envío a Quilmes" clasifica como lead caliente.

---

### SPRINT 3 — Derivación a humano (2 días)
**Objetivo:** Cuando corresponde, el sistema deriva y notifica al vendedor.

- [ ] Detección automática de trigger de derivación (score ≥ 71, reclamo, pide hablar con persona, etc.)
- [ ] Generación de resumen de conversación por IA
- [ ] Cambio de estado del lead a WAITING_HUMAN
- [ ] Notificación al vendedor (por ahora: log en consola + registro en DB)
- [ ] Endpoint `GET /api/leads/:id/summary` para el vendedor
- [ ] Test: lead caliente → se genera resumen → estado cambia

**Criterio de éxito:** Un lead caliente dispara la derivación, genera un resumen legible y el estado cambia correctamente.

---

### SPRINT 4 — Widget embebible (3–4 días)
**Objetivo:** El chat funciona en cualquier página web con un script de una línea.

- [ ] Widget en Vanilla TypeScript (compilado a JS)
- [ ] Botón flotante (💬) en esquina inferior derecha
- [ ] Panel de chat con historial de mensajes
- [ ] Conexión en tiempo real con Socket.io
- [ ] Identificación del visitante (session ID anónimo)
- [ ] Diseño responsive y accesible
- [ ] Snippet de instalación: `<script src="..." data-tenant="..."></script>`
- [ ] Test: insertar el script en una página HTML en blanco y chatear

**Criterio de éxito:** Puedo abrir una página HTML con el script, chatear con el bot y ver la conversación en la DB.

---

### SPRINT 5 — Seguimiento automático (2 días)
**Objetivo:** El sistema hace seguimiento de leads que no responden.

- [ ] Cron job que se ejecuta cada hora
- [ ] Detectar leads TIBIOS o CALIENTES sin actividad en X horas
- [ ] Programar y enviar mensajes de seguimiento (hasta 3)
- [ ] Respetar horarios configurables (no molestar de noche)
- [ ] Cancelar seguimiento si el cliente responde
- [ ] Test: simular un lead que no responde y verificar los 3 seguimientos

**Criterio de éxito:** Un lead tibio sin respuesta recibe los 3 mensajes de seguimiento en los tiempos configurados y luego queda en estado CLOSED.

---

### SPRINT 6 — Dashboard básico (4–5 días)
**Objetivo:** El vendedor/admin puede ver todo desde una pantalla.

- [ ] Login con JWT
- [ ] Vista principal: métricas clave (leads nuevos, calientes, derivados)
- [ ] Lista de leads con filtros (temperatura, estado, fecha)
- [ ] Vista de conversación individual
- [ ] Indicador de score por lead
- [ ] Funnel: leads → oportunidades → presupuestos → ventas
- [ ] Métrica "ventas recuperadas"
- [ ] Vista de seguimientos pendientes
- [ ] Marcado manual: "vendido" / "perdido"

**Criterio de éxito:** El administrador puede ver la lista de leads, abrir una conversación, ver el score y marcar un lead como vendido.

---

### SPRINT 7 — Panel de administración (3–4 días)
**Objetivo:** El dueño puede gestionar productos y configuración sin tocar código.

- [ ] ABM de productos (agregar, editar, desactivar)
- [ ] Editor de preguntas frecuentes
- [ ] Configuración de mensajes de seguimiento
- [ ] Configuración de horarios de atención
- [ ] Asignación de leads a vendedores
- [ ] Vista de métricas avanzadas

**Criterio de éxito:** Tu suegro puede agregar un producto nuevo desde el panel sin ayuda técnica.

---

### SPRINT 8 — Pulido, deploy y demo (2–3 días)
**Objetivo:** El sistema está en producción y se puede demostrar.

- [ ] Deploy en Railway (backend + frontend + PostgreSQL)
- [ ] Configurar dominio o subdominio
- [ ] Variables de entorno en Railway
- [ ] Snippet de widget para el sitio de Juegos del Siglo XXI
- [ ] Test de integración completo (todos los escenarios del PRD)
- [ ] README de instalación y uso
- [ ] Demo grabada de los 5 escenarios del PRD

**Criterio de éxito:** Puedo compartir una URL donde el sistema funciona completo y demostrar los 5 escenarios del documento de requerimientos.

---

## 8. ESTIMACIÓN DE TIEMPO TOTAL

| Sprint | Descripción | Días estimados |
|---|---|---|
| Sprint 0 | Fundamentos | 2–3 |
| Sprint 1 | Motor de chat | 3–4 |
| Sprint 2 | Lead scoring | 2–3 |
| Sprint 3 | Derivación a humano | 2 |
| Sprint 4 | Widget embebible | 3–4 |
| Sprint 5 | Seguimiento automático | 2 |
| Sprint 6 | Dashboard básico | 4–5 |
| Sprint 7 | Panel de administración | 3–4 |
| Sprint 8 | Deploy y demo | 2–3 |
| **TOTAL** | | **23–31 días hábiles** |

Con Kiro haciendo la mayor parte del código, el tiempo real se reduce significativamente. La estimación asume iteraciones, correcciones y pruebas.

---

## 9. INTEGRACIONES FUTURAS (POST-MVP)

Estas interfaces se definen en el MVP pero no se implementan:

| Integración | Descripción | Prioridad |
|---|---|---|
| WhatsApp Business API | Canal principal de atención en Argentina | Alta |
| Instagram DM | Respuesta automática desde Instagram | Alta |
| Facebook Messenger | Leads desde Meta Ads | Media |
| Email | Notificaciones al vendedor | Media |
| Google Sheets | Export de leads para el dueño | Media |
| CRM externo (HubSpot, etc.) | Sync de leads | Baja |
| Meta Lead Forms | Captura de leads de campañas | Media |
| Google Ads Lead Forms | Captura de leads de Google | Baja |

---

## 10. COSTOS ESTIMADOS EN PRODUCCIÓN

| Servicio | Plan | Costo estimado/mes |
|---|---|---|
| Railway (backend + DB) | Starter | ~$5 USD |
| OpenAI GPT-4o | Pay per use | ~$5–20 USD (depende del volumen) |
| **TOTAL** | | **~$10–25 USD/mes** |

**Estimación de costo por conversación con GPT-4o:**
- Conversación promedio: ~2.000 tokens
- Costo GPT-4o: ~$0.005 por conversación
- 500 conversaciones/mes: ~$2.5 USD

El costo es prácticamente despreciable para un negocio que genera ventas de productos de alto valor.

---

## 11. MÉTRICAS A IMPLEMENTAR

### Dashboard principal
- Leads recibidos (total, hoy, esta semana, este mes)
- Leads nuevos sin atender
- Leads calientes (score > 70)
- Leads tibios (score 31–70)
- Leads fríos (score 0–30)
- Leads derivados a vendedor
- Leads en seguimiento
- Leads convertidos (ventas)
- Leads perdidos/cerrados

### Métricas de conversión
- Tasa de conversión: leads → oportunidades
- Tasa de conversión: oportunidades → ventas
- Tiempo promedio de primera respuesta (siempre 0 con el bot 😊)
- Tiempo promedio de calificación
- Score promedio de leads

### Métricas de análisis
- Intenciones más frecuentes (qué preguntan más)
- Productos más consultados
- Ciudades con más leads
- Horarios de mayor actividad
- Tasa de seguimiento exitoso

### Métrica estrella: "Ventas Recuperadas"
Un lead cuenta como "venta recuperada" si:
1. Llegó fuera del horario de atención O no fue atendido en 5 minutos
2. El bot respondió automáticamente
3. El lead continuó la conversación (al menos 2 mensajes más)
4. El lead llegó a estado WAITING_HUMAN, ASSIGNED o CONVERTED

**Frase para mostrar al cliente:**
> "Este mes el sistema atendió X consultas que podrían haberse perdido, de las cuales Y llegaron a un vendedor."

---

## 12. CONFIGURACIÓN POR TENANT (Multi-empresa)

Cada empresa puede configurar en su objeto `config` de la tabla `Tenant`:

```json
{
  "name": "Juegos del Siglo XXI",
  "personality": {
    "tone": "warm-professional",
    "language": "es-AR",
    "botName": "Asistente",
    "useEmojis": true
  },
  "scoring": {
    "hotThreshold": 71,
    "warmThreshold": 31,
    "weights": {
      "askedPrice": 10,
      "selectedProduct": 10,
      "commercialUse": 15,
      "askedShipping": 10,
      "providedDate": 15,
      "requestedQuote": 20,
      "wantsToBuy": 25,
      "providedName": 5,
      "providedPhone": 10,
      "providedCity": 5
    }
  },
  "followUp": {
    "enabled": true,
    "minScore": 31,
    "delays": [240, 1440, 2880],
    "maxAttempts": 3,
    "businessHours": {
      "start": "09:00",
      "end": "20:00",
      "timezone": "America/Argentina/Buenos_Aires"
    }
  },
  "handoff": {
    "hotThreshold": 71,
    "notifyPhone": "...",
    "notifyEmail": "..."
  }
}
```

---

## 13. CHECKLIST PREVIO AL INICIO DE DESARROLLO

- [ ] Confirmar API key de OpenAI (el cliente la tiene)
- [ ] Crear cuenta en Railway
- [ ] Crear repositorio en GitHub
- [ ] Confirmar número de WhatsApp del equipo comercial para notificaciones
- [ ] Confirmar email de contacto comercial
- [ ] Confirmar horarios de atención del negocio
- [ ] Completar los datos pendientes en BUSINESS_KNOWLEDGE.md
- [ ] Definir usuario y contraseña inicial del dashboard
- [ ] Confirmar si hay algún producto con precio publicable (rango orientativo)

---

## 14. CRITERIOS DE ÉXITO DEL MVP

El MVP se considera exitoso cuando:

1. ✅ Un visitante puede iniciar una conversación desde el widget del sitio
2. ✅ El bot responde en menos de 3 segundos
3. ✅ El bot NUNCA inventa precios ni condiciones
4. ✅ Un lead que pregunta por precio, menciona uso comercial y da su ciudad es clasificado como TIBIO o CALIENTE
5. ✅ Un lead con score ≥ 71 es derivado automáticamente
6. ✅ El vendedor recibe el resumen del lead con todos los datos
7. ✅ Un lead que no responde recibe 3 seguimientos automáticos
8. ✅ El dashboard muestra en tiempo real los leads nuevos
9. ✅ El administrador puede agregar un producto desde el panel
10. ✅ Los 5 escenarios del PRD funcionan correctamente

---

*Documento de planificación técnica del MVP.*  
*Actualizar al inicio de cada sprint con los avances y decisiones tomadas.*
