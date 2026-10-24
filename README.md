# ORO AI

> **Don't just make promises. Keep them.**  
> A commitment-aware quotation and technician scheduling prototype for Malaysian service SMEs.

**SDC Hackathon 2026 — Domain 2: Orbyte Smart SME Challenge (Less Busywork, Better Business)**  
**Developed by Team I Forget |**

---

## Team Information

| Field | Details |
|---|---|
| **Team Name** | I Forget |
| **Project Name** | ORO AI |
| **Team Domain** | Domain 2 — Orbyte Smart SME Challenge |
| **SDG Track** | SDG 8 — Decent Work and Economic Growth |
| **Team Leader** | Wong Zhong Jie |
| **University** | Asia Pacific University of Technology & Innovation (APU), Malaysia |
| **Number of Members** | 5 |

## Links

| Resource | Link |
|---|---|
| **GitHub Repository** | [firdieadham1108-bot/ORO-AI](https://github.com/firdieadham1108-bot/ORO-AI) |
| **Live Demo (Replit)** | [oro-ai.replit.app](https://oro-ai.replit.app) |
| **Slide Deck** | [ORO AI presentation (Canva)](https://canva.link/v1jbxouj1mhkeks) |
| **Demo Video** | [ORO AI demonstration (YouTube)](https://youtu.be/B67TfU6jsbM) |

---

## Overview

### Problem

Small service businesses often receive informal customer enquiries while maintaining quotation prices, employee leave, staff qualifications, and existing job schedules in separate records. When staff confirm an appointment without checking these records together, they risk promising service that the business cannot actually deliver. For technician-dependent SMEs, this can lead to unnecessary rescheduling, additional coordination, and damaged customer confidence.

**Core problem:** Customer commitments are not always checked against real operational capacity before confirmation.

### Solution

**ORO AI combines enquiry handling, quotation generation, staff-capacity verification, manager approval, and commitment recovery in one workflow.** It calculates prices from a stored catalogue, checks simulated leave and job assignments against simplified technician requirements, explains scheduling conflicts, and recommends available alternatives. A manager approves a feasible appointment before it is saved. A simulated emergency-leave event can subsequently flag an approved booking as **At Risk** and propose a qualified replacement.

The prototype is demonstrated using **CoolAir Services Sdn Bhd**, a fictional air-conditioning service company in Cheras, Kuala Lumpur. Its approach is also relevant to other technician-based SMEs, such as repair and maintenance workshops; those additional industries have not yet been implemented as production catalogues.

### Key Features

- **Structured customer enquiries:** Rule-based extraction of supported English, Bahasa Melayu/Manglish, and selected Chinese service messages; incomplete or unsupported requests may require clarification.
- **Quotation calculations:** Server-side prices from a predefined service catalogue; supported multi-line service requests.
- **Capacity-aware scheduling:** Checks technician eligibility, seniority, approved leave, existing assignments, working days, and overlapping appointments.
- **Explainable alternatives:** Shows why a date is infeasible and suggests feasible alternatives when available.
- **Human approval:** Demonstration Sales/Manager roles; managers can approve feasible appointments or decline submitted drafts.
- **Booking safeguards and audit trail:** Rechecks availability at confirmation, prevents overlapping assignments within the shared SQLite database, and logs actions.
- **Commitment recovery:** A built-in simulated leave event checks approved bookings and supports manager-approved replacement assignments.
- **Accessible demo:** Responsive website/PWA provisions, printable quotation, activity log, and repeatable demo reset.

### Flagship Demonstration

1. A customer requests **six 1.5HP air-conditioner installations in Cheras on Friday, 23 October 2026**.
2. The predefined price is **6 × RM190 = RM1,140**.
3. Friday is **not feasible** in the synthetic dataset: Ali is on leave; Bala, Mei, and Chong have existing assignments.
4. ORO AI recommends **Monday, 26 October 2026**, with **Bala (senior technician) and Mei**.
5. Manager **Faizal** approves the appointment. The booking and decision are saved and logged.
6. A simulated approved emergency leave for Bala flags the commitment **At Risk**, and the system proposes **Chong** as a replacement for manager review.

*The demo uses a fixed historical reference date of 21 October 2026 for reproducibility; its staff and pricing records are synthetic.*

### AI and Integration Transparency

The current **text enquiry extractor is rule-based**, not a connected large language model. Pricing, crew matching, scheduling, approvals, and recovery are deterministic code—not AI-generated guesses. Browser speech recognition is supported where available. Optional OpenAI-powered uploaded-audio transcription exists in the source code, but **was not configured in the team's reported demo environment**; without it, the app clearly labels the built-in sample transcription as simulated.

Orbyte People, eLeave, and Work appear as **mock adapter concepts only**. The sponsor's Orbyte website was a reference example, not a live integration. **Replit** is the compulsory development/deployment platform used by the team. 

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js 24, Express 5, TypeScript |
| **Database** | SQLite (Node.js `node:sqlite`) |
| **API and validation** | OpenAPI contract, Zod, generated client, TanStack React Query |
| **UI and routing** | ORO design-system components, Lucide icons, Wouter |
| **Testing** | Node.js test runner; API integration and regression tests |
| **Package management** | pnpm workspaces |
| **Hosting and development** | Replit (compulsory platform; US$20 Core sponsorship offered) |
| **Version control** | Git / GitHub |
| **External runtime APIs** | No required third-party service for the core demo; optional speech transcription is not configured |

---

## Project Structure

```text
ORO-AI/
├── artifacts/
│   ├── oro-ai/                     # React frontend, pages, PWA assets
│   │   ├── src/pages/              # Dashboard, Enquiry, Quotes, Schedule,
│   │   │                           # Approvals, Risk Monitor, Activity
│   │   └── public/                 # Icons, manifest, sample voice note
│   ├── api-server/                 # Express backend + SQLite business logic
│   │   ├── src/lib/oro/            # Parser, pricing, scheduling, approval,
│   │   │                           # risk, mock adapters, synthetic data
│   │   ├── src/routes/             # API endpoints
│   │   └── tests/                  # Automated acceptance/regression tests
│   ├── oro-design-system/          # Shared UI design system
│   └── mockup-sandbox/             # Design explorations
├── lib/api-spec/                   # OpenAPI specification and code generation
├── Submissions/                    # Current template PDFs + Replit proof image
├── scripts/
├── orbyte-api-assumptions.md       # Mock-integration assumptions
├── README.md
├── .replit
├── package.json
└── pnpm-workspace.yaml
```


### Architecture

```text
Customer WhatsApp-style message / browser voice input
                       │
                       ▼
       React enquiry workspace (Replit)
                       │
                       ▼
              Express REST API
                       │
         Rule-based enquiry extraction
                       │
           Service catalogue (SQLite)
                       │
                       ▼
            Scheduling decision engine
                       │
      ┌────────────────┼────────────────┐
      ▼                ▼                ▼
  Staff skills    Approved leave    Existing jobs
      └────────────────┼────────────────┘
                       │
           Feasibility + alternative
                       │
                       ▼
              Manager approval
                       │
         SQLite booking + activity log
                       │
                       ▼
      Simulated leave event → Risk monitor
                       │
                       ▼
       Manager-approved crew replacement
```

The staffing data shown as **Orbyte People / eLeave / Work** is simulated in the local SQLite database through mock adapters. The prototype does not call real Orbyte endpoints.

---

## How to Run

### Option 1 — Replit (Recommended)

1. Open the team's Replit project, or import the [GitHub repository](https://github.com/firdieadham1108-bot/ORO-AI) into Replit.
2. Use the existing Replit project configuration and the **Run** button to start its frontend and API workflows.
3. Open the preview or published [live demo](https://oro-ai.replit.app).
4. For the prepared presentation scenario, use **Reset Demo State** before testing.

The app uses synthetic SQLite data and **does not require external API credentials for the core demonstration**. Any optional transcription keys must be supplied through Replit Secrets, never committed to GitHub.

### Option 2 — Local Development

**Prerequisites:** Node.js **24+**, pnpm, and Git.

```bash
git clone https://github.com/firdieadham1108-bot/ORO-AI.git
cd ORO-AI
pnpm install
```

Backend:

```bash
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/api-server start
```

Frontend (separate terminal on macOS/Linux):

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/oro-ai dev
```

**Important:** The frontend sends requests to `/api`. Replit's multi-service router handles this in the hosted project. A standalone local setup requires an appropriate reverse proxy/API routing configuration before the full interface will function. The frontend Vite configuration also requires `PORT` and `BASE_PATH` environment variables.

### Run Tests

```bash
pnpm test
```

The test runner starts a separate backend instance and temporary SQLite database so it does not overwrite demo data. 

---

## How We Use Replit *(Required)*

Replit is the team's compulsory development and deployment platform. The organisers offered a **US$20 Replit Core sponsorship**; confirm the team's redemption status separately in the technical declaration. The repository includes Replit-specific workspace and routing configuration.

- **Development:** Build and iterate on the React frontend and Express backend in a shared cloud environment.
- **Execution:** Run the app's web and API services with the Replit project workflow.
- **Deployment:** Publish the application at [oro-ai.replit.app](https://oro-ai.replit.app).
- **Configuration:** Use Replit Secrets if optional external transcription credentials are added.
- **Testing:** Execute the backend acceptance tests and prepare reproducible scenarios with the demo reset control.

**Replit proof of use:** The current repository contains a screenshot in `Submissions/`. 

---

## Challenges & Learnings

- **Building with limited prior coding experience:** The five-member student team used an achievable prototype scope and AI-assisted development tools to support learning, iteration, and debugging.
- **Unstructured enquiries:** Informal English, Malay/Manglish, and Chinese requests can be ambiguous; the current parser supports specified patterns and asks for clarification in recognised incomplete cases.
- **Reliable commitments:** Pricing a job is not enough. Availability needs to be verified before the business approves a date, and rechecked at approval time.
- **Changing schedules:** Approved bookings may become infeasible after employee leave changes; the demo illustrates detection and manager-reviewed recovery.
- **Honest scope:** The team chose synthetic data, mock Orbyte adapters, and deterministic business rules rather than falsely claiming a production integration or general-purpose AI model.

### Expected Impact and SDG 8

ORO AI aligns with **SDG 8 — Decent Work and Economic Growth** by exploring ways to reduce repetitive administrative work and support productivity among service SMEs. The project's **manual-workflow baseline** assumes **no automated availability checks by design**; it is a **synthetic comparison model, not an observed statistic about Malaysian SMEs**. Future evaluation could compare manual and assisted quotation times, conflict-detection accuracy, and successful commitment recovery. **No measured customer savings or SME pilot results are claimed.**

---

## Future Improvements

- [ ] Replace rule-based-only text extraction with a validated LLM-assisted workflow and editable extracted line items.
- [ ] Add owner-managed services, prices, employees, and qualifications.
- [ ] Support job-specific durations, public holidays, travel time, and multiple visits per day.
- [ ] Integrate approved real business systems and event-driven leave updates when access is available.
- [ ] Add real authentication, persistent managed storage, and stronger data protection controls.
- [ ] Validate usability and measurable results with actual Malaysian SMEs.

---

## Team

| Name | Role | GitHub |
|---|---|---|
| **Wong Zhong Jie** | Team Leader | Jie-begin |
| **Cherryl Ng Huijane** | Team Member | - |
| **Irwin Wong Jiong Liang** | Team Member | - |
| **Balshaan Singh A/L Malvinder Singh** | Team Member | - |
| **Wan Mohamad Firdie Adham Bin Wan Hairul Azrie** | Team Member | firdieadham1108-bot |

The team divided its work into **technical integration/deployment, quotations and business logic, workforce scheduling/testing, UI/UX, and documentation/presentation**. 
---

## License

This project is distributed under the [Apache License 2.0](LICENSE). Third-party libraries retain their respective licences; see the dependency manifests and lockfile for package details.

**ORO AI — Don't just make promises. Keep them.**
