import { TableRowStates } from "@/components/patterns/TableRowStates";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LAB_TABLE_ROWS, LAB_TEXT } from "@/lib/design-lab/fixtures";
import { MatrixCell } from "./MatrixCell";

const Head = () => (
  <TableHeader>
    <TableRow>
      <TableHead>{LAB_TEXT.fieldLabel}</TableHead>
      <TableHead className="text-right">#</TableHead>
      <TableHead>Статус</TableHead>
    </TableRow>
  </TableHeader>
);

export const TableMatrix = () => (
  <div className="grid gap-3 lg:grid-cols-3">
    <MatrixCell label="Rows">
      <Table>
        <Head />
        <TableBody>
          {LAB_TABLE_ROWS.map((row) => (
            <TableRow key={row.student}>
              <TableCell className="font-medium">{row.student}</TableCell>
              <TableCell className="text-right tabular-nums">{row.score}</TableCell>
              <TableCell>{row.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </MatrixCell>
    <MatrixCell label="Loading">
      <Table>
        <Head />
        <TableBody>
          <TableRowStates kind="loading" columns={3} />
        </TableBody>
      </Table>
    </MatrixCell>
    <MatrixCell label="Empty">
      <Table>
        <Head />
        <TableBody>
          <TableRowStates kind="empty" columns={3} message={LAB_TEXT.tableEmpty} />
        </TableBody>
      </Table>
    </MatrixCell>
  </div>
);
