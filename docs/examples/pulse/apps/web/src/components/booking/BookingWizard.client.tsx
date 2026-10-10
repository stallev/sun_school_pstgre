"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { fetchBookingWizardSlotsAction } from "@/actions/client/fetch-booking-wizard-slots";
import { ContentText, Heading } from "@/components/atoms";
import { BookingWizardConfirmStep } from "@/components/booking/BookingWizardConfirmStep.client";
import { BookingWizardServiceStep } from "@/components/booking/BookingWizardServiceStep.client";
import { BookingWizardSidebar } from "@/components/booking/BookingWizardSidebar";
import { BookingWizardSlotStep } from "@/components/booking/BookingWizardSlotStep.client";
import { Button } from "@/components/ui/button";
import { WizardHeader } from "@/components/ui/WizardHeader";
import type { PublicTrainerProfile } from "@/lib/trainer/trainer-profile";
import {
  BOOKING_WIZARD_STEP,
  findSelectedService,
  formatBookingPrice,
} from "@/lib/booking/booking-wizard-utils";
import {
  getSlotsForDay,
  mapSlotsToSchedulePicker,
  type SchedulePickerDay,
  type SchedulePickerSlot,
} from "@/lib/booking/map-slots-to-schedule-picker";
import {
  useLocale,
  useMessages,
} from "@/components/i18n/LocaleProvider.client";


export type BookingWizardProps = {
  profile: PublicTrainerProfile;
  initialServiceId?: string | null;
  initialStep?: number;
};

export function BookingWizard({  profile,
  initialServiceId,
  initialStep = BOOKING_WIZARD_STEP.service,
}: BookingWizardProps) {
  const messages = useMessages();
  const locale = useLocale();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(initialStep);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    findSelectedService(profile.services, initialServiceId ?? null)?.id ?? null,
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [activeDayId, setActiveDayId] = useState<string>("");
  const [timezoneLabel, setTimezoneLabel] = useState(profile.timezone);
  const [slotsByDay, setSlotsByDay] = useState<Map<string, SchedulePickerSlot[]>>(
    new Map(),
  );
  const [days, setDays] = useState<SchedulePickerDay[]>([]);
  const [isSlotsPending, startSlotsTransition] = useTransition();

  const selectedService = useMemo(
    () => findSelectedService(profile.services, selectedServiceId),
    [profile.services, selectedServiceId],
  );

  const stepLabel =
    step === BOOKING_WIZARD_STEP.service
      ? messages.booking.wizard.stepService
      : step === BOOKING_WIZARD_STEP.slot
        ? messages.booking.wizard.stepSlot
        : messages.booking.wizard.stepConfirm;

  const syncUrl = useCallback(
    (nextStep: number, serviceId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", String(nextStep));
      if (serviceId) {
        params.set("serviceId", serviceId);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const loadSlots = useCallback(
    (serviceId: string, durationMinutes: number) => {
      startSlotsTransition(async () => {
        const result = await fetchBookingWizardSlotsAction(
          profile.id,
          durationMinutes,
        );

        if (!result) {
          setDays([]);
          setSlotsByDay(new Map());
          setActiveDayId("");
          return;
        }

        const mapped = mapSlotsToSchedulePicker(
          result.timezone,
          result.slots,
          locale,
        );
        setDays(mapped.days);
        setSlotsByDay(mapped.slotsByDay);
        setTimezoneLabel(result.timezoneLabel);
        setActiveDayId(mapped.days[0]?.id ?? "");
      });
    },
    [locale, profile.id],
  );

  useEffect(() => {
    if (step === BOOKING_WIZARD_STEP.slot && selectedService) {
      loadSlots(selectedService.id, selectedService.durationMinutes);
    }
  }, [loadSlots, selectedService, step]);

  const activeSlots = getSlotsForDay(slotsByDay, activeDayId);

  function handleBack() {
    if (step === BOOKING_WIZARD_STEP.service) {
      router.push(`/trainers/${profile.id}`);
      return;
    }

    const previousStep = step - 1;
    setStep(previousStep);
    syncUrl(previousStep, selectedServiceId);
  }

  function handleNext() {
    const nextStep = step + 1;
    setStep(nextStep);
    syncUrl(nextStep, selectedServiceId);
  }

  function handleSlotUnavailable() {
    setStep(BOOKING_WIZARD_STEP.slot);
    syncUrl(BOOKING_WIZARD_STEP.slot, selectedServiceId);
    if (selectedService) {
      loadSlots(selectedService.id, selectedService.durationMinutes);
    }
  }

  const canProceed =
    step === BOOKING_WIZARD_STEP.service
      ? Boolean(selectedServiceId)
      : step === BOOKING_WIZARD_STEP.slot
        ? Boolean(selectedSlotId)
        : false;

  const stepCaption = messages.booking.wizard.stepOf
    .replace("{step}", String(step))
    .replace("{total}", "3");

  return (
    <div className="-mx-4 md:mx-0">
      <WizardHeader
        step={step}
        totalSteps={3}
        stepLabel={stepLabel}
        stepCaption={stepCaption}
        backAriaLabel={messages.shell.back}
        totalLabel={
          selectedService
            ? formatBookingPrice(
                selectedService.priceCents,
                selectedService.currency,
                locale,
              )
            : undefined
        }
        onBack={handleBack}
        className="-mx-4 md:mx-0"
      />

      <div className="min-w-0 space-y-6 px-4 py-6 md:px-0">
        <div>
          <Heading as="h1" visualLevel="h2">
            {profile.fullName}
          </Heading>
          <ContentText variant="mutedMicro" as="p" className="mt-1">
            {stepLabel}
          </ContentText>
        </div>

        {step === BOOKING_WIZARD_STEP.service ? (
          <BookingWizardServiceStep
            services={profile.services}
            selectedServiceId={selectedServiceId}
            trainerProfileId={profile.id}
            onSelect={setSelectedServiceId}
          />
        ) : null}

        {step === BOOKING_WIZARD_STEP.slot ? (
          <BookingWizardSlotStep
            days={days}
            slots={activeSlots}
            activeDayId={activeDayId}
            selectedSlotId={selectedSlotId}
            timezoneLabel={timezoneLabel}
            isLoading={isSlotsPending}
            onDayChange={(dayId) => {
              setActiveDayId(dayId);
              setSelectedSlotId(null);
            }}
            onSlotSelect={setSelectedSlotId}
          />
        ) : null}

        {step === BOOKING_WIZARD_STEP.confirm && selectedService && selectedSlotId ? (
          <BookingWizardConfirmStep
            trainerProfileId={profile.id}
            service={selectedService}
            startsAtUtc={selectedSlotId}
            timezone={profile.timezone}
            trainerName={profile.fullName}
            onSlotUnavailable={handleSlotUnavailable}
          />
        ) : null}

        {selectedService && step !== BOOKING_WIZARD_STEP.confirm ? (
          <BookingWizardSidebar
            trainerName={profile.fullName}
            trainerPhotoUrl={profile.photoUrl}
            service={selectedService}
            startsAtUtc={selectedSlotId}
            timezone={profile.timezone}
          />
        ) : null}

        {step < BOOKING_WIZARD_STEP.confirm ? (
          <Button
            type="button"
            size="lg"
            className="w-full md:w-auto"
            disabled={!canProceed || isSlotsPending}
            onClick={handleNext}
          >
            {messages.booking.wizard.next}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
