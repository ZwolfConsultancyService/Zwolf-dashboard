const colors = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  gray: 'bg-gray-100 text-gray-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}

export const statusColor = (status) => {
  const map = {
    // Project
    'Not Started': 'gray', Planning: 'blue', 'In Progress': 'yellow',
    'On Hold': 'orange', Testing: 'purple', Completed: 'green', Cancelled: 'red',
    // Task
    Todo: 'gray', Review: 'purple', Blocked: 'red',
    // Priority
    Low: 'gray', Medium: 'blue', High: 'orange', Urgent: 'red',
    // Client
    'New Lead': 'gray', Contacted: 'blue', Discussion: 'blue',
    'Proposal Sent': 'purple', Negotiation: 'yellow', Confirmed: 'green',
    'Project Started': 'blue', Lost: 'red',
    // Attendance
    Present: 'green', Absent: 'red', 'Half Day': 'yellow', Leave: 'orange',
    // Roles
    manager: 'purple', sales: 'blue', developer: 'green',
  };
  return map[status] || 'gray';
};