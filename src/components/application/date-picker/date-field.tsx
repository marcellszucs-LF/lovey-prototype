import type { DateFieldProps as AriaDateFieldProps, DateValue } from "react-aria-components";
import { DateField as AriaDateField, DateInput as AriaDateInput, DateSegment as AriaDateSegment, Label, I18nProvider } from "react-aria-components";
import { cx } from "@/utils/cx";

interface DateFieldProps extends AriaDateFieldProps<DateValue> {
    /** Label text for the date field */
    label?: string;
    /** Whether the field is disabled */
    isDisabled?: boolean;
}

export const DateField = ({ label, isDisabled, className, ...props }: DateFieldProps) => {
    return (
        <I18nProvider locale="en-GB">
        <AriaDateField {...props} isDisabled={isDisabled} className={cx("flex flex-col gap-1.5", className as string)}>
            {label && (
                <Label className="text-md font-medium text-secondary">
                    {label}
                </Label>
            )}
            <AriaDateInput
                className={cx(
                    "flex h-11 w-full rounded-lg bg-primary px-3.5 py-2.5 text-md shadow-xs ring-1 ring-primary ring-inset focus-within:ring-2 focus-within:ring-brand",
                    isDisabled && "cursor-not-allowed bg-disabled_subtle ring-disabled",
                )}
            >
                {(segment) => (
                    <AriaDateSegment
                        segment={segment}
                        className={cx(
                            "rounded px-0.5 text-primary tabular-nums caret-transparent focus:bg-brand-secondary focus:font-medium focus:outline-hidden",
                            segment.isPlaceholder && "text-placeholder uppercase",
                            segment.type === "literal" && "text-fg-quaternary",
                            isDisabled && "text-disabled",
                        )}
                    />
                )}
            </AriaDateInput>
        </AriaDateField>
        </I18nProvider>
    );
};

DateField.displayName = "DateField";
