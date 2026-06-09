import { useEffect, useRef } from "react";
import { useDateField, useDateSegment, useLocale } from "react-aria";
import { DateFieldState, useDateFieldState } from "react-stately";
import type { DateSegment } from "@react-stately/datepicker";
import { CalendarDate, createCalendar } from "@internationalized/date";
import { cx } from "@/utils/cx";

interface MonthYearSegmentProps {
    segment: DateSegment;
    state: DateFieldState;
    isDisabled?: boolean;
}

const MonthYearSegment = ({ segment, state, isDisabled }: MonthYearSegmentProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { segmentProps } = useDateSegment(segment, state, ref);

    // Pad month with leading zero if needed (e.g., 3 -> 03)
    let displayText = segment.text;
    if (segment.type === "month" && !segment.isPlaceholder) {
        displayText = segment.text.padStart(2, "0");
    }

    return (
        <div
            {...segmentProps}
            ref={ref}
            className={cx(
                "rounded px-0.5 text-primary tabular-nums caret-transparent focus:bg-brand-secondary focus:font-medium focus:outline-hidden",
                segment.isPlaceholder && "text-placeholder uppercase",
                segment.type === "literal" && "text-fg-quaternary",
                isDisabled && "text-disabled",
            )}
        >
            {displayText}
        </div>
    );
};

interface MonthYearFieldProps {
    label?: string;
    isDisabled?: boolean;
    isInvalid?: boolean;
    className?: string;
    value?: { month: number; year: number } | null;
    onChange?: (value: { month: number; year: number } | null) => void;
}

export const MonthYearField = ({ label, isDisabled, isInvalid, className, value, onChange }: MonthYearFieldProps) => {
    const { locale } = useLocale();
    const ref = useRef<HTMLDivElement>(null);
    const lastReportedValue = useRef<string | null>(null);

    // Convert value prop to CalendarDate for default value (allows pre-filling while still being editable)
    const defaultDateValue = value ? new CalendarDate(value.year, value.month, 1) : undefined;

    const state = useDateFieldState({
        locale,
        createCalendar,
        granularity: "day",
        isDisabled,
        defaultValue: defaultDateValue,
    });

    const { fieldProps, labelProps } = useDateField({ label, isDisabled }, state, ref);

    // Build segments array with only month, literal, year
    const monthSegment = state.segments.find((s) => s.type === "month");
    const yearSegment = state.segments.find((s) => s.type === "year");
    const literalSegment = state.segments.find((s) => s.type === "literal");

    const segments = [monthSegment, literalSegment, yearSegment].filter(Boolean) as typeof state.segments;

    // Watch for changes in month and year segments and trigger onChange
    useEffect(() => {
        if (!onChange) return;

        const monthFilled = monthSegment && !monthSegment.isPlaceholder;
        const yearFilled = yearSegment && !yearSegment.isPlaceholder;

        if (monthFilled && yearFilled) {
            // Both segments are filled - extract numeric values
            const monthValue = parseInt(monthSegment.text, 10);
            const yearValue = parseInt(yearSegment.text, 10);
            const valueKey = `${monthValue}-${yearValue}`;

            // Only trigger onChange if value actually changed
            if (lastReportedValue.current !== valueKey) {
                lastReportedValue.current = valueKey;
                onChange({ month: monthValue, year: yearValue });
            }
        } else if (lastReportedValue.current !== null) {
            // Segments were cleared
            lastReportedValue.current = null;
            onChange(null);
        }
    }, [monthSegment?.text, monthSegment?.isPlaceholder, yearSegment?.text, yearSegment?.isPlaceholder, onChange]);

    return (
        <div className={cx("flex flex-col gap-1.5", className)}>
            {label && (
                <label {...labelProps} className="text-md font-medium text-secondary">
                    {label}
                </label>
            )}
            <div
                {...fieldProps}
                ref={ref}
                className={cx(
                    "flex h-11 w-full rounded-lg bg-primary px-3.5 py-2.5 text-md shadow-xs ring-1 ring-inset focus-within:ring-2",
                    isInvalid ? "ring-error_subtle focus-within:ring-error" : "ring-primary focus-within:ring-brand",
                    isDisabled && "cursor-not-allowed bg-disabled_subtle ring-disabled",
                )}
            >
                {segments.map((segment, i) => (
                    <MonthYearSegment
                        key={i}
                        segment={segment}
                        state={state}
                        isDisabled={isDisabled}
                    />
                ))}
            </div>
        </div>
    );
};

MonthYearField.displayName = "MonthYearField";
