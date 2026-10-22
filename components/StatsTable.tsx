import type { ParseResult } from "@/lib/stats/parseStatsFile";

export function StatsTable({ table }: { table: ParseResult }) {
  if (!table.ok) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th
                key={column}
                className="border-b border-zinc-200 px-2 py-1 text-left font-medium text-black dark:border-zinc-800 dark:text-zinc-50"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {table.columns.map((column) => (
                <td
                  key={column}
                  className="border-b border-zinc-100 px-2 py-1 text-zinc-700 dark:border-zinc-900 dark:text-zinc-300"
                >
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
