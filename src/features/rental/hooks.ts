/** Hooks de lecture du module Locatif. */
import { useMemo } from 'react';

import { activeLeaseFor, listCharges, listLeases, listPayments, listProperties } from '@/db/repositories';
import type { Lease, RentPayment, RentalCharge, RentalProperty } from '@/db/schema';
import { useQuery } from '@/db/useQuery';
import { rentalYield, type RentalResult } from '@/finance/rental';
import { useSettings } from '@/store/settings';

import { paymentStatus, toIso, totalDue, type PaymentStatus } from './logic';

export interface PaymentView {
  payment: RentPayment;
  status: PaymentStatus;
  dueCents: number;
}

export interface PropertyView {
  property: RentalProperty;
  lease: Lease | undefined;
  payments: PaymentView[];
  charges: RentalCharge[];
  currentMonth: PaymentView | undefined;
  yieldResult: RentalResult | null;
}

export function useRentals() {
  const properties = useQuery(() => listProperties(), []);
  const allLeases = useQuery(() => listLeases(), []);
  const payments = useQuery(() => listPayments(), []);
  const charges = useQuery(() => listCharges(), []);
  const graceDays = useSettings((s) => s.rentalGraceDays);
  const tmi = useSettings((s) => s.rentalTmiPct);
  const regime = useSettings((s) => s.rentalRegime);
  const vacancy = useSettings((s) => s.rentalVacancyWeeks);

  return useMemo(() => {
    const today = toIso(new Date());
    const monthKey = today.slice(0, 7);
    const views: PropertyView[] = properties.map((property) => {
      const lease =
        allLeases.find((l) => l.propertyId === property.id && l.endDate === null) ??
        activeLeaseFor(property.id);
      const own = payments
        .filter((p) => p.propertyId === property.id)
        .map((payment) => ({
          payment,
          status: paymentStatus(payment, today, graceDays),
          dueCents: totalDue(payment),
        }));
      const annualNonRecoverable =
        property.annualPropertyTaxCents +
        property.annualCondoCents +
        property.annualInsuranceCents +
        property.annualManagementCents +
        property.annualOtherCents;
      const yieldResult = lease
        ? rentalYield({
            purchasePriceCents: property.purchasePriceCents,
            acquisitionCostsCents: property.acquisitionCostsCents,
            initialWorksCents: property.initialWorksCents,
            monthlyRentExclChargesCents: lease.rentCents,
            annualNonRecoverableChargesCents: annualNonRecoverable,
            monthlyLoanPaymentCents: property.monthlyLoanPaymentCents,
            annualLoanInterestCents: property.annualLoanInterestCents,
            marginalTaxRatePct: tmi,
            taxRegime: regime,
            vacancyWeeksPerYear: vacancy,
          })
        : null;
      return {
        property,
        lease,
        payments: own,
        charges: charges.filter((c) => c.propertyId === property.id),
        currentMonth: own.find((p) => p.payment.periodKey === monthKey),
        yieldResult,
      };
    });
    const monthViews = views.map((v) => v.currentMonth).filter((p): p is PaymentView => Boolean(p));
    const monthDueCents = monthViews.reduce((a, p) => a + p.dueCents, 0);
    const monthPaidCents = monthViews.reduce((a, p) => a + p.payment.paidCents, 0);
    const lateCount = views.flatMap((v) => v.payments).filter((p) => p.status === 'late').length;
    return { views, monthViews, monthDueCents, monthPaidCents, lateCount, monthKey };
  }, [properties, allLeases, payments, charges, graceDays, tmi, regime, vacancy]);
}
