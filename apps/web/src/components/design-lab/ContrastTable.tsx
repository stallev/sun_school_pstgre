import { CONTRAST_PAIRS, contrastRatio } from "@/lib/design-lab/tokens";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** UX-03 §5 table; the ratio is recomputed from the token hex values and checked against the doc. */
export const ContrastTable = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Text / background</TableHead>
        <TableHead>Usage</TableHead>
        <TableHead className="text-right">UX-03</TableHead>
        <TableHead className="text-right">Computed</TableHead>
        <TableHead>Verdict</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {CONTRAST_PAIRS.map((pair) => {
        const computed = contrastRatio(pair.fg.hex, pair.bg.hex);
        const passes = computed >= pair.required;
        const matches = Math.abs(computed - pair.documented) < 0.05;
        return (
          <TableRow key={`${pair.fg.name}-${pair.bg.name}`}>
            <TableCell className="font-medium">
              {pair.fg.name} / {pair.bg.name}
            </TableCell>
            <TableCell className="text-ink-2">{pair.usage}</TableCell>
            <TableCell className="text-right tabular-nums">{pair.documented.toFixed(2)}</TableCell>
            <TableCell className="text-right tabular-nums">{computed.toFixed(2)}</TableCell>
            <TableCell>
              <span className={passes ? "font-medium text-ok" : "font-medium text-danger"}>
                {passes ? "AA" : "FAIL"} ≥ {pair.required}
              </span>
              {matches ? null : <span className="ml-2 text-warn">doc drift</span>}
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);
