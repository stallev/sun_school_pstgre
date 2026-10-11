import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

type TableRowStatesProps =
  | { kind: "loading"; columns: number; rows?: number }
  | { kind: "empty"; columns: number; message: string };

/** Placeholder rows for tables: skeleton while loading, single message row when empty. */
export const TableRowStates = (props: TableRowStatesProps) => {
  if (props.kind === "empty") {
    return (
      <TableRow>
        <TableCell colSpan={props.columns} className="py-8 text-center text-muted-foreground">
          {props.message}
        </TableCell>
      </TableRow>
    );
  }
  return (
    <>
      {Array.from({ length: props.rows ?? 3 }, (_, row) => (
        <TableRow key={row} aria-hidden="true">
          {Array.from({ length: props.columns }, (_, col) => (
            <TableCell key={col}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};
