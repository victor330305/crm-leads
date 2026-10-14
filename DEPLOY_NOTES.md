# Notas de Deploy — Railway Backend

## Problema: Railway no actualizaba el código después de un push

### Síntoma
- Se hacía `git push origin main` con cambios en el código TypeScript
- Railway mostraba el deployment como "Deployment successful" 
- Pero el endpoint `/health` seguía devolviendo la versión vieja
- El bot respondía con el comportamiento del código anterior

### Causa raíz
Railway cachea agresivamente las capas del build de Docker. Cuando solo cambian archivos `.ts` (TypeScript), Railway detecta que el `package-lock.json` no cambió y reutiliza la imagen cacheada sin recompilar el TypeScript.

Además, la integración con GitHub estaba rota:
- Settings → Source mostraba **"Auto deploy unavailable"**
- "Could not load branches" en rojo
- Railway no detectaba los pushes automáticamente

### Solución definitiva para actualizar el código en producción

**Opción 1 — Recompilar directamente en el servidor (la que funcionó):**

1. Ir a Railway → servicio `crm-leads` → tab **"Console"**
2. Ejecutar:
   ```bash
   npx tsc
   ```
3. Matar el proceso viejo (encontrar el PID):
   ```bash
   cat /proc/*/cmdline 2>/dev/null | tr '\0' ' ' | grep "node dist"
   ```
   Buscar el número de proceso de `node dist/index.js` (ejemplo: PID 99)
4. Matar y reiniciar:
   ```bash
   kill 99 && sleep 2 && node dist/index.js &
   ```
5. Verificar que tomó el nuevo código:
   ```
   https://crm-leads-production-4039.up.railway.app/health
   ```
   Debe devolver la versión actualizada.

---

**Opción 2 — Forzar recompilación via GitHub (para el futuro):**

Si la integración con GitHub funciona, cambiar algo en el `package.json` para invalidar el caché:
```json
"version": "1.0.X"  ← incrementar el número
```
Esto hace que el hash del `package-lock.json` cambie y Railway recompila todo desde cero.

---

**Opción 3 — Reconectar GitHub con Railway:**

Si "Auto deploy unavailable" persiste:
1. Railway → Settings → Source → click en ✏️ al lado del repo
2. Click en "Configure GitHub App"
3. En GitHub → Applications → Railway App → Save
4. Volver a Railway → click en "Retry" en el mensaje rojo

---

### URLs del sistema

| Servicio | URL |
|----------|-----|
| Backend API (Railway) | https://crm-leads-production-4039.up.railway.app |
| Health check | https://crm-leads-production-4039.up.railway.app/health |
| Dashboard (Vercel) | https://crm-leads-7orf.vercel.app |
| Widget JS | https://crm-leads-7orf.vercel.app/crm-widget.iife.js |

### Credenciales del sistema

| Dato | Valor |
|------|-------|
| Admin email | admin@juegosdelsigloxxi.com.ar |
| Admin password | admin123 |
| Tenant ID | cmuw1yeht0000ow5qqwmw9v70 |

### Checklist para hacer cambios en producción

1. Hacer los cambios en el código local
2. Probar localmente con `npm run dev`
3. Commit y push: `git add . && git commit -m "descripción" && git push origin main`
4. Si Railway no auto-deploya (auto deploy unavailable):
   - Ir a Railway Console y ejecutar `npx tsc` + reiniciar proceso
5. Verificar con el health endpoint que la versión cambió
6. Probar en el chat widget en incógnito

---

*Documento creado el 14/10/2026 después de resolver el problema de caché de Railway.*
