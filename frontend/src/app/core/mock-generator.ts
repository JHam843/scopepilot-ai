import { Project, ScopeDocument, UserStory, validateScope } from './models';
const story = (
  id: string,
  role: string,
  goal: string,
  benefit: string,
  phase: UserStory['phase'],
  acceptanceCriteria: string[],
): UserStory => ({ id, role, goal, benefit, phase, acceptanceCriteria });
export function clarifyingQuestions(project: Project, answers = ''): string[] {
  const text = `${project.rawRequest} ${answers}`.toLowerCase();
  const questions: string[] = [];
  if (!/(deadline|timeline|weeks|months)/.test(text))
    questions.push('Is there a target launch date or a delivery constraint?');
  if (!/(budget|usd|mxn|\$)/.test(text))
    questions.push('What budget range is available for the initial release?');
  if (!/(integrat|existing system|provider)/.test(text))
    questions.push('Which existing systems or providers must be integrated?');
  if (!/(role|permission|manager|staff|admin)/.test(text))
    questions.push('Which user roles and permissions are required?');
  questions.push('What observable outcome would make the MVP a success?');
  return questions.slice(0, 10);
}
// Deterministic templates: this function does not call a live AI model.
export function generateMockScope(project: Project, clientAnswers = ''): ScopeDocument {
  const text = `${project.title} ${project.rawRequest}`.toLowerCase();
  let stories: UserStory[];
  if (/(barber|appointment|salon)/.test(text)) {
    stories = [
      story(
        'US-01',
        'customer',
        'choose a service, barber, and available time',
        'I can book without calling the shop',
        'MVP',
        [
          'Only available slots for the chosen service and barber are shown.',
          'A conflicting reservation is rejected and availability is refreshed.',
          'A successful booking displays the appointment details.',
        ],
      ),
      story(
        'US-02',
        'staff member',
        'manage my availability and daily schedule',
        'I can organize appointments',
        'MVP',
        ['Staff can mark unavailable periods.', 'Confirmed bookings appear in the daily schedule.'],
      ),
      story(
        'US-03',
        'customer',
        'receive an appointment reminder',
        'I remember my booking',
        'Phase 2',
        [
          'The reminder channel and timing are confirmed with the client.',
          'Failed delivery is recorded for follow-up.',
        ],
      ),
      story('US-04', 'owner', 'review booking trends', 'I can plan staffing', 'Phase 3', [
        'Reporting shows confirmed and cancelled bookings for a selected period.',
      ]),
    ];
  } else if (/(supplier|approval|vendor)/.test(text)) {
    stories = [
      story(
        'US-01',
        'requester',
        'submit supplier information',
        'a manager can review the supplier',
        'MVP',
        [
          'Required supplier fields are validated before submission.',
          'Each submission receives an identifier and pending status.',
        ],
      ),
      story(
        'US-02',
        'reviewer',
        'approve, reject, or request changes',
        'supplier decisions follow a clear process',
        'MVP',
        [
          'Only authorized reviewers can record a decision.',
          'The decision and explanation appear in the history.',
        ],
      ),
      story(
        'US-03',
        'requester',
        'receive a decision notification',
        'I know the next action to take',
        'Phase 2',
        ['A notification identifies the request and resulting status.'],
      ),
      story(
        'US-04',
        'manager',
        'review approval turnaround',
        'I can identify process delays',
        'Phase 3',
        ['A report groups completed requests by review duration.'],
      ),
    ];
  } else if (/(inventory|stock|warehouse)/.test(text)) {
    stories = [
      story(
        'US-01',
        'staff member',
        'maintain product records',
        'inventory items have consistent information',
        'MVP',
        [
          'Each product has a unique SKU and name.',
          'Duplicate SKUs are rejected with an actionable message.',
        ],
      ),
      story(
        'US-02',
        'staff member',
        'record stock adjustments',
        'available quantities remain accurate',
        'MVP',
        [
          'Adjustments record a reason, timestamp, and responsible user.',
          'Invalid quantities are rejected.',
        ],
      ),
      story(
        'US-03',
        'owner',
        'see low-stock items',
        'I can replenish products on time',
        'Phase 2',
        ['Items below their configured threshold appear in a low-stock list.'],
      ),
      story(
        'US-04',
        'owner',
        'review inventory across locations',
        'I can plan stock distribution',
        'Phase 3',
        ['Stock is displayed per location after multi-location requirements are confirmed.'],
      ),
    ];
  } else {
    stories = [
      story(
        'US-01',
        'primary user',
        'complete the main business workflow',
        'I can accomplish the requested task',
        'MVP',
        [
          'The main workflow is confirmed with the client.',
          'Required input is validated before submission.',
        ],
      ),
      story(
        'US-02',
        'administrator',
        'manage workflow records',
        'I can support day-to-day operations',
        'Phase 2',
        ['Record management permissions are confirmed before implementation.'],
      ),
    ];
  }
  const document: ScopeDocument = {
    schemaVersion: 1,
    summary: `A proposed web application for ${project.clientName}: ${project.title}. This template is a starting point for client review, not an approved scope.`,
    goals: [
      'Make the main workflow accessible on mobile and desktop.',
      'Deliver a focused first release with reviewable acceptance criteria.',
    ],
    functionalRequirements: stories
      .filter((story) => story.phase === 'MVP')
      .map((story) => story.goal),
    nonFunctionalRequirements: [
      'Use accessible labels and keyboard-operable controls.',
      'Validate input on the server and show actionable errors.',
      'Confirm expected traffic and performance targets with the client.',
    ],
    integrations: [
      'No external provider is confirmed. Clarify integrations before implementation.',
    ],
    assumptions: [
      'A responsive web application is the initial delivery platform.',
      'The client will review roles, business rules, and phase assignments.',
    ],
    risks: [
      'Unconfirmed integrations or business rules may change delivery effort.',
      'The requested scope may exceed the available budget or timeline.',
    ],
    questions: clarifyingQuestions(project, clientAnswers),
    stories,
    clientAnswers,
    estimateLow: null,
    estimateHigh: null,
    estimateNotes:
      'Add a reviewed effort range after clarifying the scope. Developer-days are not a calendar commitment.',
  };
  const errors = validateScope(document);
  if (errors.length) throw new Error(errors.join(' '));
  return document;
}
