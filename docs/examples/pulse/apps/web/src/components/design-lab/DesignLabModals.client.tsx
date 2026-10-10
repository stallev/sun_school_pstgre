"use client";

import { useState } from "react";
import { FilterIcon } from "lucide-react";

import { ContentText } from "@/components/atoms";
import { AddIntervalOverlay } from "@/components/trainer/schedule/AddIntervalOverlay.client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterChip } from "@/components/ui/FilterChip";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DesignLabSection,
  VariantLabel,
} from "@/components/design-lab/DesignLabSection";

export function DesignLabModals() {
  const [addIntervalOpen, setAddIntervalOpen] = useState(false);

  return (
    <DesignLabSection id="modals" title="L2 — Modal windows">
      <ContentText variant="muted" as="p">
        Mobile-first: bottom <code className="font-mono text-xs">Sheet</code>{" "}
        below <code className="font-mono text-xs">md</code>; centered{" "}
        <code className="font-mono text-xs">Dialog</code> on desktop. Destructive
        flows use <code className="font-mono text-xs">AlertDialog</code>.
      </ContentText>

      <div className="space-y-8">
        <div>
          <VariantLabel>Dialog — centered modal (≥ sm / desktop)</VariantLabel>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                New service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New service</DialogTitle>
                <DialogDescription>
                  Add a session type clients can book from your profile.
                </DialogDescription>
              </DialogHeader>
              <Input placeholder="Service name" defaultValue="Morning HIIT" />
              <DialogFooter>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="button">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <VariantLabel>Sheet — bottom modal (mobile filters)</VariantLabel>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline">
                <FilterIcon aria-hidden className="size-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="px-5 pt-0">
              <SheetHeader className="px-0 text-left">
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine the trainer catalog on mobile.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-wrap gap-2">
                {["All", "HIIT", "Strength", "Cardio"].map((label, index) => (
                  <FilterChip key={label} selected={index === 0}>
                    {label}
                  </FilterChip>
                ))}
              </div>
              <SheetFooter className="px-0">
                <Button type="button" className="w-full sm:w-auto">
                  Apply filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <div>
          <VariantLabel>Schedule — add interval overlay</VariantLabel>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAddIntervalOpen(true)}
          >
            New interval
          </Button>
          <AddIntervalOverlay
            open={addIntervalOpen}
            dayOfWeek={1}
            onOpenChange={setAddIntervalOpen}
            onAdd={() => setAddIntervalOpen(false)}
          />
        </div>

        <div>
          <VariantLabel>AlertDialog — destructive confirm</VariantLabel>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                Reject application
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject trainer application?</AlertDialogTitle>
                <AlertDialogDescription>
                  The trainer will be notified. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive">
                  Reject
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </DesignLabSection>
  );
}
