# DIPLOCRAFT — Fase 17 — Economia Profunda

> Arquivos de identidade são gerados de `build.config.json`.

**Versão:** v1.6.1  
**Build:** 18/06/2026 10:31 — America/Sao_Paulo  
**Status:** DEEP_ECONOMY_VERIFIED; ainda não é a versão comercial final.  
**Artefato esperado:** `DIPLOCRAFT_v1.6.1_FASE-17_ECONOMIA-PROFUNDA_build_20260618_1031.zip`
**Config SHA-256:** `16afef7268ae49e56ddffa8101c4a59f3fa69d6ced3ca5d19034b4e92629ed50`

## Executar

Sirva esta pasta por HTTP/HTTPS. Para teste local: `python -m http.server 8000`. A instalação PWA e o modo offline exigem HTTPS ou localhost; `file://` não é suportado.

## PWA

- Manifesto: `manifest.webmanifest`
- Service worker: `sw.js`
- Cache e precache: `meta/pwa.json`
- Ícones e splash: `assets/pwa/`
- Atualizações são controladas e só assumem a sessão após confirmação.

## Compatibilidade

Save schema 3, chave `diplocraft_save_v101`, preservado.
