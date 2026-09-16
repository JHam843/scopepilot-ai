import { LIST_SECTIONS, ScopeVersion } from './models';
const escape = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\`*_{}\[\]()#+.!|~-])/g, '\\$1');
export function proposalMarkdown(version: ScopeVersion): string {
  const document = version.document;
  const lines = [
    `# ${escape(version.project.title)}`,
    '',
    `Client: ${escape(version.project.clientName)}`,
    `Version: ${version.number}`,
    `Saved: ${version.createdAtUtc}`,
    '',
    '> Created with ScopePilot’s mock workflow. Requirements and estimates require client review.',
    '',
    '## Summary',
    escape(document.summary),
    '',
    '## Original request',
    escape(version.project.rawRequest),
    '',
  ];
  for (const section of LIST_SECTIONS)
    lines.push(
      `## ${section.label}`,
      ...document[section.key].map((item) => `- ${escape(item)}`),
      '',
    );
  lines.push('## User stories', '');
  for (const story of document.stories)
    lines.push(
      `### ${escape(story.id)} · ${story.phase}`,
      `As a ${escape(story.role)}, I want ${escape(story.goal)}, so that ${escape(story.benefit)}.`,
      '',
      ...story.acceptanceCriteria.map((criterion) => `- ${escape(criterion)}`),
      '',
    );
  lines.push(
    '## Client clarification answers',
    escape(document.clientAnswers || 'Not supplied.'),
    '',
    '## Reviewed estimate',
    document.estimateLow === null
      ? 'Not estimated.'
      : `${document.estimateLow}–${document.estimateHigh} developer-days.`,
    escape(document.estimateNotes),
    '',
  );
  return lines.join('\n');
}
export function downloadProposal(version: ScopeVersion): void {
  const url = URL.createObjectURL(
    new Blob([proposalMarkdown(version)], { type: 'text/markdown;charset=utf-8' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${
    version.project.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 70) || 'scope'
  }-v${version.number}.md`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
