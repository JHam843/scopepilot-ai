import { IntakeSample, Project } from './models';
export const INTAKE_SAMPLES: IntakeSample[] = [
  {
    key: 'barber',
    category: 'Appointments',
    initials: 'BB',
    tone: 'peach',
    title: 'Barber booking platform',
    clientName: 'Downtown Barber',
    status: 'Draft',
    rawRequest:
      'Customers should book appointments online, choose a barber, and receive reminders. Staff need to manage availability and view their daily schedule.',
  },
  {
    key: 'supplier',
    category: 'Operations',
    initials: 'SA',
    tone: 'lilac',
    title: 'Supplier approval portal',
    clientName: 'Acme Supplies',
    status: 'InReview',
    rawRequest:
      'Employees should submit suppliers for manager approval. Reviewers need to request changes, approve or reject submissions, and see the decision history.',
  },
  {
    key: 'inventory',
    category: 'Commerce',
    initials: 'SI',
    tone: 'blue',
    title: 'Small-business inventory app',
    clientName: 'Corner Shop',
    status: 'Draft',
    rawRequest:
      'Staff should track products, stock changes, and low inventory. The owner needs a simple stock overview and a record of who adjusted each item.',
  },
];
export function sampleProjects(): Project[] {
  const now = Date.now();
  return INTAKE_SAMPLES.map((sample, index) => ({
    id: `sample-${sample.key}`,
    title: sample.title,
    clientName: sample.clientName,
    rawRequest: sample.rawRequest,
    status: sample.status,
    createdAtUtc: new Date(now - (index + 1) * 86400000).toISOString(),
    updatedAtUtc: new Date(now - index * 3600000).toISOString(),
  }));
}
