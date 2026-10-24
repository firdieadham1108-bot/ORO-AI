# ORO AI
### Don't Just Make Promises. Keep Them.

**A commitment-aware quotation and workforce scheduling platform for service-based SMEs.**

**Team I Forget | SDC Hackathon 2026 | Domain 2: Orbyte Smart SME Challenge**

---

## Project Links

| Resource | Link |
|---|---|
| **Live Web Application** | [ORO AI — Live Demo](https://oro-ai.replit.app) |
| **GitHub Repository** | [ORO AI Source Code](https://github.com/firdieadham1108-bot/ORO-AI) |
| **Presentation Slides** |[Slides](https://canva.link/v1jbxouj1mhkeks)
| **Demonstration Video** | [YT](https://youtu.be/B67TfU6jsbM) |

---

## 1. About ORO AI

ORO AI is a web-based business automation prototype developed by **Team I Forget**

Built for the **SDC Hackathon 2026 — Domain 2: Orbyte Smart SME Challenge**, ORO AI addresses a common operational challenge faced by service-based small and medium enterprises (SMEs): making customer commitments without first verifying whether the business has sufficient resources to fulfil them.

Small businesses such as motorcycle repair workshops, air-conditioning service providers and maintenance contractors often handle customer requests through informal messages while managing quotations, employee leave and job schedules separately.

ORO AI brings these activities into one coordinated workflow.

It helps staff interpret supported customer enquiries, generate service quotations, verify workforce availability and recommend realistic appointment dates. A manager reviews and approves the proposed booking before it becomes a confirmed commitment.

ORO AI also demonstrates how a business can identify and recover from a staffing change after an appointment has already been confirmed.

**Our mission is simple: help SMEs make better-informed customer commitments, reduce avoidable scheduling conflicts and protect business credibility.**

---

## 2. Problem Statement

### The challenge: Businesses can make promises without knowing whether they can keep them.

Many small service businesses rely on fragmented and manual processes to manage daily operations.

Customer enquiries may arrive through WhatsApp, while service prices, employee leave, technical qualifications and existing job assignments are recorded in different places.

As a result, business owners and employees must manually coordinate this information before confirming an appointment.

This creates three main operational problems:

**1. Fragmented business information**

Important operational records are not always available in one place. Staff may need to check multiple records or contact different employees to confirm availability.

**2. Time-consuming administrative work**

Preparing quotations and checking schedules manually adds repetitive work, particularly when customers use informal or incomplete messages.

**3. Unreliable customer commitments**

An appointment may be promised before the business verifies technician availability, qualifications or conflicting assignments. Unexpected staff leave can further threaten confirmed appointments.

These situations can contribute to delays, avoidable rescheduling, additional operating costs and lost customer trust.

### Our core problem statement

**Service SMEs struggle to make reliable customer commitments because quotations, employee availability and job scheduling are often managed through disconnected manual processes.**

---

## 3. Our Solution

ORO AI connects quotation preparation with operational capacity checking and manager approval.

Instead of stopping once a quotation has been generated, the system asks an additional question:

**Can the business actually fulfil the requested service on the proposed date?**

ORO AI supports this decision by checking available staff, approved leave, existing work assignments and simplified business staffing requirements.

When a requested appointment is not feasible, the system explains the conflict and searches for an alternative date with a suitable available crew.

Once a manager approves an appointment, the system saves the commitment and records the decision.

If a subsequent simulated leave event affects an approved booking, ORO AI can flag that commitment as at risk and recommend a potential replacement technician.

### Our value proposition

**From customer enquiry to realistic commitment — with human oversight and traceable decisions.**

---

## 4. Innovation and Differentiation

ORO AI focuses on **commitment reliability**, rather than quotation generation alone.

Its proposed innovation is the combination of four operational capabilities within one workflow:

| Capability | Business Value |
|---|---|
| **Quotation automation** | Reduces repetitive pricing calculations for supported services. |
| **Capacity-aware scheduling** | Checks whether qualified staff are available before an appointment is approved. |
| **Human-controlled confirmation** | Keeps important customer commitments under manager supervision. |
| **Commitment risk and recovery** | Helps identify an affected appointment and propose a feasible replacement when staff availability changes. |

The prototype demonstrates a **promise → verify → approve → monitor → recover** approach.

This is especially relevant to technician-dependent SMEs, where a booking requires not just an available time slot but also employees with appropriate skills.

ORO AI does not claim to eliminate every scheduling failure. Instead, it demonstrates how connected data, deterministic rules and human decisions can reduce avoidable risks.

---

## 5. How ORO AI Works

ORO AI follows the five-stage business automation workflow used in the Domain 2 challenge.

### Stage 1 — Trigger

A staff member enters a customer enquiry received through WhatsApp-style messaging or another communication channel.

The application accepts text and provides supported voice-input options.

### Stage 2 — Connected Business Data

The system uses simulated Orbyte-related business records, including:

- **Orbyte People:** Employee information and qualifications.
- **Orbyte eLeave:** Approved employee leave.
- **Orbyte Work:** Existing work assignments and appointments.
- **Service Catalogue:** Stored service descriptions and prices.

These integrations are represented by mock adapters and synthetic data.

### Stage 3 — Decision Logic

ORO AI processes the supported enquiry and applies deterministic business rules to:

- Identify required service information.
- Calculate quotation prices.
- Determine staffing requirements.
- Check employee availability and overlapping assignments.
- Detect conflicts.
- Recommend feasible alternative dates and crews.

### Stage 4 — Human Approval

The proposed quotation and schedule are presented to a manager.

The manager can approve a feasible appointment or decline a submitted quotation.

Before confirmation, the backend rechecks availability to reduce the risk of double-booking.

### Stage 5 — Visible Outcome

Once approved, the application:

- Saves the quotation.
- Records the technician assignment.
- Updates the relevant schedule.
- Provides a printable quotation.
- Creates an activity-log record.

### Additional Stage — Commitment Risk and Recovery

The current prototype includes a simulated emergency-leave workflow.

When an approved leave event affects a saved appointment, ORO AI evaluates the impact, flags the commitment and proposes an available qualified replacement when possible.

A manager must approve the change.

---

## 6. Demonstration Scenario

The application uses a fictional air-conditioning company:

**CoolAir Services Sdn Bhd — Cheras, Kuala Lumpur**

All prices, staff names, schedules and company rules in this example are synthetic.

### Customer Request

> "Boss, can you install 6 units of 1.5HP aircon at our Cheras office this Friday? Send quote please."

The demonstration uses a fixed reference date of 21 October 2026.

ORO AI extracts the supported service details:

| Field | Result |
|---|---|
| Service | Air-conditioning installation |
| Specification | 1.5HP |
| Quantity | 6 units |
| Location | Cheras |
| Requested Appointment | Friday, 23 October 2026 |

### Quotation Calculation

The fictional service catalogue lists installation of a 1.5HP unit at RM190.

**6 × RM190 = RM1,140**

The quotation is calculated using the stored price and requested quantity.

### Availability Verification

The simulated job requires two qualified technicians, including at least one senior technician.

However, on Friday, 23 October:

- Ali is on approved leave.
- Bala has an existing work assignment.
- Mei has an existing work assignment.
- Chong has an existing work assignment.

**Result: The requested appointment cannot be fulfilled with the available crew.**

### Recommended Alternative

ORO AI identifies Monday, 26 October 2026 as a feasible alternative in the demonstration dataset.

**Recommended technicians:** Bala (Senior Technician) and Mei (Qualified Technician).

Manager Faizal can review the quotation, proposed crew and appointment before confirmation.

### Recovery Demonstration

After the Monday booking is approved, the application can simulate Bala receiving approved emergency leave.

The system evaluates the saved appointment and marks it **At Risk**.

It then identifies Chong as a potential replacement, subject to availability checks and manager approval.

The resulting change is recorded in the activity log.

**This demonstrates the key idea behind ORO AI: a quotation should be backed by a realistic operational commitment.**

---

## 7. Main Features

| Feature | Description |
|---|---|
| **Business Dashboard** | Summarises quotations, bookings, scheduling conflicts and items requiring attention. |
| **Customer Enquiry Workspace** | Processes supported multilingual service enquiries. |
| **Quotation Generator** | Calculates prices from a predefined service catalogue, including supported multi-service enquiries. |
| **Smart Scheduling** | Evaluates technician availability, approved leave, existing assignments and simplified crew requirements. |
| **Alternative Date Recommendations** | Searches working days for feasible appointment options. |
| **Manager Approval** | Supports quotation approval and rejection through a demonstration role workflow. |
| **Staff Schedule** | Displays employee leave, existing jobs and confirmed appointments. |
| **Commitment Risk Monitor** | Detects risk from the built-in emergency-leave event. |
| **Recovery Assistant** | Recommends and supports manager-approved replacement-crew assignments. |
| **Activity Log** | Stores significant actions and decisions. |
| **Voice Input** | Offers browser speech recognition where supported and a clearly labelled simulated transcription mode. |
| **Responsive Web App / PWA** | Includes mobile-responsive design and installable-web-app provisions. |

The application also demonstrates a fictional Orbyte Credit Wallet and temporary crew-hold indicator. Neither represents a real financial transaction or a guaranteed database reservation before manager approval.

---

## 8. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite |
| API Specification | OpenAPI |
| Input and API Validation | Zod |
| API Data Handling | React Query |
| Package Management | pnpm Workspaces |
| Testing | Node.js Test Runner |
| Development and Deployment | Replit |
| Version Control | Git and GitHub |
| Voice Transcription Integration | Optional OpenAI speech-to-text support, not currently configured |
| Orbyte Ecosystem Integration | Simulated adapters and synthetic business records |

### Why This Architecture?

The team chose a web-based solution to make the prototype accessible from both desktop and mobile browsers without developing separate native applications.

SQLite provides a straightforward database for the prototype, while the frontend and backend separate user interaction from business logic.

Deterministic calculations are used for critical scheduling and pricing decisions, improving their consistency and testability.

---

## 9. AI and Automation Transparency

Although the product is branded **ORO AI**, it is important to distinguish its implemented automation from its optional AI capabilities.

### Implemented Enquiry Processing

The current application uses **rule-based multilingual text extraction**.

It recognises supported service descriptions, quantities, equipment specifications, dates and locations using programmed patterns.

It can process tested English, Bahasa Melayu, Manglish and selected Chinese expressions.

However, it is **not currently powered by a live large language model for general-purpose enquiry understanding**.

Unusual, incomplete or ambiguous messages may require clarification or manual correction of the original enquiry.

### Voice Processing

The application includes browser-based speech recognition where supported.

It also contains an optional external transcription integration, but the supported speech-service credentials are not currently configured.

The built-in voice demonstration uses a **labelled simulated transcript** rather than claiming to transcribe arbitrary uploaded audio.

### Operational Decision-Making

The following capabilities are rule-based and data-driven:

- Quotation calculations.
- Technician availability verification.
- Leave-conflict detection.
- Skill and seniority matching.
- Alternative scheduling.
- Booking approval checks.
- Commitment risk evaluation.
- Recovery recommendations.

This separation prevents the system from relying on AI-generated guesses for critical business decisions.

### Development Tools

The team has used AI-assisted development tools, including ChatGPT, Gemini, Claude Code and Replit-assisted development workflows.

These tools support project planning, programming, debugging, code review and documentation.

The use of development assistants is distinct from deploying an AI model inside the application.

The team's final technical declaration should identify the specific tools and services actually used.

---

## 10. Technical Architecture

The project uses a pnpm monorepo.

```text
ORO-AI/
├── artifacts/
│   ├── oro-ai/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── public/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── lib/oro/
│   │   │   └── routes/
│   │   └── tests/
│   ├── oro-design-system/
│   └── mockup-sandbox/
├── lib/
│   └── api-spec/
├── scripts/
├── README.md
├── orbyte-api-assumptions.md
├── package.json
└── pnpm-workspace.yaml
```

### Important Backend Modules

| Module | File |
|---|---|
| Enquiry Parser | `artifacts/api-server/src/lib/oro/parser.ts` |
| Service Catalogue | `artifacts/api-server/src/lib/oro/services.ts` |
| Scheduling Engine | `artifacts/api-server/src/lib/oro/scheduling.ts` |
| Availability Logic | `artifacts/api-server/src/lib/oro/availability.ts` |
| Approval Logic | `artifacts/api-server/src/lib/oro/approval.ts` |
| Commitment Risk | `artifacts/api-server/src/lib/oro/risk.ts` |
| Orbyte Mock Adapters | `artifacts/api-server/src/lib/oro/orbyte-adapters.ts` |
| Voice Processing | `artifacts/api-server/src/lib/oro/voice.ts` |
| Synthetic Data | `artifacts/api-server/src/lib/oro/seed.ts` |

Further integration assumptions are documented in [`orbyte-api-assumptions.md`](orbyte-api-assumptions.md).

---

## 11. How to Use ORO AI

### Live Demonstration

Visit:

**https://oro-ai.replit.app**

The demonstration can be explored using the synthetic company records provided in the application.

### Suggested Demonstration Steps

1. Open the application and select **Reset Demo State** to restore the prepared example.
2. Switch to Manager Faizal and navigate to **New Enquiry**.
3. Load the Friday scheduling-conflict scenario.
4. Analyse the customer message and review the generated RM1,140 quotation.
5. Inspect the reason the requested Friday appointment is unavailable.
6. Select the recommended Monday appointment with Bala and Mei.
7. Approve the quotation and confirm the appointment.
8. Open the staff schedule or quotations page to inspect the saved record.
9. Trigger Bala's simulated emergency leave.
10. Review the **At Risk** commitment and approve an available replacement if proposed.
11. Open the activity log to inspect the recorded decisions.

The role selector and emergency-leave trigger are demonstration controls, not production authentication or live external events.

---

## 12. Installation and Development

### Requirements

- Node.js 24 or later.
- pnpm.
- Git.

### Clone the Repository

```bash
git clone https://github.com/firdieadham1108-bot/ORO-AI.git
cd ORO-AI
```

### Install Dependencies

```bash
pnpm install
```

### Build the Project

```bash
pnpm build
```

### Run Automated Tests

```bash
pnpm test
```

### Running the Web Application

The recommended development environment is Replit, where the project configuration starts the API server and frontend application.

The frontend expects the backend API at `/api` on the same origin.

Running outside Replit may require a local reverse proxy or additional development configuration.

---

## 13. Testing and Validation

Automated tests are included in the repository to evaluate the core quotation, scheduling and commitment workflows.

### Latest Reported Test Results

| Metric | Result |
|---|---|
| Test environment | Current Replit development workspace |
| Tests passed | **44** |
| Tests failed | **0** |
| Tests skipped | **0** |

These results were reported from the team's latest Replit workspace audit.

**Verification note:** The tested Replit workspace has not yet been confirmed to match the latest GitHub commit exactly, and a complete browser-based end-to-end test of the published deployment remains outstanding.

### Tested Behaviours Include

- Correct quotation calculation.
- Supported multilingual enquiry extraction.
- Leave and existing-job conflict checking.
- Alternative appointment selection.
- Manager approval and quotation rejection.
- Concurrent double-booking prevention using the same SQLite database.
- Persistent booking and activity records within the same database.
- Simulated emergency-leave risk identification.
- Manager-approved replacement assignments.

The test suite uses a separate temporary SQLite database to avoid modifying the demonstration dataset.

---

## 14. Current Limitations

ORO AI is a functional, narrowly scoped hackathon prototype rather than a production-ready business platform.

Its current limitations include:

- Enquiry extraction is rule-based and limited to supported language patterns.
- There is no structured editor for directly changing extracted service line items.
- Service prices are defined in code, without a business-owner price-management interface.
- Scheduling uses simplified full-day appointments and basic technician qualification rules.
- Public holidays, travel time and optimised multi-appointment routing are not supported.
- Risk detection is triggered by the built-in simulated leave event rather than continuous monitoring of arbitrary external changes.
- Uploaded-audio transcription is currently simulated unless a supported external service is configured.
- The demonstration role selector is not production-grade authentication.
- SQLite data persistence across a deployment replacement is not guaranteed.
- Unsubmitted enquiry text is not always retained when navigating away.
- Changes to enquiry text after analysis may require explicit re-analysis to prevent stale results from being used.

Further testing, production-grade security and stronger data persistence would be required before deployment for real SME operations.

---

## 15. SDG 8 — Decent Work and Economic Growth

ORO AI is aligned with **United Nations Sustainable Development Goal 8: Decent Work and Economic Growth**.

The project explores how service SMEs can use digital workflows to improve operational efficiency, coordinate workers more effectively and reduce avoidable administrative work.

### Expected Benefits

**SME productivity**

Reduce repetitive quotation preparation and manual schedule-checking tasks.

**Better workforce coordination**

Improve visibility into employee assignments, approved leave and available technical skills.

**Reduced operational disruption**

Identify scheduling conflicts before approval and support recovery when a confirmed appointment becomes at risk.

**Customer confidence**

Help businesses communicate more realistic appointment commitments and preserve their reputation for reliability.

### Proposed Performance Indicators

| Indicator | How We Would Measure It |
|---|---|
| Quotation preparation time | Compare timed manual quotations with the ORO AI workflow for the same test enquiries. |
| Scheduling conflict detection | Measure conflicts correctly identified against a prepared set of staffing scenarios. |
| Booking accuracy | Check whether confirmed bookings meet all implemented crew and availability rules. |
| Administrative workload | Compare the number of manual steps required in the existing workflow and the prototype. |
| Recovery effectiveness | Measure whether the application can identify an affected booking and propose a qualified replacement. |

**Evidence status:** The team has not yet conducted a formal SME user study or established measured commercial time savings or cost reductions. These KPIs describe intended evaluation methods rather than achieved outcomes.

The project therefore does not claim a verified percentage improvement in productivity or revenue.

---

## 16. Commercial Potential

ORO AI is intended for small service companies that depend on technician scheduling and customer appointments.

Potential users include:

- Air-conditioning installation and maintenance businesses.
- Motorcycle repair workshops.
- Electrical and plumbing contractors.
- Equipment repair services.
- Other technician-based service SMEs.

### Potential Business Value

ORO AI could help SMEs reduce costs associated with unnecessary coordination, missed scheduling conflicts and avoidable appointment changes.

By encouraging businesses to verify their capacity before promising a service date, the platform also aims to preserve customer trust.

A future commercial version could offer a subscription or usage-based model, but no commercial pricing model has been validated.

The current Orbyte Credit Wallet is a simulated demonstration of a possible transaction-based approach and does not represent actual billing.

---

## 17. Challenges and Learning Outcomes

Team I Forget consists of five university students with limited prior software development experience.

The team selected a practical SME problem that could be represented through a realistic and testable end-to-end workflow.

During development, the team explored several challenges:

**Integrating multiple business functions**

Quotation creation, employee availability and manager approval needed to operate as one connected process.

**Handling informal customer communication**

Customer requests may use different languages, incomplete details and non-standard phrasing.

**Balancing intelligence and reliability**

The project uses deterministic rules for critical pricing and scheduling decisions rather than allowing AI to invent business facts.

**Preventing scheduling conflicts**

The team implemented availability revalidation and database-level safeguards for competing booking requests.

**Designing for practical adoption**

The application was developed as a responsive website to make the prototype accessible across desktop and mobile devices without separate native applications.

The development process also demonstrated how AI-assisted programming tools can help beginners prototype and test business software while still requiring human planning, verification and evaluation.

---

## 18. Future Development

Future improvements may include:

1. Genuine LLM-assisted multilingual customer enquiry extraction.
2. Structured quotation editing and owner-managed service prices.
3. More realistic job-duration and technician scheduling models.
4. Public-holiday calendars, travel time and route planning.
5. Automatic commitment monitoring through live events or supported webhooks.
6. Real Orbyte API integration, subject to access and documentation.
7. Real WhatsApp Business communication integration.
8. Stronger authentication and user permissions.
9. Durable production database hosting and improved deployment reliability.
10. Usability studies and pilot testing with actual Malaysian SMEs.

These enhancements are planned possibilities and are not claimed as completed functionality.

---

## 19. Team Information

| Field | Information |
|---|---|
| **Official Team Name** | I Forget |
| **Project Name** | ORO AI |
| **Hackathon** | SDC Hackathon 2026 |
| **Challenge Domain** | Domain 2 — Orbyte Smart SME Challenge |
| **University** | Asia Pacific University of Technology & Innovation (APU) |
| **SDG Track** | SDG 8 — Decent Work and Economic Growth |
| **Team Leader** | Wong Zhong Jie |
| **Team Size** | 5 members |

### Team Members

| Name | Position |
|---|---|
| **Wong Zhong Jie** | Team Leader |
| **Cherryl Ng Huijane** | Team Member |
| **Irwin Wong Jiong Liang** | Team Member |
| **Balshaan Singh A/L Malvinder Singh** | Team Member |
| **Wan Mohamad Firdie Adham Bin Wan Hairul Azrie** | Team Member |

### Project Responsibilities

The team organised its development around five work areas:

| Work Area | Responsibility |
|---|---|
| Technical Development | Application integration, backend/frontend implementation and deployment |
| Quotation & Business Logic | Service data, pricing requirements and quotation testing |
| Scheduling & Verification | Workforce availability rules, conflict scenarios and testing |
| UI/UX | Interface design, usability review and responsive experience |
| Documentation & Presentation | Problem research, project documentation, presentation slides and demonstration video |

Individual work-area assignments can be added once the team confirms the final contribution record.

All team members contribute to the project through planning, review, testing and presentation preparation.

---

## 20. Hackathon Submission Materials

The following materials will be linked or included when finalised:

| Deliverable | Status |
|---|---|
| Source Code Repository | Available; public access must be enabled |
| Live Application | Deployed; public access must be verified |
| Preliminary Proposal | To be linked |
| Technical Tools Declaration | To be linked |
| Replit Proof of Use | To be linked |
| Presentation Slides | In preparation |
| Demonstration Video | In preparation |

All submission materials should comply with the latest organiser requirements.

---

## 21. License and Disclaimer

The repository includes an Apache License 2.0.

ORO AI was developed as a student hackathon prototype for SDC Hackathon 2026.

All company, customer, employee, pricing, credit-wallet and scheduling data used in the demonstration are synthetic.

The application is not affiliated with, endorsed by or connected to production Orbyte systems.

ORO AI is not intended for unrestricted commercial or production use without further development, testing, data protection controls and security review.

---

### ORO AI — Don't Just Make Promises. Keep Them.

**Helping service SMEs turn customer enquiries into better-informed, more reliable commitments.**
