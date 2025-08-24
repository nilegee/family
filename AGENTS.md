# AGENTS.md — FamilyNest Engineering Contract (Updated for Phase 2)

This document defines the technical, architectural, and behavioral constraints for all code contributors and AI agents. **No deviations allowed without Product Owner (Ghassan) approval.**

---

## 🔧 STACK CONTRACT (LOCKED-IN)

| Layer           | Tech / Rule                                        |
|-----------------|----------------------------------------------------|
| Framework       | SvelteKit 2 (SSR + TS)                             |
| Styling         | Tailwind CSS + @tailwindcss/forms                  |
| Icons           | lucide-svelte                                      |
| State           | Svelte stores only (no Redux, Zustand, etc.)       |
| Validation      | Zod                                                |
| Dates           | Day.js                                             |
| Auth            | Supabase (Google OAuth only)                       |
| Storage         | Supabase `post-media` bucket (private, signed URLs)|
| Package Manager | pnpm (lock file committed)                         |

---

## 🧱 SCHEMA & BACKEND RULES

- ❄️ The schema is **frozen** in `PHASE0_SCHEMA_LOCKED.sql` (now updated to Phase 2).  
- These tables are canonical and immutable without approval:  

  **Core (Phase 0)**  
  - `app_settings`  
  - `profiles`  
  - `items`  
  - `interactions`  

  **Extended (Phase 1)**  
  - `quiz_questions`  
  - `quiz_answers`  
  - `quiz_guesses`  
  - `reflections`  
  - `scenario_questions`  
  - `scenario_answers`  

  **Extended (Phase 2)**  
  - `islamic_questions` (Q&A with reassurance fields: `explanation_correct`, `explanation_incorrect`, categories, order_index)  

- All backend logic must **match exactly** what is in the schema file.  
- Supabase is used **only** for persistence — not for dynamic roles, logic, or migrations.  
- ✅ RLS must remain enabled for all tables.  
- ❌ No Supabase Edge Functions or additional services allowed.  

---

## 🔐 AUTH & ROLE ENFORCEMENT

- Google login is enforced via Supabase.  
- Only these **four hardcoded emails** are allowed (see `src/lib/server/allowlist.ts`).  
- Role detection and permissions are **handled in frontend only**.  
- Backend never controls visibility or access logic.  

---

## 🎨 FRONTEND UX PRINCIPLES

- Mobile-first, accessible, low-cognitive-load design.  
- Smart Cards render before feed; `BirthdayCard` mandatory if data exists.  
- Smart Card-first feed: Feed must show meaningful cards before content if empty.  
- Gentle UX: no gamification, no intrusive notifications.  
- Must support keyboard navigation, reduced motion preferences, and proper contrast.  

### Phase 2 Widget Visibility Rules
- **"What Would You Do?" (ScenarioCard)** → children only (Yazid, Yahya).  
- **Reflections Digest & Scenario Digest** → parents only (Ghassan, Mariem).  
- **Profession Card** updated roles & icons as defined in Phase 2 requirements.  
- **Age Playground** max age = 70 for Ghassan, 18 for others.  
- **Islamic Q&A** → 1-2 questions per session, gentle reassurance explanations.  

---

## 🧠 DESIGN PHILOSOPHY

- Schema-First: Data drives design. Schema never changes without PO approval.  
- Contractual AI: Copilot, codegen, or any LLM must obey this file and `PHASE0_SCHEMA_LOCKED.sql`.  
- No Dead Ends: All screens should offer CTAs or Smart Cards, never show blanks.  
- Single-Family Privacy: All storage, media, and feeds are locked to one household context.  

---

## 🚫 PROHIBITED

- ❌ Do not install UI mega-libraries (e.g., Material UI, Bootstrap).  
- ❌ Do not add new database tables, columns, triggers, or roles without PO approval.  
- ❌ Do not rely on runtime dynamic role assignment or permissions logic.  
- ❌ Do not use Supabase functions, webhooks, or realtime features.  

---

## 🚧 CURRENT SPRINT CONSTRAINTS

- ❌ Do not change login flow (/ → Google OAuth → /dashboard).  
- ❌ Do not modify Supabase auth, allowlist, or baseline RLS policies.  
- ✅ Focus on quality & stability improvements only.  
- ✅ Fix TypeScript errors and add error boundaries.  
- ✅ Implement shared stores for better state management.  
- ✅ Enforce visibility rules on all widgets per Phase 2 specifications.  
- ✅ Test Islamic Q&A reassurance flow and accessibility compliance.  

---

## 📁 CONTRACT FILES

| File                          | Description                              |
|-------------------------------|------------------------------------------|
| PHASE0_SCHEMA_LOCKED.sql      | Canonical schema (Phase 0–2 tables)      |
| COPILOT_PROMPT_PHASE2_FULL.txt| AI codegen scaffold guide                |
| README.md                     | Project overview and usage instructions |
| AGENTS.md                     | Enforcement document for humans + AI    |

---

✅ This contract is binding for any contributor or AI. Any deviation must be approved explicitly by Ghassan (Product Owner).  
