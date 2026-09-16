# ScopePilot AI

**Turn a rough client request into a scope you can review, refine, and share.**

ScopePilot AI is a full-stack portfolio application built with **Angular, TypeScript, C#, and ASP.NET Core**. It models the work that happens before implementation: understanding a request, identifying assumptions, writing user stories, defining acceptance criteria, and organizing delivery phases.

The current version combines a working .NET project API with a **clearly labeled mock scope generator**. You can explore the complete frontend workflow without an AI API key. Live AI integration is a planned extension.

## Features

- **Project dashboard:** browse recent projects, search by project or client, and filter by Draft, In review, or Final status.
- **Guided intake:** capture project details, the client request, intended users, integrations, and constraints in three steps.
- **Structured scopes:** review a summary, goals, functional and non-functional requirements, integrations, assumptions, risks, and open questions.
- **Editable user stories:** write stories in the “As a…, I want…, so that…” format and define their acceptance criteria.
- **Phased delivery:** assign stories to MVP, Phase 2, or Phase 3 and enter a reviewed effort range in developer-days.
- **Clarification workflow:** generate rule-based questions about missing details and record client answers.
- **Drafts and version history:** save an editable draft, create immutable snapshots, and compare two saved versions side by side.
- **Proposal export:** preview and download a selected saved version as Markdown.
- **Sample workspace:** explore barber booking, supplier approval, and small-business inventory examples without starting the backend.
- **Responsive forms:** use the application on desktop or mobile, with validation, loading states, error messages, and unsaved-change protection.

## Technology stack

| Area                  | Technologies                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Frontend              | Angular 22, TypeScript 6, standalone components, signals, reactive forms, Angular Router |
| Styling               | SCSS, responsive layouts, keyboard-focus styles                                          |
| API communication     | Angular HttpClient, RxJS, development proxy                                              |
| Backend               | C#, .NET 10, ASP.NET Core Web API, controllers, dependency injection                     |
| Database              | SQLite, Entity Framework Core 10, migrations, seed data                                  |
| Frontend verification | Vitest, Angular HTTP testing utilities, Playwright                                       |
| Development tools     | Git, npm, .NET CLI, Visual Studio Code                                                   |

## Architecture and current implementation

The Angular application handles intake, editing, navigation, previews, and exports. In **.NET API** mode, it sends project requests to the ASP.NET Core API, which validates input and persists project records through EF Core to SQLite.

Scope documents and version snapshots currently live in browser storage. They are separate from the project records stored by the API.

| Capability                                | Current implementation                                   |
| ----------------------------------------- | -------------------------------------------------------- |
| Project metadata in .NET API mode         | ASP.NET Core API and SQLite                              |
| Project metadata in Sample workspace mode | Browser localStorage                                     |
| Scope generation                          | Deterministic templates selected from the project text   |
| Clarifying questions                      | Local keyword rules; suggestions require review          |
| Scope drafts and versions                 | Browser localStorage, separated by workspace and project |
| Effort estimate                           | Manually entered and reviewed by the user                |
| Version comparison                        | Two saved snapshots displayed side by side               |
| Proposal export                           | Markdown generated from a selected saved snapshot        |

An API failure remains visible until the user explicitly selects the sample workspace. The application does not silently switch where it saves project data.

Browser data belongs to a particular browser profile and origin. Clearing it removes local drafts and versions; using another browser or computer does not transfer them. Export important versions as Markdown.

## Repository layout

Keep this README at the repository root, beside `frontend` and `backend`.

| Location                               | Responsibility                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `frontend/`                            | Angular application, dependencies, and build configuration                   |
| `frontend/src/app/core/`               | Models, API services, storage, mock generation, export, and navigation guard |
| `frontend/src/app/features/dashboard/` | Project list, search, status filters, and examples                           |
| `frontend/src/app/features/intake/`    | Multi-step project intake                                                    |
| `frontend/src/app/features/editor/`    | Scope editor, stories, phases, questions, and proposal tab                   |
| `frontend/src/app/features/versions/`  | Version list and comparison                                                  |
| `frontend/src/app/shared/`             | Reusable proposal preview                                                    |
| `frontend/e2e/`                        | Playwright workflow tests                                                    |
| `backend/ScopePilot.Api/Controllers/`  | HTTP endpoints                                                               |
| `backend/ScopePilot.Api/Contracts/`    | Request DTOs and server-side validation                                      |
| `backend/ScopePilot.Api/Models/`       | Persisted project model                                                      |
| `backend/ScopePilot.Api/Data/`         | EF Core database context and sample seeding                                  |
| `backend/ScopePilot.Api/Migrations/`   | Database schema migrations                                                   |
| `docs/`                                | Frontend walkthrough, decision log, and screenshots                          |

## Run locally

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
- [Node.js](https://nodejs.org/en/download): version **24.15.0 or later within the 24.x release line**
- npm, included with Node.js
- Git and an editor such as Visual Studio Code

The frontend was built with Node.js 24.19.0. Its dependencies are recorded in `frontend/package-lock.json`. The backend guide uses matching EF Core SQLite, design, and local `dotnet-ef` versions of 10.0.12; restore the versions recorded in the repository.

No global Angular installation, separate database server, or AI API key is required. The commands below use Windows PowerShell and assume the repository is located at `$env:USERPROFILE\source\scopepilot-ai`. Adjust that path if necessary. On macOS or Linux, use the equivalent paths and `npm` / `npx` instead of `npm.cmd` / `npx.cmd`.

### 1. Restore and build the backend

**Terminal 1 — working directory: `backend/ScopePilot.Api`**

```powershell
Set-Location "$env:USERPROFILE\source\scopepilot-ai\backend\ScopePilot.Api"
dotnet restore
dotnet tool restore
dotnet build
```

The repository should contain the initial EF Core migration. If you are following the backend tutorial from scratch and the `Migrations` folder does not exist yet, create it once before the next step.

**Terminal 1 — same directory; only if the initial migration has not been created:**

```powershell
dotnet ef migrations add InitialCreate
```

### 2. Prepare the database and run the API

**Terminal 1 — working directory: `backend/ScopePilot.Api`**

```powershell
dotnet ef database update
dotnet run --no-launch-profile --urls http://127.0.0.1:5050
```

EF Core creates the local `scopepilot.db` database. On startup, the API inserts the three sample projects if the project table is empty. Apply migrations before starting the API; startup seeds data but does not apply migrations automatically.

Keep this terminal running. Open [the API status endpoint](http://127.0.0.1:5050/) or [the projects endpoint](http://127.0.0.1:5050/api/projects) to check the response.

Commit migrations to Git so another developer can recreate the schema. Keep the generated SQLite database and build output out of version control.

### 3. Install and start the frontend

**Terminal 2 — working directory: `frontend`**

```powershell
Set-Location "$env:USERPROFILE\source\scopepilot-ai\frontend"
npm.cmd ci
npm.cmd start
```

Open **[http://127.0.0.1:4200](http://127.0.0.1:4200)** after Angular finishes its initial build. Keep both terminals open. To explore the frontend alone, select **Sample workspace** in the top bar; that mode does not require the API.

The `npm.cmd` form avoids the common PowerShell execution-policy error for `npm.ps1`. Use the same browser address consistently: `localhost:4200` and `127.0.0.1:4200` have separate localStorage.

### Development proxy

`frontend/proxy.conf.json` forwards `/api/**` requests from Angular on port 4200 to the .NET API on port 5050. If you change the backend port, update the proxy target and restart Angular.

This proxy is a development setting. A production deployment needs appropriate API routing and an `index.html` fallback for Angular routes.

## Walk through the application

1. Select **.NET API** with the backend running, or choose **Sample workspace**.
2. Create a scope, or start from one of the three example cards.
3. Complete the intake and create the project.
4. Generate a mock scope and review its requirements and assumptions.
5. Edit stories and acceptance criteria; assign their delivery phases.
6. Add clarification answers and an optional reviewed effort estimate.
7. Choose **Save draft** to retain your current editable scope in this browser.
8. Choose **Save version** to capture a fixed snapshot of the scope and saved project metadata.
9. Make another edit, save a second version, and compare the two in **Version history**.
10. Open **Proposal** or select a version from history to download Markdown.

Project metadata and scope content have separate save actions. After changing the original request, title, client, or status, choose **Save project details** before creating a version snapshot. Saving a draft does not create a numbered version, and exports use saved snapshots rather than unsaved editor content.

## Backend API

Base address for local development: `http://127.0.0.1:5050`.

| Method | Endpoint             | Result                                        |
| ------ | -------------------- | --------------------------------------------- |
| GET    | `/`                  | Application name and running status           |
| GET    | `/api/projects`      | Project list                                  |
| GET    | `/api/projects/{id}` | Project record, or 404 when absent            |
| POST   | `/api/projects`      | 201 with the created project                  |
| PUT    | `/api/projects/{id}` | 204 with no response body, or 404 when absent |

Project IDs are GUIDs. Create and update requests use the same validated fields:

| Field        | Validation                      |
| ------------ | ------------------------------- |
| `title`      | Required, 3–120 characters      |
| `clientName` | Required, up to 120 characters  |
| `rawRequest` | Required, 10–6,000 characters   |
| `status`     | `Draft`, `InReview`, or `Final` |

Returned project records also include `id`, `createdAtUtc`, and `updatedAtUtc`. ASP.NET Core validates request DTOs and returns validation errors for invalid input. After a successful PUT, the frontend fetches the project again because the update response has no body.

## Build and verification

**PowerShell — working directory: `frontend`**

```powershell
npm.cmd run build
npm.cmd test -- --watch=false
```

The production frontend is written to `frontend/dist/scopepilot-web/browser`. A build does not start a web server; use `npm.cmd start` for local development.

For browser tests, install Chromium once and run Playwright:

**PowerShell — working directory: `frontend`**

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The frontend implementation passed its production build, **eight unit/contract tests**, and **four Chromium workflow tests**. Coverage includes:

- Valid generated documents, complete criteria, and estimate ordering.
- Snapshot isolation, export escaping, and recovery from damaged stored data.
- The backend's empty PUT response contract.
- Intake validation, editing, saved-version persistence, and selected-version downloads.
- Explicit handling of API failure, unsaved-change protection, and a narrow viewport.

API behavior in these tests uses mocked HTTP responses; the checks do not start or verify the actual C# server. To check the real integration, run both applications, create a project in **.NET API** mode, update its details, and reload to confirm persistence. Stop the API and refresh the dashboard to check the failure state.

## Implementation decisions

- **Structured output:** typed scope documents and runtime validation make editing, versioning, and exporting predictable. They do not guarantee that suggested requirements are correct, so client review remains part of the workflow.
- **Small, feature-oriented frontend:** standalone components, services, reactive forms, signals, and lazy routes keep the application understandable without a global state library.
- **Explicit mock generation:** deterministic examples let reviewers explore the product without paid credentials or a live model.
- **Immutable snapshots:** saved versions deep-copy the project and scope together, preserving the proposal as it was reviewed.
- **Incremental backend integration:** project metadata already uses .NET and SQLite; browser scope storage can be replaced when scope and version endpoints are added.

The [decision log](docs/decisions.md) explains these tradeoffs in more detail.

## Current boundaries and next steps

ScopePilot currently supports a local portfolio workflow. Live AI generation, backend storage for scope documents and versions, user authentication, and shared-workspace access are not implemented. Proposal export is Markdown; PDF export is a possible later addition.

Frontend limits constrain the demo: 20 sample projects, 20 versions per project, 20 stories per scope, and five mock-generation requests per minute within an editor session. These are browser-level limits, not server-enforced usage controls.

Planned increments:

- Persist scope drafts and immutable versions through the .NET API.
- Add a server-side AI generation endpoint with validated structured output.
- Enforce generation quotas and keep provider credentials on the server.
- Define visitor or user isolation before exposing a writable public API.
- Add backend integration tests and continuous integration.
- Publish a hosted demonstration with a deliberate demo-data policy.

## Troubleshooting

| Problem                                     | Check                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Browser refuses the connection on port 4200 | Run `npm.cmd start` inside `frontend`, wait for the local URL, and leave the terminal open |
| API is unavailable                          | Check the backend terminal, port 5050, and `frontend/proxy.conf.json`                      |
| SQLite reports a missing Projects table     | Run `dotnet ef database update` in the backend folder before starting the API              |
| npm cannot find `package.json`              | Run the command in `frontend`; avoid an extra nested `frontend/frontend` folder            |
| PowerShell blocks `npm.ps1`                 | Use `npm.cmd` and `npx.cmd` as shown above                                                 |
| A local port is already in use              | Use the existing development server or stop its terminal before starting another instance  |
| A proposal misses a recent change           | Save a new version before exporting                                                        |
| Drafts are missing in another browser       | Browser storage is local to the profile, origin, and selected workspace                    |

## Screenshots and documentation

The repository includes screenshots of the [intake](docs/screenshots/intake.png), [generated scope](docs/screenshots/generated-scope.png), [story editor](docs/screenshots/stories.png), [proposal preview](docs/screenshots/proposal.png), [version comparison](docs/screenshots/versions.png), and [mobile dashboard](docs/screenshots/mobile-dashboard.png).

For setup explanations and the complete source walkthrough with exact file locations, see the [frontend beginner guide](docs/frontend-beginner-guide.md).
