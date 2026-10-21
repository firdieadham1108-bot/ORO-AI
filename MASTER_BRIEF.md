MASTER PROJECT BRIEF FOR CLAUDE CODE
SDC Hackathon 2026 — Orbyte QuoteGuard
You are our senior full-stack software engineer, AI development assistant, technical architect, UI/UX developer, and programming mentor.
Your job is to help our team build a REAL, WORKING hackathon prototype—not just UI mockups, slides, or code examples.
Please read this entire brief carefully before coding.

PART 1 — OUR TEAM AND HACKATHON BACKGROUND
We are a team of 5 university students in Malaysia participating in SDC Hackathon 2026.
Our situation:
Five team members.
Only one team member has limited coding experience.
The others are mostly programming beginners.
We have limited time and budget.
We need your help to write, debug, test, and explain the application code.
We must understand what you create because we need to present it to hackathon judges.
Our preferred development platform is Replit.
We also need a GitHub repository showing genuine development progress.
Our preliminary submission is expected around 25 October 2026. We aim to complete the working prototype by 24 October. We will verify the precise official deadline.
Please act as a practical developer working with beginners.
Don't overengineer the product. Prioritise getting a reliable, attractive, working prototype finished.
When creating features, explain briefly what you built, where the relevant code is, and how we can test it.
Do not require us to manually write hundreds of lines of code if you can create them within your coding environment.

PART 2 — THE OFFICIAL HACKATHON CHALLENGE
We selected Domain 2 — Orbyte Smart SME Challenge: Less Busywork, Better Business.
The challenge asks us to design a reliable and easy-to-learn automation product for the Orbyte ecosystem that:
Removes a recurring operational burden for micro and small businesses.
Improves accuracy and consistency.
Keeps humans in control.
Can eventually serve many SMEs.
Our solution should demonstrate the following end-to-end process:
Trigger → Connected Data → Decision Logic → Human Approval → Visible Outcome and Activity Log
Preliminary judging criteria:
Innovation & Creativity: 30%
Problem–Solution Fit: 25%
Feasibility of Build: 25%
Clarity of Proposal: 20%
Our product must not be just another generic AI chatbot.
We want to demonstrate meaningful automation and integration with Orbyte's business ecosystem.
Relevant Orbyte concepts include:
Orbyte People / eLeave: Employee leave records.
Orbyte People / Directory: Employee profiles.
Orbyte Work: Jobs, tasks, and assignments.
Orbyte Connect: Connections between modules and external services.
Approval workflows and permissions.
Activity logs.
IMPORTANT: We currently do not have confirmed access to production Orbyte APIs.
Use clearly labelled MOCK integrations and SYNTHETIC company data.
Do not pretend the application is connected to the real Orbyte system.

PART 3 — WHAT HAPPENED DURING OUR IDEA DEVELOPMENT
Initially, we considered building an AI quotation generator for service businesses.
The original idea was:
A technician or customer sends a WhatsApp message or voice note requesting a service. The AI understands the message, extracts the required information, and produces a quotation automatically.
One teammate proposed a Voice-to-Quote system.
Example:
"Boss, client at Cheras Condo wants servicing for two 1.5HP aircons and a chemical wash."
The system would:
Convert voice to text.
Extract the service details.
Check the company's price list.
Generate a quotation.
Ask a manager to approve it.
Save the quotation and activity record.
However, we realised AI quotation generators and business scheduling systems already exist.
A simple quotation generator may not be innovative enough for a hackathon.
We therefore developed a more distinctive concept called Orbyte QuoteGuard.
Instead of focusing only on creating quotations, QuoteGuard will check whether the business can actually fulfil what it promises to customers.
For example:
A salesperson promises an installation date without knowing that a technician is on leave or already assigned to another job.
The company might accidentally double-book its employees or disappoint customers.
Another problem happens AFTER the company makes its promise.
A technician might suddenly take emergency leave, making an accepted appointment impossible to fulfil.
Our original full QuoteGuard concept included:
Checking if a requested service date is feasible.
Identifying employee leave and overlapping jobs.
Recommending safer appointment dates.
Creating quotations using approved company prices.
Requiring human approval.
Temporarily reserving capacity.
Monitoring commitments when employee availability changes.
Detecting commitments that are at risk.
Recommending replacement technicians or alternative dates.
Recording every important action.
Because our team has very limited coding experience and a short deadline, we decided on a smaller preliminary prototype:
Orbyte QuoteGuard Lite — Voice-Assisted Quotation with Smart Availability Checking.
The first release must work reliably before we attempt the more advanced features.

PART 4 — OUR PRODUCT IDENTITY
Product name: Orbyte QuoteGuard
Prototype version: QuoteGuard Lite
Tagline: "Don't just make promises. Keep them."
Target users:
Small air-conditioning installation businesses.
Maintenance and repair companies.
Small contractors.
Other appointment-based service SMEs.
For the hackathon, focus specifically on a fictional Malaysian air-conditioning service company.
Core Problem
Small service businesses often handle customer enquiries through WhatsApp and prepare quotations manually.
Before promising a service date, staff may need to check:
Employee availability.
Approved leave.
Current work assignments.
Required technician skills.
Service prices.
Existing customer appointments.
These records are often disconnected.
This creates duplicated work, delayed quotations, incorrect appointments, and promises the business cannot fulfil.
Proposed Solution
QuoteGuard receives a customer service enquiry, turns it into structured job requirements, calculates the quotation from an approved price list, and checks the business's actual staffing availability before recommending an appointment.
A manager reviews and approves the quotation and appointment.
All important actions are recorded.
The advanced version detects changes after approval and recommends recovery actions.

PART 5 — WHAT WE WANT YOU TO BUILD
We want TWO user experiences supported by ONE shared codebase:
A. Responsive Website
A professional dashboard accessible through a web browser on laptops and desktops.
Primary users:
Business owner.
Manager.
Salesperson.
B. Mobile App-Like Experience
An installable Progressive Web App (PWA) that works on compatible smartphones.
Primary users:
Field technician.
Business owner on the move.
The mobile version should support the same backend and database as the website.
Use responsive layouts and touch-friendly controls.
Do not build separate native Android and iOS applications for the preliminary round.
If the PWA implementation would delay the working core features, finish the responsive website first and add installation support afterwards.
Our judges should be able to open the app through a URL without installing anything.

PART 6 — RECOMMENDED TECHNOLOGY
Choose the simplest maintainable architecture suitable for Replit.
Preferred stack:
Frontend:
React.
Vite.
Tailwind CSS.
Backend:
Node.js.
Express.
Database:
SQLite for local development, with an appropriate persistent storage strategy for the deployed version.
Other tools:
GitHub for version control.
PWA manifest and service worker where useful.
Optional AI API for interpreting unstructured enquiries.
Optional speech-to-text integration for audio input.
Use ordinary deterministic business rules for:
Price calculations.
Leave checking.
Employee availability.
Skill requirements.
Overlapping bookings.
Appointment recommendations.
Do not let an LLM invent staffing availability, prices, or confirmed bookings.
If a paid API is required, explain the cost before introducing it.
Never hardcode private API keys into the frontend or repository.
If you discover a significantly simpler technical approach, explain why and use it if it still meets the project's requirements.

PART 7 — FICTIONAL BUSINESS SCENARIO
Create synthetic data for:
Company: CoolAir Services Sdn Bhd
Location: Cheras, Kuala Lumpur, Malaysia.
The business has approximately 12 employees, but only a small subset needs to appear in the MVP demonstration.
Main Customer Enquiry
A customer sends:
"Boss, can you install 6 units of 1.5HP aircon at our Cheras office this Friday? Send quote please."
For the seeded demonstration:
Requested date: Friday, 23 October 2026.
Job location: Cheras.
Service: Air-conditioning installation.
Quantity: 6 units.
Specification: 1.5HP.
Installation labour price: RM190 per unit.
Total quoted installation labour: RM1,140.
This is an illustrative company price, not a universal Malaysian market rate.
For the example, the installation requires:
Two qualified technicians.
An eight-hour appointment window.
At least one senior installation technician.
These requirements are fictional demo business rules, not universal installation standards.
Employee Data
Create the following employees:
Ali
Senior installation technician.
Approved leave on Friday, 23 October.
Available on Monday, 26 October.
Bala
Senior installation technician.
Already assigned to a Taman Desa installation on Friday, 23 October.
Initially available on Monday, 26 October.
Later submits emergency leave for Monday during the advanced demo.
Mei
Qualified installation technician.
Has an existing Friday assignment.
Available on Monday.
Chong
Senior installation technician, qualified for the demo installation.
Has an existing Friday assignment.
Available on Monday.
Can potentially replace Bala if Bala takes Monday emergency leave.
Faizal
Business manager.
Responsible for quotation approvals and scheduling decisions.
Add suitable sample company data to ensure Friday genuinely has insufficient qualified capacity.
Monday should initially be feasible with Bala and Mei.
Do not invent availability dynamically or hardcode "Friday unavailable" in the frontend.
Availability must be calculated from the database.

PART 8 — CORE MVP FEATURES (MUST BUILD)
Feature 1: Dashboard
Create a clean and easy-to-understand dashboard.
Include:
Total customer enquiries.
Pending quotations.
Approved quotations.
Upcoming appointments.
Scheduling conflicts.
Recent activity.
Use real data from our prototype database.
Do not show meaningless random statistics.
Add navigation to other pages.
Feature 2: Customer Enquiry Input
Create a page where a salesperson can type or paste a WhatsApp-style customer message.
Example:
"Can install 6 units 1.5HP at Cheras this Friday?"
Provide an "Analyse Enquiry" button.
The system extracts:
Service type.
Quantity.
Air-conditioning specification.
Requested date.
Job location.
Any missing information.
Display the extracted information in editable fields.
If the request is incomplete, ask for clarification.
Start with reliable parsing of the seeded demo scenarios.
Add an LLM API only if it improves the result without making the application unreliable.
For relative dates such as "Friday", resolve them using a clear reference date. The seeded historical demonstration must use a fixed simulation reference date so it works after the hackathon.
Feature 3: Service Price List
Create a simple service catalogue stored in the backend or database.
Example prices:
1.0HP installation: RM160 per unit.
1.5HP installation: RM190 per unit.
Standard air-conditioning service: RM80 per unit.
Chemical wash: RM150 per unit.
All prices are synthetic demo data.
For the example job:
6 × RM190 = RM1,140.
Prices must be calculated programmatically.
If the user changes the quantity or service, the total must update correctly.
Feature 4: Employee Availability Checker
This is our MAIN DIFFERENTIATING FEATURE.
When a requested date is entered, the system checks:
Approved employee leave.
Existing work assignments.
Appointment time overlaps.
Required employee skills.
Minimum crew requirements.
Working hours.
Existing confirmed commitments.
It then decides whether a suitable crew can complete the work.
For Friday, 23 October:
The system should determine that there is insufficient available qualified capacity.
Display an explanation such as:
"Friday is not feasible because Ali is on approved leave, Bala has an existing assignment, and the remaining qualified crew is insufficient."
For Monday, 26 October:
The system should identify Bala and Mei as a suitable crew.
The recommendation must be derived from actual records.
If the availability information is missing or incomplete, display "Needs Verification" rather than incorrectly claiming a date is available.
Also display references to the simulated leave and booking records supporting the decision.
Feature 5: Alternative Appointment Recommendation
If the customer's requested date is not feasible:
Search for the next available dates within a reasonable configurable period.
Return feasible alternatives.
Example:
Requested:
Friday — Conflict.
Recommended:
Monday — Feasible.
Display:
Proposed date.
Available crew.
Explanation.
Appointment duration.
Any known constraints.
Allow the manager to select a date.
Avoid double-booking employees.
Feature 6: Quotation Preview
Generate a professional quotation preview.
Include:
Company name.
Quotation ID.
Customer name.
Job location.
Service description.
Quantity.
Unit price.
Total price.
Proposed appointment date.
Quotation status.
The manager should be able to review the quotation before approving it.
If generating a PDF is quick and reliable, implement a downloadable PDF.
Otherwise, a printable quotation page is acceptable initially.
Do not send real customer messages or payment requests.
Feature 7: Manager Approval
Provide a functional "Approve Quotation" action.
When clicked:
Validate the selected date again.
Confirm that the crew is still available.
Save the quotation approval.
Record the responsible approver.
Record the selected appointment date.
Create an appropriate pending reservation or commitment record.
Write the action into the activity log.
The application should simulate two roles:
Salesperson: Can create and review draft enquiries.
Manager: Can approve quotations and scheduling changes.
For the MVP, a clearly labelled demo role switch is acceptable.
Do not claim this is production-grade authentication.
Feature 8: Activity Log
Create an activity history page.
Record:
Enquiry created.
Enquiry analysed.
Price calculated.
Scheduling conflict detected.
Alternative date suggested.
Quotation approved.
Appointment reserved.
Any later changes.
Store meaningful records in the database.
The activity log should not be merely decorative.

PART 9 — OPTIONAL FEATURES (ONLY AFTER THE CORE WORKS)
Optional A: Voice-to-Quote
Allow the technician to upload or record a short audio message.
Example:
"Boss, client at Cheras wants two aircon servicing and one chemical wash."
Convert speech to text.
Run the resulting text through the SAME enquiry extraction and quotation workflow.
Display the transcription for correction before quotation generation.
If audio transcription requires a paid service, tell us the cost and provide a text-input fallback.
Do not spend excessive time building an actual WhatsApp Business integration.
Optional B: PWA Installation
Add:
Web app manifest.
Application icons.
Mobile-responsive experience.
Installable home-screen experience on supported browsers.
Keep the app online-first.
Do not pretend offline edits will work unless they are actually implemented.
Optional C: Commitment Risk Monitoring
This is the most distinctive feature of the original QuoteGuard concept.
Simulate an Orbyte eLeave approval after a quotation has been approved.
Example:
Bala was assigned to the Monday, 26 October installation.
Later, Bala's emergency leave for Monday is approved.
The system should:
Update Bala's leave status.
Find appointments involving Bala that overlap with the leave.
Re-evaluate affected commitments.
Mark the affected job "At Risk".
Display an alert.
The leave approval itself must not be blocked by QuoteGuard.
Optional D: Intelligent Recovery
When a job becomes at risk:
Search for a qualified replacement technician.
Check the replacement's leave, skills, working hours, and existing bookings.
Reject replacements who would create another scheduling conflict.
Recommend safe alternatives.
Require manager approval before changing the schedule.
Recheck capacity at final confirmation.
Record everything in the activity log.
For the example scenario, Chong may replace Bala if the database confirms that he is available.
If there is no suitable replacement, recommend a new date and require customer agreement.
Avoid disrupting another customer simply to resolve one booking.
Important priority: Do not sacrifice the completed core MVP to implement these optional features.

PART 10 — REQUIRED PAGES
Please create the following pages or sections.
1. Dashboard
Business overview, quotation counts, upcoming appointments, and any detected conflicts.
2. New Enquiry
Input message, extract information, and review details.
3. Quotation & Availability
Service price, appointment availability, recommended date, and quotation preview.
4. Staff Schedule
Employee list, approved leave, existing appointments, and a simple way to inspect the schedule.
5. Manager Approval
Pending quotations, approval actions, and selected dates.
6. Activity Log
A chronological record of significant actions.
If the advanced monitoring feature is implemented, add:
7. Risk Monitor
At-risk commitments, explanations, and recommended recovery options.
For mobile users, organise these pages into a simple navigation menu.

PART 11 — USER INTERFACE DESIGN
We want the product to look like a realistic modern SaaS business application.
Design preferences:
Professional and clean.
Easy to learn.
Responsive desktop and mobile layouts.
Clear information hierarchy.
Readable typography.
Avoid overwhelming the user with too many buttons.
Consistent icons and spacing.
Green for verified feasible appointments.
Red for conflicts.
Amber for warnings or missing data.
Accessible labels and visible error messages.
Possible design inspiration:
Linear.
Notion.
Modern business operations dashboards.
Do not copy another company's branding or interface exactly.
The product should feel like a lightweight addition to the Orbyte ecosystem.
Use the name "Orbyte QuoteGuard" while clearly labelling integrations as simulated.
Do not invent an official Orbyte logo.

PART 12 — DATABASE REQUIREMENTS
Create appropriate tables or collections for:
Employees.
Employee skills.
Leave requests.
Existing job assignments.
Service prices.
Customer enquiries.
Quotations.
Commitments and assigned crew.
Temporary reservations, if implemented.
Activity logs.
A compact, properly normalised database structure is preferred.
Important technical rules:
Keep quotation status separate from scheduling risk status.
Use actual datetime overlap calculations rather than comparing only calendar dates.
Do not create overlapping confirmed appointments for the same technician.
Revalidate availability before confirming a booking.
Use database transactions to prevent conflicting confirmations.
Do not use stale or missing data to claim an appointment is feasible.
Clearly distinguish confirmed bookings from temporary reservations.
If implementing reservations, give capacity holds their own expiry independent of quotation price validity.
Provide a reliable "Reset Demo Data" function for hackathon rehearsals.

PART 13 — REAL ORBYTE INTEGRATION VS MOCK INTEGRATION
We do not currently have verified credentials or technical documentation for connecting to live Orbyte services.
For this MVP, simulate Orbyte integrations using local database records and clearly named service adapters.
For example:
MockOrbytePeopleAdapter.
MockOrbyteLeaveAdapter.
MockOrbyteWorkAdapter.
MockOrbyteApprovalAdapter.
These should return realistic synthetic records.
Keep the integration layer separate from the core business logic so actual Orbyte APIs could potentially replace the mocks later.
Mark the UI as:
"Demo Environment — Simulated Orbyte Data."
Do not claim the prototype sends real tasks to Orbyte or real messages to WhatsApp.

PART 14 — DEVELOPMENT ORDER
Do not implement everything in one enormous untested change.
Develop in phases.
PHASE 1 — Project Setup
Inspect the existing project directory, if any.
Create a working Replit-compatible project.
Set up the frontend and backend.
Create the database.
Add synthetic staff and service data.
Confirm the development server starts.
Explain how to launch it.
PHASE 2 — Working Quotation
Create the enquiry form.
Extract structured service details.
Read the service price list.
Calculate totals correctly.
Display a quotation preview.
Test the sample:
6 × RM190 = RM1,140.
PHASE 3 — Working Availability Checker
Add employee leave records.
Add existing jobs.
Implement overlap detection.
Implement skill and crew checks.
Check the requested appointment.
Suggest another feasible date.
Test that Friday is rejected and Monday is recommended because of the data.
PHASE 4 — Human Approval and Logging
Add manager approval.
Save approvals and quotations.
Prevent conflicting bookings.
Add activity log records.
Build a complete demonstration journey.
STOP HERE AND VERIFY THAT EVERYTHING WORKS.
This is the minimum successful hackathon prototype.
PHASE 5 — Interface Improvements
Improve:
Dashboard layout.
Mobile responsiveness.
Navigation.
Loading states.
Error messages.
Quotation formatting.
PHASE 6 — Optional Enhancements
Only if sufficient time remains:
Voice input.
PWA installation.
Simulated leave-change monitoring.
Recovery recommendations.
Prioritise stability over feature count.

PART 15 — ACCEPTANCE TESTS
We need a real prototype, not a predetermined animated demonstration.
Create and run tests for these scenarios.
Test 1 — Correct quotation
Input: Six units of 1.5HP installation.
Expected result: RM1,140.
Test 2 — Different quantity
Input: Four units of 1.5HP installation.
Expected result: RM760.
Test 3 — Unavailable date
Input: Request for Friday, 23 October 2026.
Expected result: The system detects insufficient qualified capacity and explains the relevant leave and booking conflicts.
Test 4 — Available alternative
Expected result: The system recommends Monday, 26 October with a suitable crew.
Test 5 — Data changes
Change an employee's leave record or existing appointment.
Expected result: Availability recommendations recalculate instead of repeating hardcoded text.
Test 6 — Missing information
Input: "Can you install aircon?"
Expected result: System requests missing details instead of inventing a confident quotation.
Test 7 — Approval
Manager approves a feasible quotation.
Expected result: The database saves the approval, reservation/commitment, and audit record.
Test 8 — Double-booking
Try to confirm another overlapping appointment for a reserved or booked technician.
Expected result: The system prevents conflicting confirmation or requires a new available crew.
Test 9 — Optional leave-change detection
Approve Bala's emergency leave after Monday's commitment has been created.
Expected result: The system flags the affected commitment as at risk.
Test 10 — Optional recovery
Expected result: The system finds a suitable replacement if one is available, rejects overlapping assignments, and requires approval.
For each test, report:
PASS or FAIL.
What was tested.
What the actual result was.
Any remaining bugs.
Never claim that a test passed unless you actually ran it.

PART 16 — GITHUB, REPLIT, AND DEPLOYMENT
Our hackathon expects a GitHub repository and development progress.
Please:
Set up a Git repository if one does not exist.
Create a proper .gitignore.
Include a README.md.
Explain what the app does.
Explain the technology stack.
Document how to install and run it.
Document the demo steps.
Record that all business data is synthetic.
Commit meaningful milestones as development progresses.
Help us push to GitHub if the environment is authenticated and we authorise the push.
Ensure the application runs within Replit.
Prepare the application for accessible web deployment.
If you cannot directly access GitHub or Replit deployment settings, explain the exact steps we must complete ourselves.
Do not claim a deployment or GitHub upload succeeded unless it actually did.
Never publish secrets or API keys.

PART 17 — WHAT NOT TO BUILD YET
Avoid:
Real payment processing.
Real bank connections.
Payroll.
Full inventory management.
Real WhatsApp Business automation.
Native iOS and Android apps.
Complex route optimisation.
Advanced accounting.
Real customer personal data.
Production Orbyte integrations without actual API documentation.
Complicated AI agent frameworks that are unnecessary for the core features.
We need one complete and understandable workflow, not an enterprise platform.

PART 18 — YOUR ROLE AS OUR CODING MENTOR
Assume we know very little programming.
When you finish a development step:
Tell us what you built.
Tell us which buttons or pages to open.
Explain how we can confirm it works.
Explain any error we need to fix.
Explain the next development step.
Use simple English.
Avoid unnecessary technical terminology.
If you encounter an error, attempt to diagnose and fix it, then test again.
If a tool, API, or deployment service requires payment, tell us before adding it.
Use your coding tools to edit actual project files and run the application.
Do not merely print large code snippets for us to copy manually unless filesystem access is unavailable.

PART 19 — FIRST RESPONSE AND IMMEDIATE ACTION
Please start by doing the following:
Step 1: Summarise your understanding of QuoteGuard in simple English.
Step 2: Explain the smallest working prototype we should build for the preliminary round.
Step 3: Inspect the existing repository or working folder. If it is empty, initialise the project.
Step 4: Propose a simple technical architecture.
Step 5: Create an implementation checklist and development plan.
Step 6: Start building PHASE 1 immediately, if you have access to the working directory.
Step 7: Run the app and report the actual result.
Do not spend the entire session only writing a plan.
We want you to make real development progress.
You may ask a question if an essential detail is missing or if access credentials are required, but otherwise use reasonable defaults.
Our priorities, in order, are:
Working quotation generation.
Real employee availability checking.
Alternative date recommendations.
Manager approval.
Activity history.
Responsive design.
Optional voice input and mobile installation.
Optional commitment monitoring and recovery.
Our final objective:
Build a working and understandable Orbyte QuoteGuard prototype that demonstrates how small service businesses can create accurate quotations and avoid promising appointment dates they cannot fulfil.
Tagline:
"Don't just make promises. Keep them."
Start by checking the project environment and begin Phase 1. Change QuoteGuard name into ORO AI