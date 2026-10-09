(function(){"use strict";const x="crm_session_id",b="crm_conversation_id",y="crm-chat-widget";function S(){const t=document.querySelectorAll("script[data-tenant]"),a=t[t.length-1];return{tenantId:(a==null?void 0:a.dataset.tenant)??"",apiUrl:((a==null?void 0:a.dataset.api)??"http://localhost:3001").replace(/\/$/,"")}}function C(){let t=localStorage.getItem(x);return t||(t="sess_"+Math.random().toString(36).slice(2)+Date.now().toString(36),localStorage.setItem(x,t)),t}const T=`
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
`;function L(){return`
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
  `}function v(){if(document.getElementById(y))return;const t=S(),a=C();let s=localStorage.getItem(b)??void 0,r=!1,d=!1,l=0;const w=document.createElement("style");w.textContent=T,document.head.appendChild(w);const p=document.createElement("div");p.id=y,p.innerHTML=L(),document.body.appendChild(p);const m=document.getElementById("crm-chat-btn"),k=document.getElementById("crm-chat-panel"),z=document.getElementById("crm-chat-close"),o=document.getElementById("crm-chat-messages"),i=document.getElementById("crm-chat-input"),h=document.getElementById("crm-chat-send"),g=document.getElementById("crm-chat-badge");function B(){r=!0,k.classList.add("open"),m.innerHTML='✕<span id="crm-chat-badge" style="display:none"></span>',l=0,g.style.display="none",setTimeout(()=>i.focus(),200),o.children.length===0&&c("¡Hola! 👋 Soy el asistente de Juegos del Siglo XXI. ¿En qué te puedo ayudar hoy?")}function E(){r=!1,k.classList.remove("open"),m.innerHTML='💬<span id="crm-chat-badge"></span>'}m.addEventListener("click",()=>r?E():B()),z.addEventListener("click",E);function c(e){const n=document.createElement("div");n.className="crm-msg bot",n.textContent=e,o.appendChild(n),u(),r||(l++,g.style.display="flex",g.textContent=String(l))}function M(e){const n=document.createElement("div");n.className="crm-msg user",n.textContent=e,o.appendChild(n),u()}function _(){const e=document.createElement("div");return e.className="crm-typing",e.innerHTML="<span></span><span></span><span></span>",o.appendChild(e),u(),e}function u(){o.scrollTop=o.scrollHeight}async function I(){const e=i.value.trim();if(!e||d)return;i.value="",d=!0,h.disabled=!0,M(e);const n=_();try{const f=await(await fetch(`${t.apiUrl}/api/v1/chat/message`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tenantId:t.tenantId,sessionId:a,message:e,conversationId:s})})).json();n.remove(),f.ok?(s=f.conversationId,localStorage.setItem(b,s),c(f.reply)):c("Hubo un problema al procesar tu mensaje. ¿Podés intentar de nuevo?")}catch{n.remove(),c("No pudimos conectarnos. Verificá tu conexión e intentá de nuevo.")}finally{d=!1,h.disabled=!1,i.focus()}}h.addEventListener("click",I),i.addEventListener("keydown",e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),I())})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",v):v()})();
