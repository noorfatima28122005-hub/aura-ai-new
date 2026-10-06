import { Task } from '../types';

/**
 * Exports selected or filtered tasks to an RFC 4180-compliant CSV file.
 * Includes UTF-8 BOM for seamless Microsoft Excel and Google Sheets import.
 */
export function exportTasksToCSV(tasks: Task[], customFilename?: string): { success: boolean; count: number; filename: string } {
  if (!tasks || tasks.length === 0) {
    return { success: false, count: 0, filename: '' };
  }

  const filename =
    customFilename ||
    `aura_deliverables_export_${new Date().toISOString().split('T')[0]}.csv`;

  const headers = [
    'Task ID',
    'Deliverable Title',
    'Project Name',
    'Client Name',
    'Category',
    'Label',
    'Priority',
    'Status',
    'Deadline',
    'Overdue Status',
    'Completed Date',
    'Creation Date',
    'AI Reasoning / Notes',
  ];

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).trim();
    // Escape double quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  };

  const now = Date.now();

  const rows = tasks.map((t) => {
    const isCompleted = t.status === 'Completed';
    const deadlineTime = t.deadline ? new Date(`${t.deadline}T23:59:59`).getTime() : 0;
    const isOverdue = !!t.deadline && !isCompleted && deadlineTime < now;
    const overdueLabel = isCompleted ? 'Completed' : isOverdue ? 'OVERDUE' : 'On Track';

    return [
      escapeCSV(t.id),
      escapeCSV(t.title),
      escapeCSV(t.projectName || 'Unassigned'),
      escapeCSV(t.clientName || 'General'),
      escapeCSV(t.category || 'Routine'),
      escapeCSV(t.label || (t.tags && t.tags[0]) || 'General'),
      escapeCSV(t.priority),
      escapeCSV(t.status),
      escapeCSV(t.deadline || 'No deadline'),
      escapeCSV(overdueLabel),
      escapeCSV(t.completedAt || (isCompleted ? 'Completed' : 'Pending')),
      escapeCSV(t.createdAt || 'N/A'),
      escapeCSV(t.notes || t.description || t.aiCategoryReasoning || ''),
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel respects UTF-8 encoding
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: tasks.length, filename };
}
