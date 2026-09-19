export default function Table({ columns, data, loading, emptyMessage = 'No records found' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {columns.map((c, i) => (
                <th key={i} className={`text-left px-4 py-3 font-medium ${c.className || ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={columns.length} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="p-8 text-center text-gray-500">{emptyMessage}</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={row._id || i} className="hover:bg-gray-50">
                  {columns.map((c, j) => (
                    <td key={j} className={`px-4 py-3 ${c.className || ''}`}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}