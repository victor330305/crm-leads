/**
 * CRM Chat Widget
 * Se embebe en cualquier página con una sola línea:
 * <script src="crm-widget.iife.js" data-tenant="TENANT_ID" data-api="https://tu-backend.com"></script>
 */

// ─── Configuración ────────────────────────────────────────────────────────────

const STORAGE_KEY_SESSION  = 'crm_session_id';
const STORAGE_KEY_CONV     = 'crm_conversation_id';
const WIDGET_ID            = 'crm-chat-widget';

// Leer configuración del script tag
function getConfig(): { tenantId: string; apiUrl: string } {
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-tenant]');
  const script  = scripts[scripts.length - 1];
  return {
    tenantId: script?.dataset.tenant ?? '',
    apiUrl:   (script?.dataset.api ?? 'http://localhost:3001').replace(/\/$/, ''),
  };
}

// ─── Session ID ───────────────────────────────────────────────────────────────

function getSessionId(): string {
  let id = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_SESSION, id);
  }
  return id;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const STYLES = `
  #crm-chat-widget * {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    margin: 0;
    padding: 0;
  }

  #crm-chat-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #4f46e5;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(79,70,229,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    z-index: 999998;
    transition: transform 0.2s, background 0.2s;
  }
  #crm-chat-btn:hover { background: #4338ca; transform: scale(1.05); }

  #crm-chat-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ef4444;
    color: white;
    font-size: 11px;
    font-weight: 700;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: none;
    align-items: center;
    justify-content: center;
  }

  #crm-chat-panel {
    position: fixed;
    bottom: 90px;
    right: 24px;
    width: 360px;
    height: 520px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 999999;
    transform: scale(0.95) translateY(10px);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.2s, opacity 0.2s;
  }
  #crm-chat-panel.open {
    transform: scale(1) translateY(0);
    opacity: 1;
    pointer-events: all;
  }

  #crm-chat-header {
    background: #4f46e5;
    color: white;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  #crm-chat-header .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
  #crm-chat-header .info h4 { font-size: 14px; font-weight: 600; }
  #crm-chat-header .info p  { font-size: 12px; opacity: 0.8; margin-top: 1px; }
  #crm-chat-close {
    margin-left: auto;
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    opacity: 0.8;
    line-height: 1;
  }
  #crm-chat-close:hover { opacity: 1; }

  #crm-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #f8f9fa;
  }

  .crm-msg {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.45;
    word-break: break-word;
  }
  .crm-msg.bot  {
    background: white;
    color: #1f2937;
    border-bottom-left-radius: 4px;
    align-self: flex-start;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .crm-msg.user {
    background: #4f46e5;
    color: white;
    border-bottom-right-radius: 4px;
    align-self: flex-end;
  }

  .crm-typing {
    display: flex;
    gap: 4px;
    padding: 12px 14px;
    background: white;
    border-radius: 14px;
    border-bottom-left-radius: 4px;
    align-self: flex-start;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .crm-typing span {
    width: 7px;
    height: 7px;
    background: #9ca3af;
    border-radius: 50%;
    animation: crm-bounce 1.2s infinite;
  }
  .crm-typing span:nth-child(2) { animation-delay: 0.2s; }
  .crm-typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes crm-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30%           { transform: translateY(-5px); }
  }

  #crm-chat-footer {
    padding: 12px;
    background: white;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 8px;
  }
  #crm-chat-input {
    flex: 1;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 14px;
    color: #1f2937;
    outline: none;
    resize: none;
    height: 40px;
    transition: border-color 0.2s;
    background: #fafafa;
  }
  #crm-chat-input:focus { border-color: #4f46e5; background: white; }
  #crm-chat-send {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #4f46e5;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  #crm-chat-send:hover    { background: #4338ca; }
  #crm-chat-send:disabled { background: #c4b5fd; cursor: not-allowed; }

  @media (max-width: 420px) {
    #crm-chat-panel { width: calc(100vw - 16px); right: 8px; bottom: 80px; }
  }
`;

// ─── HTML del widget ──────────────────────────────────────────────────────────

function buildHTML(): string {
  return `
    <button id="crm-chat-btn" aria-label="Abrir chat">
      💬
      <span id="crm-chat-badge"></span>
    </button>

    <div id="crm-chat-panel" role="dialog" aria-label="Chat de atención al cliente">
      <div id="crm-chat-header">
        <div class="avatar">🎪</div>
        <div class="info">
          <h4>Juegos del Siglo XXI</h4>
          <p>Respondemos al instante</p>
        </div>
        <button id="crm-chat-close" aria-label="Cerrar chat">×</button>
      </div>

      <div id="crm-chat-messages" aria-live="polite"></div>

      <div id="crm-chat-footer">
        <input
          id="crm-chat-input"
          type="text"
          placeholder="Escribí tu consulta..."
          maxlength="500"
          aria-label="Mensaje"
          autocomplete="off"
        />
        <button id="crm-chat-send" aria-label="Enviar">➤</button>
      </div>
    </div>
  `;
}

// ─── Widget principal ─────────────────────────────────────────────────────────

function initWidget(): void {
  // No inicializar dos veces
  if (document.getElementById(WIDGET_ID)) return;

  const config    = getConfig();
  const sessionId = getSessionId();
  let conversationId = localStorage.getItem(STORAGE_KEY_CONV) ?? undefined;
  let isOpen     = false;
  let isSending  = false;
  let unread     = 0;

  // ── Inyectar estilos ──
  const style = document.createElement('style');
  style.textContent = STYLES;
  document.head.appendChild(style);

  // ── Inyectar HTML ──
  const container = document.createElement('div');
  container.id = WIDGET_ID;
  container.innerHTML = buildHTML();
  document.body.appendChild(container);

  // ── Referencias DOM ──
  const btn      = document.getElementById('crm-chat-btn')!;
  const panel    = document.getElementById('crm-chat-panel')!;
  const closeBtn = document.getElementById('crm-chat-close')!;
  const messages = document.getElementById('crm-chat-messages')!;
  const input    = document.getElementById('crm-chat-input') as HTMLInputElement;
  const sendBtn  = document.getElementById('crm-chat-send') as HTMLButtonElement;
  const badge    = document.getElementById('crm-chat-badge')!;

  // ── Abrir/cerrar ──
  function openPanel(): void {
    isOpen = true;
    panel.classList.add('open');
    btn.innerHTML = '✕<span id="crm-chat-badge" style="display:none"></span>';
    unread = 0;
    badge.style.display = 'none';
    setTimeout(() => input.focus(), 200);

    // Mostrar bienvenida si no hay mensajes
    if (messages.children.length === 0) {
      appendBotMessage('¡Hola! 👋 Soy el asistente de Juegos del Siglo XXI. ¿En qué te puedo ayudar hoy?');
    }
  }

  function closePanel(): void {
    isOpen = false;
    panel.classList.remove('open');
    btn.innerHTML = '💬<span id="crm-chat-badge"></span>';
  }

  btn.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  // ── Agregar mensajes al DOM ──
  function appendBotMessage(text: string): void {
    const el = document.createElement('div');
    el.className = 'crm-msg bot';
    el.textContent = text;
    messages.appendChild(el);
    scrollToBottom();

    if (!isOpen) {
      unread++;
      badge.style.display = 'flex';
      badge.textContent   = String(unread);
    }
  }

  function appendUserMessage(text: string): void {
    const el = document.createElement('div');
    el.className = 'crm-msg user';
    el.textContent = text;
    messages.appendChild(el);
    scrollToBottom();
  }

  function showTyping(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'crm-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(el);
    scrollToBottom();
    return el;
  }

  function scrollToBottom(): void {
    messages.scrollTop = messages.scrollHeight;
  }

  // ── Enviar mensaje al backend ──
  async function sendMessage(): Promise<void> {
    const text = input.value.trim();
    if (!text || isSending) return;

    input.value  = '';
    isSending    = true;
    sendBtn.disabled = true;

    appendUserMessage(text);
    const typing = showTyping();

    try {
      const res = await fetch(`${config.apiUrl}/api/v1/chat/message`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: config.tenantId,
          sessionId,
          message: text,
          conversationId,
        }),
      });

      const data = await res.json() as {
        ok: boolean;
        reply: string;
        conversationId: string;
      };

      typing.remove();

      if (data.ok) {
        conversationId = data.conversationId;
        localStorage.setItem(STORAGE_KEY_CONV, conversationId);
        appendBotMessage(data.reply);
      } else {
        appendBotMessage('Hubo un problema al procesar tu mensaje. ¿Podés intentar de nuevo?');
      }
    } catch {
      typing.remove();
      appendBotMessage('No pudimos conectarnos. Verificá tu conexión e intentá de nuevo.');
    } finally {
      isSending        = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Eventos de envío ──
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  });
}

// ── Inicializar cuando el DOM esté listo ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}
