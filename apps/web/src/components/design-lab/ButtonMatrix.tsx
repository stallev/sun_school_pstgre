import { Button } from "@/components/ui/button";
import { BUTTON_SIZES, BUTTON_VARIANTS } from "@/lib/design-lab/matrices";
import { LAB_TEXT } from "@/lib/design-lab/fixtures";
import { MatrixCell } from "./MatrixCell";

export const ButtonMatrix = () => (
  <div className="space-y-4">
    {BUTTON_VARIANTS.map((variant) => (
      <div key={variant} className="space-y-2">
        <p className="text-sm font-medium text-ink">{variant}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MatrixCell label="default">
            <Button variant={variant}>{LAB_TEXT.save}</Button>
          </MatrixCell>
          <MatrixCell label="disabled">
            <Button variant={variant} disabled>
              {LAB_TEXT.save}
            </Button>
          </MatrixCell>
          <MatrixCell label="pending">
            <Button variant={variant} aria-busy="true">
              {LAB_TEXT.save}…
            </Button>
          </MatrixCell>
          <MatrixCell label="sizes">
            <div className="flex flex-wrap items-center gap-2">
              {BUTTON_SIZES.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {size}
                </Button>
              ))}
            </div>
          </MatrixCell>
        </div>
      </div>
    ))}
  </div>
);
