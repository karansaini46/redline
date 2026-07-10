# Redline Product Plan

## 1. Pitch
Redline is an AI contract intelligence platform that automatically extracts clauses from uploaded contracts, scores them for risk using rule-based checks and LLM rationales, tracks obligations, and shows exactly what changed between two versions. It replaces manual risk review with a portfolio-wide risk dashboard, semantic search across all contracts, and automatic renewal reminders. By transforming static contracts into active data, Redline empowers legal and ops teams to instantly find critical insights, like every deal with an uncapped liability clause.

## 2. User Stories
### Owner
- As an Owner, I want to manage organization billing and global settings so that my team has uninterrupted access to the platform.
- As an Owner, I want to transfer ownership or delete the organization if the company structure changes.

### Admin
- As an Admin, I want to invite, remove, and manage role assignments (Member, Viewer) for users in my organization so that data access is securely controlled.
- As an Admin, I want to configure custom risk scoring rules and standard playbook clauses so the AI evaluates contracts according to our specific company policies.

### Member
- As a Member, I want to upload new contracts (PDF, DOCX) and receive an automated extraction of clauses and risk scores so I can review them efficiently.
- As a Member, I want to compare different versions of a contract and leave comments on specific clauses to collaborate with my team during negotiations.

### Viewer
- As a Viewer, I want to read parsed contracts, extracted obligations, and risk reports so I can stay informed without accidentally modifying the data.
- As a Viewer, I want to perform semantic search across the entire contract repository to quickly find specific risks, like every deal with an uncapped liability clause.

## 3. Core User Journeys
### Journey 1: Contract Upload & Initial AI Review
1. A Member logs into the platform and navigates to the "Upload" section.
2. They drag and drop a vendor agreement (PDF) into the upload zone.
3. The platform processes the file, utilizing the LLM to extract text, identify key clauses (e.g., Indemnification, Termination), and generate a preliminary risk score using both rule-based checks and an LLM rationale.
4. The Member is notified that processing is complete and clicks into the contract dashboard to view the highlighted risks and extracted metadata.

### Journey 2: Collaborative Review & Commenting
1. A Member reviews a high-risk "Limitation of Liability" clause flagged by the AI.
2. They highlight the clause and add a comment tagging another Member for a second opinion.
3. The tagged Member receives a notification, opens the contract, and replies to the comment with proposed alternative language.
4. The original Member resolves the comment thread once they agree on the redlines to send back to the counterparty.

### Journey 3: Version Comparison
1. After receiving a revised contract from the counterparty, a Member uploads the new version, associating it with the original document record.
2. The platform automatically runs a differential analysis against the previous version.
3. The Member views a side-by-side diff where additions, deletions, and modified risk scores are visually highlighted.
4. The Member approves the changes and marks the contract stage as "Ready for Signature".

### Journey 4: Organization and User Management
1. An Admin navigates to the "Organization Settings" panel.
2. They send an email invitation to a new legal counsel, assigning them the "Member" role.
3. The new user receives the email, completes the signup flow, and joins the organization workspace.
4. The Admin later reviews the audit log to ensure the new user's access levels are correct.

## 4. Data Model Entities

| Entity | Purpose |
| :--- | :--- |
| **Organization** | Represents a tenant/company account that owns workspaces and billing. |
| **User** | Represents an individual account capable of authenticating into the platform. |
| **OrgMembership** | Maps a User to an Organization and defines their Role (Owner, Admin, Member, Viewer). |
| **Contract** | The logical representation of an agreement, acting as a parent container for versions and metadata. |
| **DocumentVersion** | A specific file iteration of a Contract (e.g., v1, v2) containing the raw file reference and parsed text. |
| **ExtractedClause** | A specific section of text identified by the AI (e.g., Termination, Liability) linked to a DocumentVersion. |
| **RiskAssessment** | An AI-generated evaluation tied to a clause or contract, including a severity score and rationale. |
| **Obligation** | A tracked duty or milestone (e.g., renewal date, payment term) extracted from the contract. |
| **Comment** | A user-generated note or discussion thread attached to a specific ExtractedClause or DocumentVersion. |
| **AuditLog** | A record of significant user actions (uploads, role changes, deletions) for compliance and security. |

## 5. Explicit Assumptions
- **Supported File Types**: `.pdf` (text-based and OCR-ready) and `.docx`.
- **Max File Size**: 20 MB per document.
- **LLM Provider**: OpenAI (GPT-4o) via API for text extraction, clause identification, and risk scoring.
- **Risk Severity Levels**:
  - *Low*: Standard boilerplate, aligns with company playbook.
  - *Medium*: Non-standard phrasing, requires manual review but likely acceptable.
  - *High*: Material deviation from standard terms, missing critical protections, or heavily biased toward the counterparty.
  - *Critical*: Deal-breaker terms (e.g., uncapped liability) requiring immediate escalation.

## 6. Out-of-Scope for v1
- E-signature integration (e.g., DocuSign, HelloSign).
- Support for multi-language contracts (English only for v1).
- Complex OCR for heavily degraded or handwritten scanned documents.
- Integration with external CRMs (Salesforce, HubSpot) or ERPs.
- Automated email drafting or negotiation chatbots.
- Custom LLM fine-tuning per organization.

## 7. Open Questions
1. Should we store the original document files in AWS S3 or utilize Supabase Storage?
2. Do we need to support versioning at the clause level, or is document-level versioning sufficient for v1?
3. What is the expected turnaround time for the AI extraction process (e.g., synchronous UI loading state vs. asynchronous email notification)?
4. Will we charge based on per-user seats, or usage-based pricing (per contract parsed)?
