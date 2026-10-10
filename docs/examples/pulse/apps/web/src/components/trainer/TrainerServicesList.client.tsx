"use client";

import { PlusIcon } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTrainerServiceAction } from "@/actions/trainer/delete-trainer-service";
import { Heading } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { TrainerServiceForEdit } from "@/data/trainer/get-trainer-services-for-edit.server";
import { useMessages } from "@/components/i18n/LocaleProvider.client";

import {
  setSubmitTransportTag,
  SUBMIT_TRANSPORT_TAGS,
} from "@/lib/sentry/pulse-tags";
import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast";
import { resilientPostFetch } from "@/lib/ui/resilient-post-fetch";

import { ServiceCard } from "./ServiceCard";
import { TrainerServiceDeleteDialog } from "./TrainerServiceDeleteDialog.client";
import { TrainerServiceFormSheet } from "./TrainerServiceFormSheet.client";

export type TrainerServicesListProps = {
  initialServices: TrainerServiceForEdit[];
};

type OptimisticAction =
  | { type: "toggle"; serviceId: string }
  | { type: "replace"; services: TrainerServiceForEdit[] };

function applyOptimisticAction(
  services: TrainerServiceForEdit[],
  action: OptimisticAction,
): TrainerServiceForEdit[] {
  if (action.type === "replace") {
    return action.services;
  }

  return services.map((service) =>
    service.id === action.serviceId
      ? { ...service, isActive: !service.isActive }
      : service,
  );
}

export function TrainerServicesList({ initialServices }: TrainerServicesListProps) {
  const messages = useMessages();
  const [services, setServices] = useState(initialServices);
  const [optimisticServices, setOptimisticServices] = useOptimistic(
    services,
    applyOptimisticAction,
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<TrainerServiceForEdit | null>(null);
  const [deletingService, setDeletingService] = useState<TrainerServiceForEdit | null>(null);
  const [isTogglePending, startToggleTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const pending = isTogglePending || isDeletePending;

  const handleToggle = (serviceId: string) => {
    startToggleTransition(async () => {
      setOptimisticServices({ type: "toggle", serviceId });

      setSubmitTransportTag(SUBMIT_TRANSPORT_TAGS.ROUTE_HANDLER_PRIMARY);

      try {
        const response = await resilientPostFetch(
          `/api/trainer/services/${serviceId}/toggle`,
          { method: "POST" },
        );
        const result = (await response.json()) as {
          ok: boolean;
          data?: { isActive: boolean };
          message?: string;
        };

        if (!result.ok || !result.data) {
          toast.error(result.message ?? messages.trainer.services.toggleError, {
            duration: PRODUCT_TOAST_DURATION_MS,
          });
          return;
        }

        setServices((current) =>
          current.map((service) =>
            service.id === serviceId
              ? { ...service, isActive: result.data!.isActive }
              : service,
          ),
        );
      } catch {
        toast.error(messages.trainer.services.toggleError, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
      }
    });
  };

  const handleDelete = () => {
    if (!deletingService) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteTrainerServiceAction(deletingService.id);
      if (!result.ok) {
        toast.error(result.message ?? messages.trainer.services.errors.generic, {
          duration: PRODUCT_TOAST_DURATION_MS,
        });
        return;
      }

      const nextServices = services.filter((service) => service.id !== deletingService.id);
      setServices(nextServices);
      setDeletingService(null);
    });
  };

  const handleSaved = (savedService: TrainerServiceForEdit) => {
    setServices((current) => {
      const exists = current.some((service) => service.id === savedService.id);
      if (exists) {
        return current.map((service) =>
          service.id === savedService.id ? savedService : service,
        );
      }

      return [...current, savedService];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Heading as="h1" visualLevel="h2">
          {messages.trainer.services.title}
        </Heading>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditingService(null);
            setFormOpen(true);
          }}
          disabled={pending}
          aria-busy={pending}
        >
          <PlusIcon aria-hidden className="size-4" />
          {messages.trainer.services.addNew}
        </Button>
      </div>

      {optimisticServices.length === 0 ? (
        <Empty className="border border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PlusIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{messages.trainer.services.emptyTitle}</EmptyTitle>
            <EmptyDescription>
              {messages.trainer.services.emptyDescription}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              onClick={() => {
                setEditingService(null);
                setFormOpen(true);
              }}
              disabled={pending}
              aria-busy={pending}
            >
              <PlusIcon aria-hidden className="size-4" />
              {messages.trainer.services.addNew}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {optimisticServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              disabled={pending}
              onToggle={handleToggle}
              onEdit={(entry) => {
                setEditingService(entry);
                setFormOpen(true);
              }}
              onDelete={setDeletingService}
            />
          ))}
        </div>
      )}

      <TrainerServiceFormSheet
        open={formOpen}
        service={editingService}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
      />

      <TrainerServiceDeleteDialog
        service={deletingService}
        isPending={isDeletePending}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingService(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
