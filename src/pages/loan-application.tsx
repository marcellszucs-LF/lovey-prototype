import { ChangeEvent, Fragment, useEffect, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { AlertCircle, AnnotationQuestion, ArrowLeft, ArrowRight, AtSign, BookOpen01, Building06, Check, CheckCircle, CheckSquareBroken, ChevronSelectorVertical, CreditCardRefresh, Dice1, Dice2, Dice3, Dice4, Disc01, FileCheck02, FileHeart02, Flag05, HelpCircle, Hourglass01, InfoCircle, Loading01, Mail05, Menu02, MoonStar, Placeholder, Plus, QrCode02, SearchMd, Settings01, Share05, Sun, UploadCloud02, User01, Users01, XClose, ZapFast } from "@untitledui/icons";
import { motion } from "motion/react";
import type { DateValue } from "react-aria-components";
import { DateField } from "@/components/application/date-picker/date-field";
import { MonthYearField } from "@/components/application/date-picker/month-year-field";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { usePlaid } from "@/hooks/use-plaid";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

// Sidebar gradient styles from Figma
// Light mode: Brand 700 -> 600 (45deg)
// Dark mode: Brand 900 -> 600 (45deg)
const sidebarGradientLight = "linear-gradient(45deg, #4b3a6e 0%, #594483 100%)";
const sidebarGradientDark = "linear-gradient(45deg, #2f2446 0%, #594483 100%)";

// Skeleton component with shimmer animation
const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`skeleton rounded ${className}`} />
);

// Lovey logo (white version for sidebar)
const LoveyLogo = () => (
    <img src="/lovey-logo-white.svg" alt="Lovey" className="h-full w-auto" />
);

// Lovey logo (purple version for mobile header)
const LoveyLogoPurple = () => (
    <img src="/lovey-logo-purple.svg" alt="Lovey" className="h-9 w-auto" />
);

// Trustpilot star component
const TrustpilotStar = () => (
    <div className="size-7 bg-[#00b67a] flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
        </svg>
    </div>
);

const TrustpilotSection = ({ variant = "light" }: { variant?: "light" | "dark" }) => (
    <div className="flex flex-col items-center gap-1.5 p-3.5">
        <p className={`text-xs font-medium text-center ${variant === "dark" ? "text-white" : "text-primary"}`}>Excellent</p>
        <div className="flex gap-0.5 justify-center">
            <TrustpilotStar />
            <TrustpilotStar />
            <TrustpilotStar />
            <TrustpilotStar />
            <TrustpilotStar />
        </div>
        <p className={`text-[10px] text-center ${variant === "dark" ? "text-white" : "text-tertiary"}`}>
            Based on <span className="font-bold underline">1789 reviews</span>
        </p>
        <div className="flex items-center gap-0.5">
            <svg width="18" height="17" viewBox="0 0 18 17" fill="none">
                <polygon points="9,1 11,7 17,7 12,11 14,17 9,13 4,17 6,11 1,7 7,7" fill="#00b67a" />
            </svg>
            <span className={`text-xs font-bold ${variant === "dark" ? "text-white" : "text-primary"}`}>Trustpilot</span>
        </div>
    </div>
);

// Feature item with checkmark
const FeatureItem = ({ children, size = "md" }: { children: React.ReactNode; size?: "sm" | "md" }) => (
    <div className="flex items-center gap-2 w-full">
        <CheckSquareBroken className={`${size === "sm" ? "size-4 lg:size-5" : "size-5"} text-white shrink-0`} />
        <p className={`text-white ${size === "sm" ? "text-base lg:text-lg" : "text-lg"}`}>{children}</p>
    </div>
);

// Progress step indicator with animation
const ProgressSteps = ({ currentStep = 1, totalSteps = 3 }: { currentStep?: number; totalSteps?: number }) => (
    <div className="flex gap-1 items-center px-2 md:px-3 w-full">
        {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="relative flex-1 h-1.5 rounded-full bg-fg-senary overflow-hidden">
                <motion.div
                    className="absolute inset-0 rounded-full bg-brand-solid"
                    initial={false}
                    animate={{ scaleX: i < currentStep ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{ transformOrigin: "left" }}
                />
            </div>
        ))}
    </div>
);

// Skeleton progress steps
const ProgressStepsSkeleton = () => (
    <div className="flex gap-1 items-center px-2 md:px-3 w-full">
        <Skeleton className="flex-1 h-1.5" />
        <Skeleton className="flex-1 h-1.5" />
        <Skeleton className="flex-1 h-1.5" />
    </div>
);

// Skeleton input field
const InputSkeleton = () => (
    <div className="flex flex-col gap-1.5 w-full">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-11 w-full" />
    </div>
);

// Skeleton checkbox
const CheckboxSkeleton = () => (
    <div className="flex items-start gap-2 w-full">
        <Skeleton className="size-4 mt-0.5" />
        <div className="flex flex-col gap-1 flex-1">
            <Skeleton className="h-5 w-72" />
            <Skeleton className="h-4 w-56" />
        </div>
    </div>
);

const tradingStyleOptions = [
    { id: "limited-company", label: "Limited Company" },
    { id: "sole-trader", label: "Sole Trader" },
];

const tradingDurationOptions = [
    { id: "3-12", label: "3\u201312 months" },
    { id: "12-24", label: "12\u201324 months" },
    { id: "24-36", label: "24\u201336 months" },
    { id: "36-48", label: "36\u201348 months" },
    { id: "48-60", label: "48\u201360 months" },
];

const yearlyTurnoverOptions = [
    { id: "under-50k", label: "Under £50k" },
    { id: "50k-100k", label: "Between £50k and £100k" },
    { id: "100k-500k", label: "Between £100k and £500k" },
    { id: "over-500k", label: "Over £500k" },
];

const fundsReasonOptions = [
    { id: "working-capital", label: "Working capital" },
    { id: "equipment", label: "Equipment purchase" },
    { id: "expansion", label: "Business expansion" },
    { id: "stock", label: "Stock purchase" },
    { id: "marketing", label: "Marketing" },
    { id: "other", label: "Other" },
];


const businessTradingDurationOptions = [
    { id: "under-3m", label: "Under 3 months" },
    { id: "3-12m", label: "3 to 12 months" },
    { id: "1-2y", label: "1 - 2 years" },
    { id: "2-3y", label: "2 - 3 years" },
    { id: "over-3y", label: "Over 3 years" },
];

// Static company data for demo
const staticCompanies = [
    { id: "1", name: "Love Football", postcode: "EH1 4QR" },
    { id: "2", name: "Love Finance LTD", postcode: "B3 3JY" },
    { id: "3", name: "Love at First Sight", postcode: "BS1 5ST" },
    { id: "4", name: "Lovely Furniture Limited", postcode: "M1 3AB" },
    { id: "5", name: "Love Live Fight LTD", postcode: "NW1 5XE" },
    { id: "6", name: "Love Love Fruit", postcode: "B32 2PP" },
    { id: "7", name: "Full of Love", postcode: "EH11 4DF" },
];

// Applicant data for the dashboard
const applicants = [
    { id: "1", name: "Jenny Sadler", ownership: 33 },
    { id: "2", name: "Jack James Smith", ownership: 33 },
    { id: "3", name: "Alex O'Malley", ownership: 33 },
];

// Static UK addresses for demo
const staticAddresses = [
    { id: "1", address: "3 Charnwood Way, Wellesbourne, Warwick CV35 8EN" },
    { id: "2", address: "42 Victoria Street, London SW1H 0NW" },
    { id: "3", address: "15 Oxford Road, Manchester M1 5QA" },
    { id: "4", address: "7 Castle Street, Edinburgh EH2 3AH" },
    { id: "5", address: "28 Queen Street, Cardiff CF10 2BU" },
    { id: "6", address: "91 High Street, Birmingham B4 7SL" },
    { id: "7", address: "54 Park Lane, Leeds LS3 1AB" },
    { id: "8", address: "12 Bridge Street, Bristol BS1 2EL" },
    { id: "9", address: "66 Church Road, Liverpool L1 3BQ" },
    { id: "10", address: "8 Market Square, Nottingham NG1 2ET" },
    { id: "11", address: "23 Station Road, Sheffield S1 2GU" },
    { id: "12", address: "39 King Street, Glasgow G1 5QT" },
];

// Address entry type for address history
interface AddressEntry {
    address: string;
    movedIn: { month: number; year: number } | null;
    movedOut: { month: number; year: number } | null;
}

// Helper to check if total address history covers 3 years
const calculateTotalMonths = (addresses: AddressEntry[]): number => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Find the oldest movedIn date
    let oldestDate: { month: number; year: number } | null = null;
    for (const addr of addresses) {
        if (addr.movedIn) {
            if (!oldestDate ||
                addr.movedIn.year < oldestDate.year ||
                (addr.movedIn.year === oldestDate.year && addr.movedIn.month < oldestDate.month)) {
                oldestDate = addr.movedIn;
            }
        }
    }

    if (!oldestDate) return 0;

    // Calculate months from oldest date to now
    const monthsDiff = (currentYear - oldestDate.year) * 12 + (currentMonth - oldestDate.month);
    return monthsDiff;
};

// Returns true if the given month/year is in the future
const isDateInFuture = (val: { month: number; year: number } | null): boolean => {
    if (!val) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return val.year > currentYear || (val.year === currentYear && val.month > currentMonth);
};

type DoneActivePage = "pending" | "upload";

// Shared sidebar/flyout nav content (used by both desktop sidebar and mobile flyout)
const DashboardMenuContent = ({ activePage = "pending", onNavigate, firstName, lastName, email }: { activePage?: DoneActivePage; onNavigate?: (page: DoneActivePage) => void; firstName?: string; lastName?: string; email?: string }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const footerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showUserMenu) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showUserMenu]);

    return (
        <>
            <div className="flex flex-col flex-1 pt-5">
                <div className="flex flex-col px-1 pb-5">
                    <div className="py-0.5">
                        <button onClick={() => onNavigate?.("pending")} className={cx("flex items-center gap-2 w-full px-3 py-2 rounded-md", activePage === "pending" ? "bg-active" : "hover:bg-primary_hover")}>
                            <Hourglass01 className={cx("size-5 shrink-0", activePage === "pending" ? "text-fg-secondary_hover" : "text-fg-secondary")} />
                            <span className={cx("text-md font-semibold", activePage === "pending" ? "text-secondary_hover" : "text-secondary")}>Pending Application</span>
                        </button>
                    </div>
                    <div className="py-0.5">
                        <button onClick={() => onNavigate?.("upload")} className={cx("flex items-center gap-2 w-full px-3 py-2 rounded-md", activePage === "upload" ? "bg-active" : "hover:bg-primary_hover")}>
                            <UploadCloud02 className={cx("size-5 shrink-0", activePage === "upload" ? "text-fg-secondary_hover" : "text-fg-secondary")} />
                            <span className={cx("text-md font-semibold", activePage === "upload" ? "text-secondary_hover" : "text-secondary")}>Upload documents</span>
                        </button>
                    </div>
                    <div className="py-0.5">
                        <button className="flex items-center gap-2 w-full px-3 py-2 rounded-md hover:bg-primary_hover">
                            <AtSign className="size-5 text-fg-secondary shrink-0" />
                            <span className="text-md font-semibold text-secondary">Contact</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="px-4 pb-4" ref={footerRef}>
                {showUserMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="mb-2 bg-primary border border-secondary rounded-xl shadow-lg overflow-hidden py-1"
                    >
                        <button className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-primary_hover transition-colors text-left">
                            <User01 className="size-4 text-fg-secondary shrink-0" />
                            <span className="text-sm font-semibold text-secondary">Log Out</span>
                        </button>
                        <button className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-primary_hover transition-colors text-left">
                            <Settings01 className="size-4 text-fg-secondary shrink-0" />
                            <span className="text-sm font-semibold text-secondary">Forget me</span>
                        </button>
                        <button className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-primary_hover transition-colors text-left">
                            <BookOpen01 className="size-4 text-fg-secondary shrink-0" />
                            <span className="text-sm font-semibold text-secondary">FAQ</span>
                        </button>
                        <div className="px-3 pt-1 pb-2">
                            <button className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-primary border border-secondary rounded-lg shadow-xs-skeumorphic hover:bg-primary_hover transition-colors text-sm font-semibold text-secondary">
                                <Plus className="size-4 text-fg-secondary shrink-0" />
                                New Application
                            </button>
                        </div>
                    </motion.div>
                )}
                <button
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="relative flex gap-3 items-center w-full p-3 bg-primary_alt border border-secondary rounded-xl shadow-xs hover:bg-primary_hover transition-colors text-left"
                >
                    <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary">{(firstName || lastName) ? [firstName, lastName].filter(Boolean).join(" ") : "John Doe"}</p>
                        <p className="text-sm text-tertiary truncate">{email || "jdoe@company.com"}</p>
                    </div>
                    <ChevronSelectorVertical className="size-5 text-fg-quaternary shrink-0" />
                </button>
            </div>
        </>
    );
};

interface UploadFileEntry { name: string; size: string; done: boolean; }
const formatBytes = (bytes: number) => bytes < 1_048_576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1_048_576).toFixed(1)} MB`;

// Upload Documents page content
const UploadDocumentsContent = ({
    statementsEntries,
    statementsStatus,
    onStatementsChange,
    accountsEntries,
    accountsStatus,
    onAccountsChange,
}: {
    statementsEntries: UploadFileEntry[];
    statementsStatus: "idle" | "uploading" | "done";
    onStatementsChange: (e: ChangeEvent<HTMLInputElement>) => void;
    accountsEntries: UploadFileEntry[];
    accountsStatus: "idle" | "uploading" | "done";
    onAccountsChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
    const statementsRef = useRef<HTMLInputElement>(null);
    const accountsRef = useRef<HTMLInputElement>(null);
    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Info banner */}
            <div className="bg-secondary border border-secondary rounded-xl shadow-xs">
                <div className="flex items-center gap-3 pl-4 pr-3 py-3">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <InfoCircle className="size-4 text-fg-secondary" />
                    </div>
                    <p className="flex-1 text-sm text-tertiary">Don't have these files at hand? Don't worry we've composed an email for you, just send it to your accountant.</p>
                    <button
                        className="p-2 bg-primary border border-secondary rounded-lg shadow-xs-skeumorphic hover:bg-primary_hover transition-colors shrink-0"
                        onClick={() => {
                            const subject = encodeURIComponent("request for paperwork");
                            const body = encodeURIComponent("Adipisicing duis fugiat ipsum consectetur officia ea anim pariatur in velit. Labore consectetur Lorem ad occaecat reprehenderit qui occaecat non aliquip sit minim id ad. Adipisicing cillum est ullamco elit laboris dolore aute pariatur adipisicing ea ullamco pariatur.");
                            window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
                        }}
                    >
                        <Mail05 className="size-5 text-fg-secondary" />
                    </button>
                </div>
            </div>
            {/* Two upload cards */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Bank Statements */}
                <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs md:shadow-none flex-1">
                    <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                <UploadCloud02 className="size-4 text-fg-brand-primary" />
                            </div>
                            <span className="text-md font-semibold text-secondary">Bank Statements</span>
                        </div>
                        <div className="size-8 flex items-center justify-center">
                            <HelpCircle className="size-4 text-fg-senary" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                        {statementsEntries.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {statementsEntries.map((file, i) => (
                                    <div key={i} className="bg-primary border border-secondary rounded-xl p-3 flex items-center gap-3">
                                        {file.done
                                            ? <FileCheck02 className="size-8 text-fg-secondary shrink-0" />
                                            : <Loading01 className="size-8 text-fg-secondary shrink-0 animate-spin" />
                                        }
                                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                                            <p className="text-sm font-medium text-secondary truncate">{file.name}</p>
                                            <p className="text-sm text-tertiary">{file.size}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input ref={statementsRef} type="file" accept=".pdf" multiple className="hidden" onChange={onStatementsChange} />
                        <button
                            onClick={() => statementsRef.current?.click()}
                            disabled={statementsStatus === "uploading"}
                            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-primary border border-secondary rounded-lg shadow-xs-skeumorphic hover:bg-primary_hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold text-secondary"
                        >
                            <Plus className="size-5 text-fg-secondary shrink-0" />
                            Upload new Bank Statement
                        </button>
                    </div>
                </div>
                {/* Set of accounts */}
                <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs md:shadow-none flex-1">
                    <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                <UploadCloud02 className="size-4 text-fg-brand-primary" />
                            </div>
                            <span className="text-md font-semibold text-secondary">Set of accounts</span>
                        </div>
                        <div className="size-8 flex items-center justify-center">
                            <HelpCircle className="size-4 text-fg-senary" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                        {accountsEntries.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {accountsEntries.map((file, i) => (
                                    <div key={i} className="bg-primary border border-secondary rounded-xl p-3 flex items-center gap-3">
                                        {file.done
                                            ? <FileCheck02 className="size-8 text-fg-secondary shrink-0" />
                                            : <Loading01 className="size-8 text-fg-secondary shrink-0 animate-spin" />
                                        }
                                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                                            <p className="text-sm font-medium text-secondary truncate">{file.name}</p>
                                            <p className="text-sm text-tertiary">{file.size}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input ref={accountsRef} type="file" accept=".pdf" multiple className="hidden" onChange={onAccountsChange} />
                        <button
                            onClick={() => accountsRef.current?.click()}
                            disabled={accountsStatus === "uploading"}
                            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-primary border border-secondary rounded-lg shadow-xs-skeumorphic hover:bg-primary_hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold text-secondary"
                        >
                            <Plus className="size-5 text-fg-secondary shrink-0" />
                            Upload new Set of Accounts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Dashboard Header Component (shared between steps)
interface DashboardHeaderProps {
    stepNumber?: number;
    title: string;
    progress: number;
    nextStep: string;
    showWelcomeBanner: boolean;
    onToggleWelcome: () => void;
    hideButton?: boolean;
    hideNextPrefix?: boolean;
    onOpenMenu?: () => void;
}

const DashboardHeader = ({ stepNumber, title, progress, nextStep, showWelcomeBanner, onToggleWelcome, hideButton, hideNextPrefix, onOpenMenu }: DashboardHeaderProps) => {
    return (
        <div className="flex items-center justify-between w-full">
            {/* Left: Avatar and title */}
            <div className="flex items-center gap-3 md:gap-4">
                <div className="size-10 md:size-14 rounded-full overflow-hidden border border-black/8">
                    <img src="/company_img_placeholder.png" alt="" className="size-full object-cover" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-lg md:text-xl font-semibold text-primary">
                        {stepNumber != null && <>Step {stepNumber}: </>}
                        {title}
                    </h1>
                    <p className="text-sm md:text-md text-tertiary">Big Bidess LTD - £48,000</p>
                </div>
            </div>

            {/* Right: Progress bar (desktop only) and help button */}
            <div className="flex items-end gap-6">
                <div className="hidden md:flex flex-col w-56 lg:w-62.5">
                    {/* Progress bar container with proper height for alignment */}
                    <div className="flex flex-col justify-center h-7.5">
                        <div className="h-2 bg-quaternary rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-brand-solid rounded-r-full"
                                initial={false}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                    {/* Text row - baseline aligns with bottom of button */}
                    <div className="flex justify-between gap-4">
                        <span className="text-md text-brand-primary leading-6">{progress}%</span>
                        <span className="text-md text-tertiary leading-6 whitespace-nowrap">{hideNextPrefix ? nextStep : `Next: ${nextStep}`}</span>
                    </div>
                </div>
                {!hideButton && (
                    <button
                        onClick={onOpenMenu ?? onToggleWelcome}
                        className="shrink-0 mr-4 md:mr-0 p-2 md:p-2.5 bg-primary border border-primary rounded-lg shadow-xs-skeumorphic hover:bg-primary_hover transition-colors"
                        aria-pressed={onOpenMenu ? undefined : showWelcomeBanner}
                    >
                        {onOpenMenu
                            ? <Menu02 className="size-4 md:size-5 text-fg-secondary" />
                            : <AnnotationQuestion className="size-4 md:size-5 text-fg-secondary" />
                        }
                    </button>
                )}
            </div>
        </div>
    );
};

// Dashboard Step 1 Component
interface DashboardStep1Props {
    externalDashStep?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    onStepChange?: (step: number) => void;
}

const DashboardStep1 = ({ externalDashStep, firstName, lastName, email, onStepChange }: DashboardStep1Props) => {
    // Dashboard step navigation + animation
    const [dashStep, setDashStep] = useState(externalDashStep ?? 1);
    const [displayedDashStep, setDisplayedDashStep] = useState(externalDashStep ?? 1);
    const [dashAnimPhase, setDashAnimPhase] = useState<"idle" | "fadeOut" | "resize" | "fadeIn">("idle");
    const dashAnimPhaseRef = useRef(dashAnimPhase);
    dashAnimPhaseRef.current = dashAnimPhase;
    const [dashContentHeight, setDashContentHeight] = useState<number | "auto">("auto");
    const step1ContentRef = useRef<HTMLDivElement>(null);
    const step2ContentRef = useRef<HTMLDivElement>(null);
    const step3ContentRef = useRef<HTMLDivElement>(null);
    const step4ContentRef = useRef<HTMLDivElement>(null);
    const step5ContentRef = useRef<HTMLDivElement>(null);
    const dashScrollContainerRef = useRef<HTMLDivElement>(null);
    const FADE_DURATION = 100;
    const RESIZE_DURATION = 400;

    const getStepContentRef = (step: number) => {
        if (step === 1) return step1ContentRef;
        if (step === 2) return step2ContentRef;
        if (step === 3) return step3ContentRef;
        if (step === 4) return step4ContentRef;
        return step5ContentRef;
    };

    // Sync with external debug navigation
    useEffect(() => {
        if (externalDashStep != null) {
            if (externalDashStep === 6) {
                // Jump directly to the done screen (skip loading)
                setShowDashDone(true);
                setDisplayedDashDone(true);
            } else {
                // Navigate to a regular step (and exit done screen if needed)
                setShowDashDone(false);
                setDisplayedDashDone(false);
                if (externalDashStep !== dashStep) {
                    animateToDashStep(externalDashStep);
                }
            }
        }
    }, [externalDashStep]);

    // Step config
    const stepConfigs: Record<number, { stepNumber: number; title: string; progress: number; nextStep: string }> = {
        1: { stepNumber: 1, title: "Your Business", progress: 20, nextStep: "Directors" },
        2: { stepNumber: 2, title: "Legal Bits", progress: 40, nextStep: "Directors" },
        3: { stepNumber: 3, title: "Directors", progress: 60, nextStep: "Finances" },
        4: { stepNumber: 4, title: "Finances", progress: 80, nextStep: "Check" },
        5: { stepNumber: 5, title: "Check", progress: 90, nextStep: "Submit Application" },
    };
    const stepConfig = stepConfigs[dashStep] ?? stepConfigs[1];

    // Welcome banner state
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
    const [welcomeBannerVisible, setWelcomeBannerVisible] = useState(true);

    // Video modal state
    const [showVideoModal, setShowVideoModal] = useState(false);

    // Plaid Link
    const { openPlaidLink, loading: plaidLoading, error: plaidError, success: plaidSuccess } = usePlaid();

    // Submit / Done states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDashDone, setShowDashDone] = useState(false);
    const [displayedDashDone, setDisplayedDashDone] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [doneActivePage, setDoneActivePage] = useState<DoneActivePage>("pending");

    // Card-level height animation (for step 5 → done transition)
    const [cardHeight, setCardHeight] = useState<number | "auto">("auto");
    const [cardAnimPhase, setCardAnimPhase] = useState<"idle" | "fadeOut" | "resize" | "fadeIn">("idle");
    const cardContentRef = useRef<HTMLDivElement>(null);
    const doneContentRef = useRef<HTMLDivElement>(null);

    const handleSubmitApplication = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);

            const currentHeight = cardContentRef.current?.offsetHeight || 0;
            setCardHeight(currentHeight);

            requestAnimationFrame(() => {
                setCardAnimPhase("fadeOut");

                setTimeout(() => {
                    setDisplayedDashDone(true);
                    setShowDashDone(true);
                    onStepChange?.(6);

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            const targetHeight = doneContentRef.current?.offsetHeight || 0;
                            setCardHeight(targetHeight);
                            setCardAnimPhase("resize");

                            setTimeout(() => {
                                setCardHeight("auto");
                                setCardAnimPhase("fadeIn");

                                setTimeout(() => {
                                    setCardAnimPhase("idle");
                                }, FADE_DURATION);
                            }, RESIZE_DURATION);
                        });
                    });
                }, FADE_DURATION);
            });
        }, 1000);
    };

    // Upload demo state: "idle" | "uploading" | "done"
    const [uploadStatementsStatus, setUploadStatementsStatus] = useState<"idle" | "uploading" | "done">("idle");
    const [uploadAccountsStatus, setUploadAccountsStatus] = useState<"idle" | "uploading" | "done">("idle");
    const [uploadStatementsCount, setUploadStatementsCount] = useState(0);
    const [uploadAccountsCount, setUploadAccountsCount] = useState(0);
    const statementsInputRef = useRef<HTMLInputElement>(null);
    const accountsInputRef = useRef<HTMLInputElement>(null);

    const [statementsFileEntries, setStatementsFileEntries] = useState<UploadFileEntry[]>([]);
    const [accountsFileEntries, setAccountsFileEntries] = useState<UploadFileEntry[]>([]);

    const handleStatementsChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        e.target.value = "";
        const newEntries = files.map((f) => ({ name: f.name, size: formatBytes(f.size), done: false }));
        setStatementsFileEntries((prev) => [...prev, ...newEntries]);
        setUploadStatementsStatus("uploading");
        const count = files.length;
        setTimeout(() => {
            setStatementsFileEntries((prev) => prev.map((f, i) => i >= prev.length - count ? { ...f, done: true } : f));
            setUploadStatementsCount((prev) => prev + count);
            setUploadStatementsStatus("done");
        }, 1200);
    };

    const handleAccountsChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        e.target.value = "";
        const newEntries = files.map((f) => ({ name: f.name, size: formatBytes(f.size), done: false }));
        setAccountsFileEntries((prev) => [...prev, ...newEntries]);
        setUploadAccountsStatus("uploading");
        const count = files.length;
        setTimeout(() => {
            setAccountsFileEntries((prev) => prev.map((f, i) => i >= prev.length - count ? { ...f, done: true } : f));
            setUploadAccountsCount((prev) => prev + count);
            setUploadAccountsStatus("done");
        }, 1200);
    };

    // Step 2 state - legal questions (null = unanswered, true = Yes, false = No)
    const [legalBuyLand, setLegalBuyLand] = useState<boolean | null>(null);
    const [legalOtherCompany, setLegalOtherCompany] = useState<boolean | null>(null);
    const [legalSettleDebt, setLegalSettleDebt] = useState<boolean | null>(null);
    const [legalOutsideUK, setLegalOutsideUK] = useState<boolean | null>(null);
    const [legalChangeTradingActivity, setLegalChangeTradingActivity] = useState<boolean | null>(null);
    const [agreedToShare, setAgreedToShare] = useState(false);
    const isDashboardStep2Valid =
        legalBuyLand !== null && legalOtherCompany !== null && legalSettleDebt !== null &&
        legalOutsideUK !== null && legalChangeTradingActivity !== null && agreedToShare;

    // Step 3 state - per-director info for non-applicant directors
    interface DirectorInfo {
        dateOfBirth: DateValue | null;
        email: string;
        emailError: boolean;
        ownership: number;
        addresses: AddressEntry[];
        addressSearching: Record<number, boolean>;
        addressDropdownOpen: Record<number, boolean>;
        addressSearchText: Record<number, string>;
    }
    const showStep3Info = true;
    const step3InfoVisible = true;
    const [directorInfoMap, setDirectorInfoMap] = useState<Record<string, DirectorInfo>>({});
    const directorAddressInputRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const directorAddressSearchTimeouts = useRef<Record<string, NodeJS.Timeout | null>>({});

    const defaultDirectorInfo: DirectorInfo = {
        dateOfBirth: null,
        email: "",
        emailError: false,
        ownership: 0,
        addresses: [{ address: "", movedIn: null, movedOut: null }],
        addressSearching: {},
        addressDropdownOpen: {},
        addressSearchText: {},
    };

    const getDirectorInfo = (directorId: string): DirectorInfo => {
        return directorInfoMap[directorId] ?? defaultDirectorInfo;
    };

    const updateDirectorInfo = (directorId: string, updates: Partial<DirectorInfo> | ((current: DirectorInfo) => Partial<DirectorInfo>)) => {
        setDirectorInfoMap(prev => {
            const currentInfo = prev[directorId] ?? defaultDirectorInfo;
            const resolved = typeof updates === "function" ? updates(currentInfo) : updates;
            return {
                ...prev,
                [directorId]: { ...currentInfo, ...resolved },
            };
        });
    };

    const handleDirectorAddressSearch = (directorId: string, rowIndex: number, value: string) => {
        if (directorAddressSearchTimeouts.current[`${directorId}-${rowIndex}`]) {
            clearTimeout(directorAddressSearchTimeouts.current[`${directorId}-${rowIndex}`]!);
        }
        if (value.length > 0) {
            updateDirectorInfo(directorId, (info) => ({
                addressSearchText: { ...info.addressSearchText, [rowIndex]: value },
                addressSearching: { ...info.addressSearching, [rowIndex]: true },
                addressDropdownOpen: { ...info.addressDropdownOpen, [rowIndex]: true },
            }));
            directorAddressSearchTimeouts.current[`${directorId}-${rowIndex}`] = setTimeout(() => {
                updateDirectorInfo(directorId, (info) => ({ addressSearching: { ...info.addressSearching, [rowIndex]: false } }));
            }, 1000);
        } else {
            updateDirectorInfo(directorId, (info) => ({
                addressSearchText: { ...info.addressSearchText, [rowIndex]: value },
                addressSearching: { ...info.addressSearching, [rowIndex]: false },
                addressDropdownOpen: { ...info.addressDropdownOpen, [rowIndex]: false },
            }));
        }
    };

    const handleDirectorAddressSelect = (directorId: string, rowIndex: number, address: typeof staticAddresses[0]) => {
        updateDirectorInfo(directorId, (info) => {
            const updatedAddresses = [...info.addresses];
            updatedAddresses[rowIndex] = { ...updatedAddresses[rowIndex], address: address.address };
            return {
                addresses: updatedAddresses,
                addressSearchText: { ...info.addressSearchText, [rowIndex]: address.address },
                addressDropdownOpen: { ...info.addressDropdownOpen, [rowIndex]: false },
                addressSearching: { ...info.addressSearching, [rowIndex]: false },
            };
        });
    };

    const handleDirectorMovedInChange = (directorId: string, rowIndex: number, value: { month: number; year: number } | null) => {
        updateDirectorInfo(directorId, (info) => {
            const updatedAddresses = [...info.addresses];
            updatedAddresses[rowIndex] = { ...updatedAddresses[rowIndex], movedIn: value };
            return { addresses: updatedAddresses };
        });
    };

    const handleDirectorMovedOutChange = (directorId: string, rowIndex: number, value: { month: number; year: number } | null) => {
        updateDirectorInfo(directorId, (info) => {
            const updatedAddresses = [...info.addresses];
            updatedAddresses[rowIndex] = { ...updatedAddresses[rowIndex], movedOut: value };
            return { addresses: updatedAddresses };
        });
    };

    // Auto-add/remove address rows for directors based on 3-year history coverage
    useEffect(() => {
        applicants.forEach(d => {
            const info = getDirectorInfo(d.id);
            const dirAddresses = info.addresses;
            const totalMonths = calculateTotalMonths(dirAddresses);
            const lastEntry = dirAddresses[dirAddresses.length - 1];

            if (totalMonths < 36 && lastEntry.movedIn !== null) {
                // History not covered yet — add a new row
                updateDirectorInfo(d.id, (current) => ({
                    addresses: [...current.addresses, { address: "", movedIn: null, movedOut: lastEntry.movedIn }],
                }));
            } else if (totalMonths >= 36 && dirAddresses.length > 1) {
                // History now covered — trim trailing rows that have no user data
                const trimmed = [...dirAddresses];
                while (trimmed.length > 1) {
                    const last = trimmed[trimmed.length - 1];
                    if (last.address === "" && last.movedIn === null) {
                        trimmed.pop();
                    } else {
                        break;
                    }
                }
                if (trimmed.length !== dirAddresses.length) {
                    updateDirectorInfo(d.id, () => ({ addresses: trimmed }));
                }
            }
        });
    }, [directorInfoMap]);

    const isDashboardStep3Valid = (() => {
        let cumulativeOwnership = 0;
        for (const d of applicants) {
            const info = getDirectorInfo(d.id);
            const hasEmail = info.email && !info.emailError;
            const hasFirstAddress = info.addresses[0].address !== "";
            const hasFirstMovedIn = info.addresses[0].movedIn !== null;
            if (hasEmail && hasFirstAddress && hasFirstMovedIn) {
                cumulativeOwnership += d.ownership;
            }
        }
        return cumulativeOwnership >= 50;
    })();

    // Step 4 state - finances
    const [turnover12Months, setTurnover12Months] = useState("");
    const [turnover2019, setTurnover2019] = useState("");
    const [vatRegistered, setVatRegistered] = useState(false);

    const turnoverNumeric = parseFloat(turnover12Months.replace(/,/g, "")) || 0;
    const vatAutoTicked = turnoverNumeric > 89999;

    const isDashboardStep4Valid = plaidSuccess || uploadStatementsCount > 0 || uploadAccountsCount > 0;

    // Address history state - starts with one empty entry
    const [addresses, setAddresses] = useState<AddressEntry[]>([
        { address: "", movedIn: null, movedOut: null }
    ]);

    // Address search state - track per row
    const [_addressSearching, setAddressSearching] = useState<Record<number, boolean>>({});
    const [_addressDropdownOpen, setAddressDropdownOpen] = useState<Record<number, boolean>>({});
    const [_addressSearchText, _setAddressSearchText] = useState<Record<number, string>>({});
    const addressInputRefs = useRef<Record<number, HTMLDivElement | null>>({});

    // Trading address state
    const [tradingAddress, setTradingAddress] = useState("");
    const [tradingAddressSearchText, setTradingAddressSearchText] = useState("");
    const [tradingAddressSearching, setTradingAddressSearching] = useState(false);
    const [tradingAddressDropdownOpen, setTradingAddressDropdownOpen] = useState(false);
    const tradingAddressSearchTimeout = useRef<NodeJS.Timeout | null>(null);
    const tradingAddressInputRef = useRef<HTMLDivElement>(null);

    const handleTradingAddressSearchChange = (value: string) => {
        setTradingAddressSearchText(value);
        if (tradingAddressSearchTimeout.current) {
            clearTimeout(tradingAddressSearchTimeout.current);
        }
        if (value.length > 0) {
            setTradingAddressSearching(true);
            setTradingAddressDropdownOpen(true);
            tradingAddressSearchTimeout.current = setTimeout(() => {
                setTradingAddressSearching(false);
            }, 1000);
        } else {
            setTradingAddressSearching(false);
            setTradingAddressDropdownOpen(false);
        }
    };

    const handleTradingAddressSelect = (address: typeof staticAddresses[0]) => {
        setTradingAddress(address.address);
        setTradingAddressSearchText(address.address);
        setTradingAddressDropdownOpen(false);
        setTradingAddressSearching(false);
    };

    // Handle dismissing the welcome banner
    const handleDismissWelcome = () => {
        // First fade out
        setWelcomeBannerVisible(false);
        // Then collapse height
        setTimeout(() => {
            setShowWelcomeBanner(false);
        }, 150);
    };

    const handleCloseMenu = () => setShowMobileMenu(false);

    // Handle toggling the welcome banner
    const handleToggleWelcome = () => {
        if (showWelcomeBanner) {
            // Dismiss: first fade out, then collapse
            setWelcomeBannerVisible(false);
            setTimeout(() => {
                setShowWelcomeBanner(false);
            }, 150);
        } else {
            // Show: first expand, then fade in
            setShowWelcomeBanner(true);
            setTimeout(() => {
                setWelcomeBannerVisible(true);
            }, 50);
        }
    };

    // Check if we need to add more address rows (less than 3 years of history)
    const totalMonths = calculateTotalMonths(addresses);
    const needsMoreAddresses = addresses[addresses.length - 1].movedIn !== null && totalMonths < 36;




    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            Object.keys(addressInputRefs.current).forEach(key => {
                const index = parseInt(key, 10);
                const ref = addressInputRefs.current[index];
                if (ref && !ref.contains(event.target as Node)) {
                    setAddressDropdownOpen(prev => ({ ...prev, [index]: false }));
                    setAddressSearching(prev => ({ ...prev, [index]: false }));
                }
            });
            // Trading address dropdown
            if (tradingAddressInputRef.current && !tradingAddressInputRef.current.contains(event.target as Node)) {
                setTradingAddressDropdownOpen(false);
                setTradingAddressSearching(false);
            }
            // Director address dropdowns (keys are "directorId-rowIndex")
            Object.keys(directorAddressInputRefs.current).forEach(key => {
                const ref = directorAddressInputRefs.current[key];
                if (ref && !ref.contains(event.target as Node)) {
                    const [dirId, rowStr] = key.split("-");
                    const rowIdx = parseInt(rowStr, 10);
                    const info = getDirectorInfo(dirId);
                    updateDirectorInfo(dirId, {
                        addressDropdownOpen: { ...info.addressDropdownOpen, [rowIdx]: false },
                        addressSearching: { ...info.addressSearching, [rowIdx]: false },
                    });
                }
            });
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    // Effect to add new row when needed, pre-fill movedOut with previous row's movedIn
    useEffect(() => {
        if (needsMoreAddresses) {
            const lastMovedIn = addresses[addresses.length - 1].movedIn;
            setAddresses(prev => [...prev, { address: "", movedIn: null, movedOut: lastMovedIn }]);
        }
    }, [needsMoreAddresses]);

    // Validation: check if all required fields are filled
    const isDashboardStep1Valid = tradingAddress !== "" && turnover12Months !== "" && turnover2019 !== "";

    // Animate dashboard step transition (same pattern as animateToStep in LoanApplication)
    const animateToDashStep = (targetStep: number) => {
        if (dashAnimPhaseRef.current !== "idle" || targetStep === displayedDashStep) return;

        // Sync URL with the new dashboard step
        onStepChange?.(targetStep);

        // Get current content height and lock it
        const currentRef = getStepContentRef(displayedDashStep);
        const currentHeight = currentRef.current?.offsetHeight || 0;
        setDashContentHeight(currentHeight);

        // Update header immediately
        setDashStep(targetStep);

        // Scroll to top on mobile when changing steps
        dashScrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });

        // Phase 1: Fade out content
        requestAnimationFrame(() => {
            setDashAnimPhase("fadeOut");

            // After fade out, swap content and resize
            setTimeout(() => {
                setDisplayedDashStep(targetStep);

                // Wait for React to render new content, then measure and resize
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const targetRef = getStepContentRef(targetStep);
                        const targetHeight = targetRef.current?.offsetHeight || 0;
                        setDashContentHeight(targetHeight);
                        setDashAnimPhase("resize");

                        // After resize, fade in
                        setTimeout(() => {
                            setDashContentHeight("auto");
                            setDashAnimPhase("fadeIn");
                            dashScrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });

                            // After fade in, return to idle
                            setTimeout(() => {
                                setDashAnimPhase("idle");
                            }, FADE_DURATION);
                        }, RESIZE_DURATION);
                    });
                });
            }, FADE_DURATION);
        });
    };

    return (
        <>
        <div
            ref={dashScrollContainerRef}
            className="fixed inset-0 flex flex-col bg-secondary md:bg-tertiary z-50 overflow-y-auto overscroll-none"
            style={{
                animation: "fadeIn 300ms ease-out",
            }}
        >
            {/* Header with logo - desktop only */}
            <div className="hidden md:flex items-center pt-4 pb-8 px-8 lg:px-15">
                <img src="/lovey-logo-purple.svg" alt="Lovey" className="h-12.5 w-auto" />
            </div>

            {/* Body */}
            <div className={cx("flex-1 flex flex-col items-center md:px-8 lg:px-15", !showDashDone && "md:pb-24")}>
                {/* Main card container - white bg only on desktop */}
                <div className={cx("w-full md:bg-primary md:rounded-2xl md:shadow-xl", showDashDone && "md:overflow-hidden")}>
                    {/* Shared header — outside fade so progress bar transitions live (desktop hidden on done; sidebar owns that space) */}
                    <div className={cx("px-2 pt-4 pb-4 bg-secondary md:bg-transparent", showDashDone ? "md:hidden" : "md:px-8 md:pt-8 md:pb-0")}>
                        <DashboardHeader
                            stepNumber={showDashDone ? undefined : stepConfig.stepNumber}
                            title={showDashDone ? "Loan Application Submitted" : stepConfig.title}
                            progress={showDashDone ? 100 : stepConfig.progress}
                            nextStep={showDashDone ? "Dashboard done" : stepConfig.nextStep}
                            showWelcomeBanner={showWelcomeBanner}
                            onToggleWelcome={handleToggleWelcome}
                            onOpenMenu={showDashDone ? () => setShowMobileMenu(true) : undefined}
                        />
                    </div>
                    {/* Shared mobile progress bar */}
                    <div className="md:hidden h-1 w-full bg-fg-senary overflow-hidden">
                        <motion.div
                            className="h-full bg-brand-solid rounded-r-full"
                            initial={false}
                            animate={{ width: `${showDashDone ? 100 : stepConfig.progress}%` }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                        />
                    </div>
                    <div style={{
                        height: cardHeight === "auto" ? "auto" : `${cardHeight}px`,
                        transition: cardAnimPhase === "resize" ? `height ${RESIZE_DURATION}ms ease-in-out` : undefined,
                        overflow: cardAnimPhase !== "idle" ? "hidden" : undefined,
                    }}>
                    <div style={{
                        opacity: cardAnimPhase === "fadeOut" || cardAnimPhase === "resize" ? 0 : 1,
                        transition: `opacity ${FADE_DURATION}ms ease-in-out`,
                    }}>
                    {displayedDashDone ? (
                        <div ref={doneContentRef}>
                        <>
                        {/* Mobile done content (md:hidden) */}
                        <div className="md:hidden flex flex-col gap-4 px-2 pt-4 pb-6">
                            {doneActivePage === "upload" ? (
                                <UploadDocumentsContent
                                    statementsEntries={statementsFileEntries}
                                    statementsStatus={uploadStatementsStatus}
                                    onStatementsChange={handleStatementsChange}
                                    accountsEntries={accountsFileEntries}
                                    accountsStatus={uploadAccountsStatus}
                                    onAccountsChange={handleAccountsChange}
                                />
                            ) : (<>
                            {/* Timeline card */}
                            <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden">
                                {/* Card header */}
                                <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                            <CheckSquareBroken className="size-4 text-fg-brand-primary" />
                                        </div>
                                        <span className="text-md font-semibold text-secondary">Your dashboard is complete</span>
                                    </div>
                                    <div className="size-8 flex items-center justify-center">
                                        <HelpCircle className="size-4 text-fg-senary" />
                                    </div>
                                </div>
                                {/* Timeline body */}
                                <div className="flex flex-col px-4 py-4">
                                    {/* Item 1 */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className="size-6 rounded-full bg-brand-solid flex items-center justify-center z-10 shrink-0">
                                                <Check className="size-4 text-white" />
                                            </div>
                                            <div className="w-px bg-fg-brand-primary flex-1 mt-0.5" />
                                        </div>
                                        <div className="flex flex-col gap-1 pb-4 flex-1">
                                            <p className="text-md font-semibold text-brand-primary">Dashboard Filled</p>
                                            <p className="text-sm text-brand-primary">Your part is now done. Grab a drink, you've earned it.</p>
                                        </div>
                                    </div>
                                    {/* Item 2 */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className="size-6 rounded-full bg-fg-brand-primary flex items-center justify-center z-10 shrink-0">
                                                <Disc01 className="size-4 text-white" />
                                            </div>
                                            <div className="w-px bg-fg-senary flex-1 mt-0.5" />
                                        </div>
                                        <div className="flex flex-col gap-1 pb-4 flex-1">
                                            <p className="text-md font-semibold text-brand-primary">Application Pending</p>
                                            <p className="text-sm text-brand-primary">We'll get the first available account manager.</p>
                                        </div>
                                    </div>
                                    {/* Item 3 */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className="size-6 rounded-full bg-fg-senary border-2 border-fg-senary flex items-center justify-center z-10 shrink-0">
                                                <Placeholder className="size-4 text-white" />
                                            </div>
                                            <div className="w-px bg-fg-senary flex-1 mt-0.5" />
                                        </div>
                                        <div className="flex flex-col gap-1 pb-4 flex-1">
                                            <p className="text-md font-semibold text-quaternary">We Contact Lenders</p>
                                            <p className="text-sm text-quaternary">We'll contact all suitable lenders to find the best deal for you.</p>
                                        </div>
                                    </div>
                                    {/* Item 4 */}
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className="size-6 rounded-full bg-fg-senary border-2 border-fg-senary flex items-center justify-center z-10 shrink-0">
                                                <Placeholder className="size-4 text-white" />
                                            </div>
                                            <div className="flex flex-col items-center flex-1 mt-0.5">
                                                <div className="w-px bg-fg-senary flex-1" />
                                                <svg width="9" height="8" viewBox="0 0 9 8" fill="none" className="text-fg-senary shrink-0">
                                                    <polyline points="0,0.5 4.5,7.5 9,0.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 flex-1">
                                            <p className="text-md font-semibold text-quaternary">We'll Call You</p>
                                            <p className="text-sm text-quaternary">An account manager will be in touch with you.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Footer text */}
                            <div className="pt-6">
                                <p className="text-sm text-quaternary text-center">That's it for now. New notifications will appear here.</p>
                            </div>
                            </>)}
                        </div>
                        {/* Mobile trustpilot (md:hidden) */}
                        <div className="md:hidden flex justify-center pb-6 mt-auto">
                            <TrustpilotSection variant="light" />
                        </div>
                        {/* Desktop done content (hidden md:flex) */}
                        <div className="hidden md:flex min-h-180">
                            {/* Sidebar - slides in from left */}
                            <motion.div
                                className="shrink-0 w-56 lg:w-68 pl-2 py-2 flex flex-col self-stretch"
                                initial={{ x: -272, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                            >
                                <div className="flex flex-col flex-1 h-full border border-secondary rounded-xl shadow-xs">
                                    <DashboardMenuContent activePage={doneActivePage} onNavigate={setDoneActivePage} firstName={firstName} lastName={lastName} email={email} />
                                </div>
                            </motion.div>
                            {/* Main done content - slides right */}
                            <motion.div
                                className="flex-1 flex flex-col items-center pt-8 pb-12 rounded-tl-[40px] bg-primary"
                                initial={{ x: -272 }}
                                animate={{ x: 0 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                            >
                                <div className="flex flex-col gap-8 items-end max-w-256 w-full px-4 md:px-8">
                                    {/* Header */}
                                    <motion.div
                                        className="w-full"
                                        initial={{ opacity: 0, y: -12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
                                    >
                                        <DashboardHeader
                                            title="Loan Application Submitted"
                                            progress={100}
                                            nextStep="Dashboard done"
                                            showWelcomeBanner={false}
                                            onToggleWelcome={() => {}}
                                            hideButton
                                            hideNextPrefix
                                        />
                                    </motion.div>
                                    {/* Page content — switches based on active nav */}
                                    {doneActivePage === "upload" ? (
                                        <motion.div
                                            key="upload"
                                            className="w-full"
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                        >
                                            <UploadDocumentsContent
                                    statementsEntries={statementsFileEntries}
                                    statementsStatus={uploadStatementsStatus}
                                    onStatementsChange={handleStatementsChange}
                                    accountsEntries={accountsFileEntries}
                                    accountsStatus={uploadAccountsStatus}
                                    onAccountsChange={handleAccountsChange}
                                />
                                        </motion.div>
                                    ) : (
                                        <>
                                        {/* Card */}
                                        <motion.div
                                            key="pending"
                                            className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none w-full max-w-240"
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, ease: "easeOut", delay: 0.25 }}
                                        >
                                            {/* Card header */}
                                            <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                        <CheckSquareBroken className="size-4 text-fg-brand-primary" />
                                                    </div>
                                                    <span className="text-md font-semibold text-secondary">Your dashboard is complete</span>
                                                </div>
                                                <div className="size-8 flex items-center justify-center">
                                                    <HelpCircle className="size-4 text-fg-senary" />
                                                </div>
                                            </div>
                                            {/* Timeline body */}
                                            <div className="flex items-start px-8 pt-8 pb-6">
                                                {/* Step 1 */}
                                                <div className="flex flex-col gap-4 flex-1 min-w-0">
                                                    <div className="flex items-center">
                                                        <div className="size-6 rounded-full bg-brand-solid flex items-center justify-center shrink-0 z-10">
                                                            <Check className="size-4 text-white" />
                                                        </div>
                                                        <div className="flex-1 h-0.5 bg-fg-brand-primary" />
                                                    </div>
                                                    <div className="flex flex-col gap-3 pr-4">
                                                        <p className="text-md font-semibold text-brand-primary">Dashboard Filled</p>
                                                        <p className="text-sm text-brand-primary">Your part is now done. Grab a drink, you've earned it.</p>
                                                    </div>
                                                </div>
                                                {/* Step 2 */}
                                                <div className="flex flex-col gap-4 flex-1 min-w-0">
                                                    <div className="flex items-center">
                                                        <div className="size-6 rounded-full bg-fg-brand-primary flex items-center justify-center shrink-0 z-10">
                                                            <Disc01 className="size-4 text-white" />
                                                        </div>
                                                        <div className="flex-1 h-0.5 bg-quaternary" />
                                                    </div>
                                                    <div className="flex flex-col gap-3 pr-4">
                                                        <p className="text-md font-semibold text-brand-primary">Application Pending</p>
                                                        <p className="text-sm text-brand-primary">We'll get the first available account manager.</p>
                                                    </div>
                                                </div>
                                                {/* Step 3 */}
                                                <div className="flex flex-col gap-4 flex-1 min-w-0">
                                                    <div className="flex items-center">
                                                        <div className="size-6 rounded-full bg-fg-senary border-2 border-fg-senary flex items-center justify-center shrink-0 z-10">
                                                            <Placeholder className="size-4 text-white" />
                                                        </div>
                                                        <div className="flex-1 h-0.5 bg-quaternary" />
                                                    </div>
                                                    <div className="flex flex-col gap-3 pr-4">
                                                        <p className="text-md font-semibold text-quaternary">We Contact Lenders</p>
                                                        <p className="text-sm text-quaternary">We'll contact all suitable lenders to find the best deal for you.</p>
                                                    </div>
                                                </div>
                                                {/* Step 4 */}
                                                <div className="flex flex-col gap-4 flex-1 min-w-0">
                                                    <div className="flex items-center">
                                                        <div className="size-6 rounded-full bg-fg-senary border-2 border-fg-senary flex items-center justify-center shrink-0 z-10">
                                                            <Placeholder className="size-4 text-white" />
                                                        </div>
                                                        <div className="flex-1 h-0.5 bg-quaternary" />
                                                        <ArrowRight className="size-5 text-bg-quaternary shrink-0" />
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        <p className="text-md font-semibold text-quaternary">We'll Call You</p>
                                                        <p className="text-sm text-quaternary">An account manager will be in touch with you.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                        {/* Footer text */}
                                        <div className="pt-6 w-full">
                                            <p className="text-sm text-quaternary text-center">That's it for now. New notifications will appear here.</p>
                                        </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                        </>
                        </div>
                    ) : (
                    <div ref={cardContentRef} className="flex flex-col items-center md:pb-16 md:px-8">
                        {/* Inner content container */}
                        <div className="flex flex-col w-full max-w-240">

                            {/* Welcome banner - shared across both steps */}
                            <div
                                className="px-2 md:px-0"
                                style={{
                                    opacity: welcomeBannerVisible ? 1 : 0,
                                    maxHeight: showWelcomeBanner ? "500px" : "0px",
                                    marginBottom: "0px",
                                    overflow: "hidden",
                                    transition: "opacity 150ms ease-out, max-height 300ms ease-out, margin-bottom 300ms ease-out",
                                }}
                            >
                                <div className="mt-4 md:mt-6">
                                <div
                                    className="flex flex-col md:flex-row bg-primary md:bg-secondary rounded-xl overflow-hidden border border-secondary"
                                >
                                    {/* Video thumbnail */}
                                    <button
                                        onClick={() => setShowVideoModal(true)}
                                        className="relative w-full md:w-60 h-40 md:h-auto shrink-0 overflow-hidden cursor-pointer"
                                    >
                                        <img src="/videothumbnail.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 border border-black/8 rounded-l-xl pointer-events-none" />
                                        <div className="absolute bottom-3 left-3 size-12 rounded-full backdrop-blur flex items-center justify-center hover:scale-105 transition-transform">
                                            <img src="/playbutton.svg" alt="Play" className="size-full" />
                                        </div>
                                    </button>
                                    {/* Content */}
                                    <div className="flex-1 p-4 relative border-b border-secondary md:border-t md:border-r rounded-r-xl">
                                        <button
                                            onClick={handleDismissWelcome}
                                            className="absolute top-2 right-2 p-1 text-fg-senary hover:text-tertiary transition-colors"
                                        >
                                            <XClose className="size-6" />
                                        </button>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-0.5">
                                                <h2 className="text-lg font-semibold text-primary">Welcome to your dashboard!</h2>
                                                <p className="text-sm text-tertiary">Watch this short video to get started with your dashboard.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button color="secondary" size="md" onClick={handleDismissWelcome}>Dismiss</Button>
                                                <Button color="primary" size="md" onClick={() => setShowVideoModal(true)}>Watch video</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>

                            {/* Animated content area */}
                            <div style={{
                                height: dashContentHeight === "auto" ? "auto" : `${dashContentHeight}px`,
                                transition: dashAnimPhase === "resize" ? `height ${RESIZE_DURATION}ms ease-in-out` : undefined,
                                overflow: dashAnimPhase !== "idle" ? "hidden" : undefined,
                            }}>
                            <div style={{
                                opacity: dashAnimPhase === "fadeOut" || dashAnimPhase === "resize" ? 0 : 1,
                                transition: `opacity ${FADE_DURATION}ms ease-in-out`,
                            }}>

                            {/* Step 1 content */}
                            {displayedDashStep === 1 && (
                            <div ref={step1ContentRef} className="flex flex-col gap-4 md:gap-6 px-2 md:px-0 pt-4 pb-6 md:pt-6 md:pb-0 bg-secondary md:bg-transparent">

                            {/* Card: What address is this company trading from */}
                            <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs md:shadow-none">
                                {/* Card header */}
                                <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                            <Building06 className="size-4 text-fg-brand-primary" />
                                        </div>
                                        <span className="text-md font-semibold text-secondary">What address is this company trading from?</span>
                                    </div>
                                    <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                        <TooltipTrigger className="size-8 flex items-center justify-center">
                                            <HelpCircle className="size-4 text-fg-senary" />
                                        </TooltipTrigger>
                                    </Tooltip>
                                </div>
                                {/* Card body - Trading address lookup */}
                                <div className="p-4">
                                    <div
                                        ref={tradingAddressInputRef}
                                        className="relative w-full md:w-1/2"
                                    >
                                        <Input
                                            label="Trading address"
                                            placeholder="Start typing to search"
                                            icon={SearchMd}
                                            value={tradingAddressSearchText || tradingAddress}
                                            onChange={handleTradingAddressSearchChange}
                                        />

                                        {/* Address search dropdown */}
                                        {tradingAddressDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-primary border border-secondary rounded-lg shadow-lg z-10 py-1 max-h-55 overflow-y-auto">
                                                {tradingAddressSearching ? (
                                                    <div className="px-1.5 py-px">
                                                        <div className="p-2 rounded-md">
                                                            <p className="text-quaternary text-base">
                                                                Searching for addresses..
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    staticAddresses.map((addr) => {
                                                        const isSelected = tradingAddress === addr.address;
                                                        return (
                                                            <div
                                                                key={addr.id}
                                                                className="px-1.5 py-px"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleTradingAddressSelect(addr)}
                                                                    className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors hover:bg-active ${
                                                                        isSelected ? "bg-active" : ""
                                                                    }`}
                                                                >
                                                                    <span className="text-primary text-base flex-1">
                                                                        {addr.address}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <Check className="size-5 text-fg-brand-primary shrink-0" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card: Tell us about your turnover */}
                            <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none">
                                {/* Card header */}
                                <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                            <CreditCardRefresh className="size-4 text-fg-brand-primary" />
                                        </div>
                                        <span className="text-md font-semibold text-secondary">Tell us about your turnover</span>
                                    </div>
                                    <Tooltip title="Why do we ask?" description="Your turnover helps lenders understand your business and offer you the right deal. It's only shared with lenders relevant to your application." arrow placement="top right">
                                        <TooltipTrigger className="size-8 flex items-center justify-center">
                                            <HelpCircle className="size-4 text-fg-senary" />
                                        </TooltipTrigger>
                                    </Tooltip>
                                </div>
                                {/* Card body */}
                                <div className="p-4">
                                    <div className="flex flex-col md:flex-row gap-3 md:items-start">
                                        {/* Turnover input with £ prefix */}
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <label className="text-secondary font-medium text-sm">
                                                Your turnover for the past 12 months
                                            </label>
                                            <div className="flex w-full h-11 rounded-lg bg-primary shadow-xs ring-1 ring-inset ring-primary focus-within:ring-2 focus-within:ring-brand overflow-hidden">
                                                <div className="flex items-center pl-3.5 shrink-0">
                                                    <span className="text-placeholder text-md">£</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9,]*"
                                                    placeholder="100,000"
                                                    value={turnover12Months}
                                                    onChange={(e) => setTurnover12Months(e.target.value)}
                                                    className="flex-1 bg-transparent text-md text-primary pl-0.5 pr-3.5 outline-none placeholder:text-placeholder"
                                                />
                                            </div>
                                            <p className="text-tertiary text-sm">Feel free to round to the nearest £1000</p>
                                        </div>
                                        {/* VAT checkbox */}
                                        <div className="md:pl-2 md:pt-6 md:w-[458px]">
                                            <Checkbox
                                                size="md"
                                                isSelected={vatAutoTicked || vatRegistered}
                                                onChange={setVatRegistered}
                                                isDisabled={vatAutoTicked}
                                                label="I'm registered for VAT"
                                                hint="You must check this if your turnover was over 90K"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Tell us about your turnover (second entry) */}
                            <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none">
                                {/* Card header */}
                                <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                            <CreditCardRefresh className="size-4 text-fg-brand-primary" />
                                        </div>
                                        <span className="text-md font-semibold text-secondary">How about your turnover in 2019?</span>
                                    </div>
                                    <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                        <TooltipTrigger className="size-8 flex items-center justify-center">
                                            <HelpCircle className="size-4 text-fg-senary" />
                                        </TooltipTrigger>
                                    </Tooltip>
                                </div>
                                {/* Card body */}
                                <div className="p-4">
                                    <div className="flex flex-col gap-1.5 md:w-[458px]">
                                        <label className="text-secondary font-medium text-sm">
                                            Your turnover in 2019
                                        </label>
                                        <div className="flex w-full h-11 rounded-lg bg-primary shadow-xs ring-1 ring-inset ring-primary focus-within:ring-2 focus-within:ring-brand overflow-hidden">
                                            <div className="flex items-center pl-3.5 shrink-0">
                                                <span className="text-placeholder text-md">£</span>
                                            </div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9,]*"
                                                placeholder="100,000"
                                                value={turnover2019}
                                                onChange={(e) => setTurnover2019(e.target.value)}
                                                className="flex-1 bg-transparent text-md text-primary pl-0.5 pr-3.5 outline-none placeholder:text-placeholder"
                                            />
                                        </div>
                                        <p className="text-tertiary text-sm">Feel free to round to the nearest £1000</p>
                                    </div>
                                </div>
                            </div>

                            {/* Continue button */}
                            <div className="pt-2 md:flex md:justify-end">
                                <Button
                                    color="primary"
                                    size="lg"
                                    iconTrailing={ArrowRight}
                                    isDisabled={!isDashboardStep1Valid}
                                    onClick={() => animateToDashStep(2)}
                                    className="w-full md:w-auto"
                                >
                                    Continue
                                </Button>
                            </div>
                            </div>
                            )}

                            {/* Step 2 content */}
                            {displayedDashStep === 2 && (
                            <div ref={step2ContentRef} className="flex flex-col gap-4 md:gap-6 px-2 md:px-0 pt-4 pb-6 md:pt-6 md:pb-0 bg-secondary md:bg-transparent">
                                {/* Card: Legal questions */}
                                <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none">
                                    {/* Card header */}
                                    <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                <FileHeart02 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <span className="text-md font-semibold text-secondary">Just some further questions, to make sure we are the right fit</span>
                                        </div>
                                        <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                            <TooltipTrigger className="size-8 flex items-center justify-center">
                                                <HelpCircle className="size-4 text-fg-senary" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>
                                    {/* Card body - Yes/No questions in 2-col grid */}
                                    <div className="p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-10 md:gap-y-6">
                                            {/* Q1: Buy land or property */}
                                            <div className="flex flex-col gap-3">
                                                <p className="text-md text-primary">Will this loan be used to buy land or property with the sole intent of renting or selling it?</p>
                                                <div className="flex w-full border border-primary rounded-lg shadow-xs-skeumorphic overflow-hidden h-10 mt-auto">
                                                    <button type="button" onClick={() => setLegalBuyLand(true)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md border-r border-primary transition-colors ${legalBuyLand === true ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>Yes</button>
                                                    <button type="button" onClick={() => setLegalBuyLand(false)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md transition-colors ${legalBuyLand === false ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>No</button>
                                                </div>
                                            </div>

                                            {/* Q2: Used by another company */}
                                            <div className="flex flex-col gap-3">
                                                <p className="text-md text-primary">Will this loan be used by a company besides Big Bidess LTD?</p>
                                                <div className="flex w-full border border-primary rounded-lg shadow-xs-skeumorphic overflow-hidden h-10 mt-auto">
                                                    <button type="button" onClick={() => setLegalOtherCompany(true)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md border-r border-primary transition-colors ${legalOtherCompany === true ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>Yes</button>
                                                    <button type="button" onClick={() => setLegalOtherCompany(false)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md transition-colors ${legalOtherCompany === false ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>No</button>
                                                </div>
                                            </div>

                                            {/* Q3: Settle personal debt */}
                                            <div className="flex flex-col gap-3">
                                                <p className="text-md text-primary">Will this loan be used to settle personal debt?</p>
                                                <div className="flex w-full border border-primary rounded-lg shadow-xs-skeumorphic overflow-hidden h-10 mt-auto">
                                                    <button type="button" onClick={() => setLegalSettleDebt(true)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md border-r border-primary transition-colors ${legalSettleDebt === true ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>Yes</button>
                                                    <button type="button" onClick={() => setLegalSettleDebt(false)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md transition-colors ${legalSettleDebt === false ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>No</button>
                                                </div>
                                            </div>

                                            {/* Q4: Outside the UK */}
                                            <div className="flex flex-col gap-3">
                                                <p className="text-md text-primary">Will this loan be used to fund an opportunity outside the UK?</p>
                                                <div className="flex w-full border border-primary rounded-lg shadow-xs-skeumorphic overflow-hidden h-10 mt-auto">
                                                    <button type="button" onClick={() => setLegalOutsideUK(true)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md border-r border-primary transition-colors ${legalOutsideUK === true ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>Yes</button>
                                                    <button type="button" onClick={() => setLegalOutsideUK(false)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md transition-colors ${legalOutsideUK === false ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>No</button>
                                                </div>
                                            </div>

                                            {/* Q5: Change trading activity */}
                                            <div className="flex flex-col gap-3">
                                                <p className="text-md text-primary">Will this loan be used to significantly change the business' main trading activity? (e.g. retail business to manufacturing business)</p>
                                                <div className="flex w-full border border-primary rounded-lg shadow-xs-skeumorphic overflow-hidden h-10 mt-auto">
                                                    <button type="button" onClick={() => setLegalChangeTradingActivity(true)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md border-r border-primary transition-colors ${legalChangeTradingActivity === true ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>Yes</button>
                                                    <button type="button" onClick={() => setLegalChangeTradingActivity(false)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md transition-colors ${legalChangeTradingActivity === false ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>No</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card: Disclosure */}
                                <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none">
                                    {/* Card header */}
                                    <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                <Share05 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <span className="text-md font-semibold text-secondary">We will disclose some of these answers to external lenders</span>
                                        </div>
                                        <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                            <TooltipTrigger className="size-8 flex items-center justify-center">
                                                <HelpCircle className="size-4 text-fg-senary" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>
                                    {/* Card body - Disclosure text and checkbox */}
                                    <div className="p-4 flex flex-col gap-4">
                                        <div className="pl-3 py-2 border-l-2 border-brand-solid">
                                            <p className="text-sm text-secondary leading-relaxed">
                                                We plan to show you credit offers from carefully selected providers. These providers will share your information with credit reference agencies to run soft credit and identity checks, but don't worry this will not affect your credit score. They will also share it with fraud prevention agencies - please be aware, if they do spot fraud, you or others could be refused services, finance or employment. The director who is designated or otherwise identified as the applicant ("The applicant") in connection with this application shall, by virtue of such designation and the submission of this application, concurrently and automatically assume all duties, responsibilities, and liabilities of a guarantor. By ticking the box below, you agree to our <a href="#" className="text-brand-secondary underline">Terms of Business</a> and <a href="#" className="text-brand-secondary underline">Privacy Policy</a>.
                                            </p>
                                        </div>
                                        <Checkbox
                                            size="md"
                                            isSelected={agreedToShare}
                                            onChange={setAgreedToShare}
                                            label="I agree to share my data with external lenders"
                                        />
                                    </div>
                                </div>

                                {/* Navigation buttons */}
                                <div className="flex justify-between items-center gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => animateToDashStep(1)}
                                        className="p-3 bg-primary border border-disabled_subtle rounded-lg shadow-xs hover:bg-primary_hover transition-colors"
                                    >
                                        <ArrowLeft className="size-5 text-fg-secondary" />
                                    </button>
                                    <Button
                                        color="primary"
                                        size="lg"
                                        iconTrailing={ArrowRight}
                                        isDisabled={!isDashboardStep2Valid}
                                        onClick={() => animateToDashStep(3)}
                                        className="w-full md:w-auto"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                            )}

                            {/* Step 3 content - Directors */}
                            {displayedDashStep === 3 && (
                            <div ref={step3ContentRef} className="flex flex-col gap-4 md:gap-6 px-2 md:px-0 pt-4 pb-6 md:pt-6 md:pb-0 bg-secondary md:bg-transparent">
                                {/* Info card - 50% rule */}
                                <div
                                    style={{
                                        opacity: step3InfoVisible ? 1 : 0,
                                        maxHeight: showStep3Info ? "500px" : "0px",
                                        overflow: "hidden",
                                        transition: "opacity 150ms ease-out, max-height 300ms ease-out",
                                    }}
                                >
                                    <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs md:bg-secondary md:shadow-none relative">
                                        <div className="flex items-center gap-1 pl-4 pr-3 py-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="size-8 rounded-full bg-tertiary md:bg-primary flex items-center justify-center shrink-0">
                                                    <InfoCircle className="size-4 text-fg-quaternary" />
                                                </div>
                                                <span className="text-md text-secondary">
                                                    We only need details for directors who together own 50% or more.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {[...applicants].sort((a, b) => b.ownership - a.ownership).map((director) => {
                                    const info = getDirectorInfo(director.id);
                                    return (
                                    <Fragment key={director.id}>
                                        <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs md:shadow-none">
                                            {/* Card header */}
                                            <div className="flex items-center justify-between pl-4 pr-5 py-3 border-b border-secondary">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                        <Users01 className="size-4 text-fg-brand-primary" />
                                                    </div>
                                                    <span className="text-md font-semibold text-secondary">Tell us more about {director.name}</span>
                                                </div>
                                                <span className="text-md text-tertiary shrink-0">{director.ownership}%</span>
                                            </div>
                                            {/* Card body */}
                                            <div className="p-4">
                                                <div className="flex flex-col gap-8 md:gap-6">
                                                    {/* Group 1: Name, Date of Birth, Email */}
                                                    <div className="flex flex-col md:flex-row gap-4">
                                                        <div className="flex-1">
                                                            <Input
                                                                label="Name"
                                                                value={director.name}
                                                                isDisabled
                                                                inputClassName="text-disabled"
                                                                onChange={() => {}}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <DateField
                                                                label="Date of Birth"
                                                                granularity="day"
                                                                value={info.dateOfBirth}
                                                                onChange={(val) => updateDirectorInfo(director.id, { dateOfBirth: val })}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <Input
                                                                label="Email Address"
                                                                placeholder="name@businessmail.com"
                                                                type="email"
                                                                autoComplete="email"
                                                                value={info.email}
                                                                onChange={(value) => {
                                                                    updateDirectorInfo(director.id, { email: value, emailError: false });
                                                                }}
                                                                onBlur={() => {
                                                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                                    if (info.email && !emailRegex.test(info.email)) {
                                                                        updateDirectorInfo(director.id, { emailError: true });
                                                                    }
                                                                }}
                                                                isInvalid={info.emailError}
                                                            />
                                                        </div>
                                                    </div>
                                                    {/* Group 2: Address rows - same 3-year history logic as step 1 */}
                                                    <div className="flex flex-col gap-4 md:gap-6">
                                                    {info.addresses.map((entry, rowIndex) => (
                                                        <div key={rowIndex} className="flex flex-col md:flex-row gap-2 md:gap-4">
                                                            <div className="w-full md:w-1/2">
                                                                <div
                                                                    ref={(el) => { directorAddressInputRefs.current[`${director.id}-${rowIndex}`] = el; }}
                                                                    className="relative w-full"
                                                                >
                                                                    <Input
                                                                        label={rowIndex === 0 ? "Current address" : "Address before that"}
                                                                        placeholder="Start typing to search"
                                                                        icon={SearchMd}
                                                                        value={info.addressSearchText[rowIndex] ?? entry.address}
                                                                        onChange={(value) => handleDirectorAddressSearch(director.id, rowIndex, value)}
                                                                    />
                                                                    {info.addressDropdownOpen[rowIndex] && (
                                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-primary border border-secondary rounded-lg shadow-lg z-10 py-1 max-h-55 overflow-y-auto">
                                                                            {info.addressSearching[rowIndex] ? (
                                                                                <div className="px-1.5 py-px">
                                                                                    <div className="p-2 rounded-md">
                                                                                        <p className="text-quaternary text-base">
                                                                                            Searching for addresses..
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                staticAddresses.map((addr) => {
                                                                                    const isSelected = entry.address === addr.address;
                                                                                    return (
                                                                                        <div key={addr.id} className="px-1.5 py-px">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleDirectorAddressSelect(director.id, rowIndex, addr)}
                                                                                                className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors hover:bg-active ${isSelected ? "bg-active" : ""}`}
                                                                                            >
                                                                                                <span className="text-primary text-base flex-1">{addr.address}</span>
                                                                                                {isSelected && <Check className="size-5 text-fg-brand-primary shrink-0" />}
                                                                                            </button>
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 md:gap-4 w-full md:w-1/2">
                                                                <div className="flex-1">
                                                                    <MonthYearField
                                                                        label="Moved in"
                                                                        value={entry.movedIn}
                                                                        isInvalid={isDateInFuture(entry.movedIn)}
                                                                        onChange={(value) => handleDirectorMovedInChange(director.id, rowIndex, value)}
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    {rowIndex === 0 ? (
                                                                        <Input
                                                                            label="Moved out"
                                                                            value="Not yet"
                                                                            isDisabled
                                                                            inputClassName="text-disabled"
                                                                            onChange={() => {}}
                                                                        />
                                                                    ) : (
                                                                        <MonthYearField
                                                                            label="Moved out"
                                                                            value={entry.movedOut}
                                                                            isInvalid={isDateInFuture(entry.movedOut)}
                                                                            onChange={(value) => handleDirectorMovedOutChange(director.id, rowIndex, value)}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Request info button */}
                                        <div className="flex justify-center -mt-2">
                                            <Button
                                                color="tertiary"
                                                size="sm"
                                                onClick={() => {
                                                    const subject = encodeURIComponent("Request of Address History for a loan with Lovey");
                                                    const body = encodeURIComponent("Adipisicing duis fugiat ipsum consectetur officia ea anim pariatur in velit. Labore consectetur Lorem ad occaecat reprehenderit qui occaecat non aliquip sit minim id ad. Adipisicing cillum est ullamco elit laboris dolore aute pariatur adipisicing ea ullamco pariatur.");
                                                    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
                                                }}
                                            >
                                                Request this information from {director.name}
                                            </Button>
                                        </div>
                                    </Fragment>
                                    );
                                })}

                                {/* Navigation buttons */}
                                <div className="flex justify-between items-center gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => animateToDashStep(2)}
                                        className="p-3 bg-primary border border-disabled_subtle rounded-lg shadow-xs hover:bg-primary_hover transition-colors"
                                    >
                                        <ArrowLeft className="size-5 text-fg-secondary" />
                                    </button>
                                    <Button
                                        color="primary"
                                        size="lg"
                                        iconTrailing={ArrowRight}
                                        isDisabled={!isDashboardStep3Valid}
                                        onClick={() => animateToDashStep(4)}
                                        className="w-full md:w-auto"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                            )}

                            {/* Step 4 content - Finances */}
                            {displayedDashStep === 4 && (
                            <div ref={step4ContentRef} className="flex flex-col gap-4 md:gap-6 px-2 md:px-0 pt-4 md:pt-6 bg-secondary md:bg-transparent">
                                {/* Card: Share some of your accounts */}
                                <div className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none">
                                    {/* Card header */}
                                    <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                <FileCheck02 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <span className="text-md font-semibold text-secondary">Share some of your accounts</span>
                                        </div>
                                        <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                            <TooltipTrigger className="size-8 flex items-center justify-center">
                                                <HelpCircle className="size-4 text-fg-senary" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>
                                    {/* Card body - Connect bank OR upload */}
                                    <div className="p-4 md:pb-2">
                                        <div className="flex flex-col md:flex-row gap-3">
                                            {/* Connect your bank */}
                                            <button
                                                className="relative flex-1 py-2 cursor-pointer disabled:cursor-not-allowed"
                                                onClick={openPlaidLink}
                                                disabled={plaidLoading || plaidSuccess}
                                            >
                                                <div className={`flex flex-col items-center justify-center gap-4 h-full min-h-[200px] rounded-lg border border-primary shadow-xs p-3 transition-colors ${!plaidSuccess && !plaidLoading ? "hover:bg-primary_hover" : ""}`}>
                                                    {plaidLoading ? (
                                                        <>
                                                            <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic">
                                                                <Loading01 className="size-5 text-fg-secondary animate-spin" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-sm font-bold text-secondary">Connect your bank</p>
                                                                <p className="text-sm text-tertiary">Connecting...</p>
                                                            </div>
                                                        </>
                                                    ) : plaidSuccess ? (
                                                        <>
                                                            <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic">
                                                                <CheckSquareBroken className="size-5 text-fg-success-primary" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-sm font-bold text-secondary">Bank Connected</p>
                                                                <p className="text-sm text-tertiary">Plaid Connection Successful</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic">
                                                                <QrCode02 className="size-5 text-fg-secondary" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-sm font-bold text-secondary">Connect your bank</p>
                                                                <p className="text-sm text-tertiary md:hidden">You'll continue on your bank's app or website</p>
                                                                <p className="text-sm text-tertiary hidden md:block">You'll only need your phone</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Badge — hidden once connected */}
                                                {!plaidSuccess && (
                                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 rounded bg-[#b8acd0]">
                                                        <ZapFast className="size-4 text-brand-primary" />
                                                        <span className="text-xs text-brand-primary">Takes less than a minute</span>
                                                    </div>
                                                )}
                                            </button>
                                            {/* Plaid error */}
                                            {plaidError && (
                                                <p className="text-sm text-error-primary px-1">{plaidError}</p>
                                            )}

                                            {/* OR divider */}
                                            <div className="flex md:flex-col items-center gap-2 py-2 shrink-0">
                                                <div className="flex-1 w-full md:w-px h-px md:h-full bg-border-primary" />
                                                <span className="text-sm font-semibold text-quaternary">OR</span>
                                                <div className="flex-1 w-full md:w-px h-px md:h-full bg-border-primary" />
                                            </div>

                                            {/* Upload options */}
                                            <div className="flex-1 flex flex-col gap-4 py-2">
                                                <input ref={statementsInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleStatementsChange} />
                                                <button
                                                    className="relative flex-1 flex items-center gap-4 rounded-lg p-3 md:p-7 min-h-32 hover:bg-primary_hover transition-colors disabled:cursor-not-allowed"
                                                    onClick={() => statementsInputRef.current?.click()}
                                                    disabled={uploadStatementsStatus === "uploading"}
                                                >
                                                    <svg className="absolute inset-0 size-full pointer-events-none" preserveAspectRatio="none">
                                                        <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="8" ry="8" fill="none" stroke="var(--color-border-primary)" strokeWidth="1" strokeDasharray="8 8" />
                                                    </svg>
                                                    {uploadStatementsStatus === "uploading" ? (
                                                        <>
                                                            <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic shrink-0">
                                                                <Loading01 className="size-5 text-fg-secondary animate-spin" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-secondary">Uploading...</p>
                                                            </div>
                                                        </>
                                                    ) : uploadStatementsCount > 0 ? (
                                                        <>
                                                            <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic shrink-0">
                                                                <CheckSquareBroken className="size-5 text-fg-success-primary" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-secondary">Upload your past 6 months' bank statements</p>
                                                                <p className="text-sm text-tertiary">{uploadStatementsCount} {uploadStatementsCount === 1 ? "file" : "files"} uploaded</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic shrink-0">
                                                                <UploadCloud02 className="size-5 text-fg-secondary" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-secondary">Upload your past 6 months' bank statements</p>
                                                                <p className="text-sm text-tertiary">PDF, max Xmb</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </button>
                                                <input ref={accountsInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleAccountsChange} />
                                                <button
                                                    className="relative flex-1 flex items-center gap-4 rounded-lg p-3 md:p-7 min-h-32 hover:bg-primary_hover transition-colors disabled:cursor-not-allowed"
                                                    onClick={() => accountsInputRef.current?.click()}
                                                    disabled={uploadAccountsStatus === "uploading"}
                                                >
                                                    <svg className="absolute inset-0 size-full pointer-events-none" preserveAspectRatio="none">
                                                        <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" rx="8" ry="8" fill="none" stroke="var(--color-border-primary)" strokeWidth="1" strokeDasharray="8 8" />
                                                    </svg>
                                                    {uploadAccountsStatus === "uploading" ? (
                                                        <>
                                                            <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic shrink-0">
                                                                <Loading01 className="size-5 text-fg-secondary animate-spin" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-secondary">Uploading...</p>
                                                            </div>
                                                        </>
                                                    ) : uploadAccountsCount > 0 ? (
                                                        <>
                                                            <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic shrink-0">
                                                                <CheckSquareBroken className="size-5 text-fg-success-primary" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-secondary">Upload last full set of accounts</p>
                                                                <p className="text-sm text-tertiary">{uploadAccountsCount} {uploadAccountsCount === 1 ? "file" : "files"} uploaded</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic shrink-0">
                                                                <UploadCloud02 className="size-5 text-fg-secondary" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-secondary">Upload last full set of accounts</p>
                                                                <p className="text-sm text-tertiary">PDF, max Xmb</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </button>
                                                {/* Request paperwork card */}
                                                <div className="bg-secondary border border-secondary rounded-xl p-3 shadow-xs flex flex-col gap-4">
                                                    <div className="flex gap-3 items-start">
                                                        <div className="p-2.5 rounded-lg border border-secondary bg-primary shadow-xs-skeumorphic shrink-0">
                                                            <Mail05 className="size-5 text-fg-secondary" />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-sm font-semibold text-primary">Don't have these files at hand?</p>
                                                            <p className="text-sm text-tertiary">Don't worry we've composed an email for you, just send it to your accountant.</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        color="secondary"
                                                        size="md"
                                                        className="w-full"
                                                        onClick={() => {
                                                            const subject = encodeURIComponent("request for paperwork");
                                                            const body = encodeURIComponent("Adipisicing duis fugiat ipsum consectetur officia ea anim pariatur in velit. Labore consectetur Lorem ad occaecat reprehenderit qui occaecat non aliquip sit minim id ad. Adipisicing cillum est ullamco elit laboris dolore aute pariatur adipisicing ea ullamco pariatur.");
                                                            window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
                                                        }}
                                                    >
                                                        Request paperwork
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation buttons */}
                                <div className="flex justify-between items-center gap-4 px-2 md:px-0">
                                    <button
                                        type="button"
                                        onClick={() => animateToDashStep(3)}
                                        className="p-3 bg-primary border border-disabled_subtle rounded-lg shadow-xs hover:bg-primary_hover transition-colors"
                                    >
                                        <ArrowLeft className="size-5 text-fg-secondary" />
                                    </button>
                                    <Button
                                        color="primary"
                                        size="lg"
                                        iconTrailing={ArrowRight}
                                        isDisabled={!isDashboardStep4Valid}
                                        onClick={() => animateToDashStep(5)}
                                        className="w-full md:w-auto"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                            )}

                            {/* ─── Step 5: Check ─── */}
                            {displayedDashStep === 5 && (
                            <div ref={step5ContentRef} className="flex flex-col gap-4 md:gap-6 px-2 md:px-0 pt-4 pb-6 md:pt-6 md:pb-0 bg-secondary md:bg-transparent">
                                {/* Your Business */}
                                <button type="button" onClick={() => animateToDashStep(1)} className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none text-left w-full cursor-pointer hover:bg-primary_hover transition-colors">
                                    <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                <Dice1 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <span className="text-md font-semibold text-secondary">Your Business</span>
                                        </div>
                                        <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                            <TooltipTrigger className="size-8 flex items-center justify-center">
                                                <HelpCircle className="size-4 text-fg-senary" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 px-4 py-4 md:px-5">
                                            <div>
                                                <p className="text-sm text-tertiary">Trading address</p>
                                                <p className="text-sm font-bold text-secondary truncate">{tradingAddress || "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-tertiary">Turnover for the past 12 months</p>
                                                <p className="text-sm font-bold text-secondary">{turnover12Months ? `£${turnover12Months}` : "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-tertiary">Registered for VAT</p>
                                                <p className="text-sm font-bold text-secondary">{vatRegistered || vatAutoTicked ? "Yes" : "No"}</p>
                                            </div>
                                        </div>
                                        <div className="mx-4 border-t border-tertiary" />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 px-4 py-4 md:px-5">
                                            <div>
                                                <p className="text-sm text-tertiary">Turnover in 2019</p>
                                                <p className="text-sm font-bold text-secondary">{turnover2019 ? `£${turnover2019}` : "—"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Legal Bits */}
                                <button type="button" onClick={() => animateToDashStep(2)} className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none text-left w-full cursor-pointer hover:bg-primary_hover transition-colors">
                                    <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                <Dice2 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <span className="text-md font-semibold text-secondary">Legal Bits</span>
                                        </div>
                                        <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                            <TooltipTrigger className="size-8 flex items-center justify-center">
                                                <HelpCircle className="size-4 text-fg-senary" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 px-4 py-4 md:px-5">
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm text-tertiary">Buy land or property to rent or sell?</p>
                                                    <p className="text-sm font-bold text-secondary">{legalBuyLand === null ? "—" : legalBuyLand ? "Yes" : "No"}</p>
                                                </div>
                                                {legalBuyLand === true && (
                                                    <Tooltip color="error" title="Consider changing this answer" description="Culpa excepteur officia amet eiusmod aute occaecat tempor ea pariatur ipsum elit adipisicing enim." arrow placement="top left">
                                                        <TooltipTrigger className="size-8 flex items-center justify-center flex-shrink-0">
                                                            <AlertCircle className="size-4 text-fg-error-primary" />
                                                        </TooltipTrigger>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm text-tertiary">Used by another company?</p>
                                                    <p className="text-sm font-bold text-secondary">{legalOtherCompany === null ? "—" : legalOtherCompany ? "Yes" : "No"}</p>
                                                </div>
                                                {legalOtherCompany === true && (
                                                    <Tooltip color="error" title="Consider changing this answer" description="Culpa excepteur officia amet eiusmod aute occaecat tempor ea pariatur ipsum elit adipisicing enim." arrow placement="top left">
                                                        <TooltipTrigger className="size-8 flex items-center justify-center flex-shrink-0">
                                                            <AlertCircle className="size-4 text-fg-error-primary" />
                                                        </TooltipTrigger>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm text-tertiary">Settle personal debt?</p>
                                                    <p className="text-sm font-bold text-secondary">{legalSettleDebt === null ? "—" : legalSettleDebt ? "Yes" : "No"}</p>
                                                </div>
                                                {legalSettleDebt === true && (
                                                    <Tooltip color="error" title="Consider changing this answer" description="Culpa excepteur officia amet eiusmod aute occaecat tempor ea pariatur ipsum elit adipisicing enim." arrow placement="top left">
                                                        <TooltipTrigger className="size-8 flex items-center justify-center flex-shrink-0">
                                                            <AlertCircle className="size-4 text-fg-error-primary" />
                                                        </TooltipTrigger>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm text-tertiary">Fund opportunity outside the UK?</p>
                                                    <p className="text-sm font-bold text-secondary">{legalOutsideUK === null ? "—" : legalOutsideUK ? "Yes" : "No"}</p>
                                                </div>
                                                {legalOutsideUK === true && (
                                                    <Tooltip color="error" title="Consider changing this answer" description="Culpa excepteur officia amet eiusmod aute occaecat tempor ea pariatur ipsum elit adipisicing enim." arrow placement="top left">
                                                        <TooltipTrigger className="size-8 flex items-center justify-center flex-shrink-0">
                                                            <AlertCircle className="size-4 text-fg-error-primary" />
                                                        </TooltipTrigger>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm text-tertiary">Significantly change trading activity?</p>
                                                    <p className="text-sm font-bold text-secondary">{legalChangeTradingActivity === null ? "—" : legalChangeTradingActivity ? "Yes" : "No"}</p>
                                                </div>
                                                {legalChangeTradingActivity === true && (
                                                    <Tooltip color="error" title="Consider changing this answer" description="Culpa excepteur officia amet eiusmod aute occaecat tempor ea pariatur ipsum elit adipisicing enim." arrow placement="top left">
                                                        <TooltipTrigger className="size-8 flex items-center justify-center flex-shrink-0">
                                                            <AlertCircle className="size-4 text-fg-error-primary" />
                                                        </TooltipTrigger>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mx-4 border-t border-tertiary" />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 px-4 py-4 md:px-5">
                                            <div>
                                                <p className="text-sm text-tertiary">I agree to share my data with external lenders</p>
                                                <p className="text-sm font-bold text-secondary">{agreedToShare ? "Yes" : "No"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Further Directors */}
                                <button type="button" onClick={() => animateToDashStep(3)} className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none text-left w-full cursor-pointer hover:bg-primary_hover transition-colors">
                                    <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                <Dice3 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <span className="text-md font-semibold text-secondary">Directors</span>
                                        </div>
                                        <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                            <TooltipTrigger className="size-8 flex items-center justify-center">
                                                <HelpCircle className="size-4 text-fg-senary" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>
                                    <div className="flex flex-col">
                                        {[...applicants].sort((a, b) => b.ownership - a.ownership).map((d, index) => {
                                            const info = getDirectorInfo(d.id);
                                            const filledAddresses = info.addresses.filter(a => a.address);
                                            return (
                                                <div key={d.id}>
                                                    {index > 0 && <div className="mx-4 border-t border-tertiary" />}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 px-4 py-4 md:px-5">
                                                        <div>
                                                            <p className="text-sm text-tertiary">Director's name</p>
                                                            <p className="text-sm font-bold text-secondary">{d.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-tertiary">Date of birth</p>
                                                            <p className="text-sm font-bold text-secondary">{info.dateOfBirth ? `${info.dateOfBirth.day}/${info.dateOfBirth.month}/${info.dateOfBirth.year}` : "—"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-tertiary">Email address</p>
                                                            <p className="text-sm font-bold text-secondary">{info.email || "—"}</p>
                                                        </div>
                                                        {filledAddresses.map((a, i) => (
                                                            <div key={i}>
                                                                <p className="text-sm text-tertiary">{i === 0 ? "Current address" : "Address before that"}</p>
                                                                <p className="text-sm font-bold text-secondary truncate">{a.address}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </button>

                                {/* Finances */}
                                <button type="button" onClick={() => animateToDashStep(4)} className="bg-primary_alt border border-secondary rounded-xl shadow-xs overflow-hidden md:shadow-none text-left w-full cursor-pointer hover:bg-primary_hover transition-colors">
                                    <div className="flex items-center justify-between pl-4 pr-3 py-3 border-b border-secondary">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                <Dice4 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <span className="text-md font-semibold text-secondary">Finances</span>
                                        </div>
                                        <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                            <TooltipTrigger className="size-8 flex items-center justify-center">
                                                <HelpCircle className="size-4 text-fg-senary" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 px-4 py-4 md:px-5">
                                            <div>
                                                <p className="text-sm text-tertiary">Accounts / Bank Connected</p>
                                                <p className="text-sm font-bold text-secondary">
                                                    {plaidSuccess ? "Bank Connected" : (uploadStatementsCount > 0 || uploadAccountsCount > 0) ? `${uploadStatementsCount + uploadAccountsCount} file(s) uploaded` : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Navigation buttons */}
                                <div className="flex justify-between items-center gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => animateToDashStep(4)}
                                        className="p-3 bg-primary border border-disabled_subtle rounded-lg shadow-xs hover:bg-primary_hover transition-colors"
                                    >
                                        <ArrowLeft className="size-5 text-fg-secondary" />
                                    </button>
                                    <Button
                                        color="primary"
                                        size="lg"
                                        iconTrailing={isSubmitting ? undefined : ArrowRight}
                                        isLoading={isSubmitting}
                                        showTextWhileLoading
                                        onClick={handleSubmitApplication}
                                        className="w-full md:w-auto"
                                    >
                                        {isSubmitting ? "Submitting application" : "Submit Application"}
                                    </Button>
                                </div>
                            </div>
                            )}

                            </div>{/* end opacity animation */}
                            </div>{/* end height animation */}

                            {/* Trustpilot - mobile only */}
                            <div className="md:hidden flex flex-col items-center py-8 bg-secondary">
                                <span className="text-sm font-semibold text-primary mb-2">Excellent</span>
                                <div className="flex gap-0.5 mb-2">
                                    <TrustpilotStar />
                                    <TrustpilotStar />
                                    <TrustpilotStar />
                                    <TrustpilotStar />
                                    <TrustpilotStar />
                                </div>
                                <span className="text-xs text-tertiary mb-1">
                                    Based on <span className="underline">1789 reviews</span>
                                </span>
                                <div className="flex items-center gap-1">
                                    <svg width="18" height="17" viewBox="0 0 18 17" fill="none">
                                        <path d="M9 0L11.5 6.5L18 7L13 11.5L14.5 18L9 14.5L3.5 18L5 11.5L0 7L6.5 6.5L9 0Z" fill="#00b67a" />
                                    </svg>
                                    <span className="text-sm font-semibold text-primary">Trustpilot</span>
                                </div>
                            </div>

                        </div>{/* end inner content container */}
                    </div>
                    )}
                    </div>{/* end card opacity animation */}
                    </div>{/* end card height animation */}
                </div>
            </div>

            {/* Video Modal */}
            {showVideoModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 md:px-8 lg:px-15"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                    onClick={() => setShowVideoModal(false)}
                >
                    <div
                        className="relative w-full max-w-240 aspect-video"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowVideoModal(false)}
                            className="absolute -top-10 right-0 p-1 text-white hover:text-white/80 transition-colors"
                        >
                            <XClose className="size-8" />
                        </button>
                        <iframe
                            className="w-full h-full rounded-xl"
                            src="https://www.youtube.com/embed/9EcjWd-O4jI?autoplay=1"
                            title="Welcome Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

        </div>
        {/* Mobile slide-in menu */}
        <motion.div
            className={`md:hidden fixed inset-0 z-[60] bg-overlay/70 backdrop-blur-sm ${!showMobileMenu && "pointer-events-none"}`}
            initial={false}
            animate={{ opacity: showMobileMenu ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={handleCloseMenu}
        />
        <motion.div
            className="md:hidden fixed top-0 left-0 h-full bg-primary z-[61] flex flex-col shadow-[0px_20px_24px_-4px_rgba(10,13,18,0.08),0px_8px_8px_-4px_rgba(10,13,18,0.03),0px_3px_3px_-1.5px_rgba(10,13,18,0.04)]"
            style={{ width: "calc(100% - 64px)" }}
            initial={false}
            animate={{ x: showMobileMenu ? 0 : "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            <div className="px-4 pt-4 pb-5">
                <img src="/lovey-logo-purple.svg" alt="Lovey" className="h-8 w-auto" />
            </div>
            <DashboardMenuContent activePage={doneActivePage} onNavigate={(page) => { setDoneActivePage(page); handleCloseMenu(); }} firstName={firstName} lastName={lastName} email={email} />
        </motion.div>
        <motion.button
            className="md:hidden fixed top-3 right-2 z-[62] p-2 rounded-md"
            initial={false}
            animate={{ opacity: showMobileMenu ? 1 : 0, pointerEvents: showMobileMenu ? "auto" : "none" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={handleCloseMenu}
        >
            <XClose className="size-6 text-white opacity-70" />
        </motion.button>
        </>
    );
};

export const LoanApplication = () => {
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [borrowAmount, setBorrowAmount] = useState("");
    const [borrowAmountError, setBorrowAmountError] = useState(false);
    const [tradingStyle, setTradingStyle] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState(false);

    // Company lookup state
    const [companySearching, setCompanySearching] = useState(false);
    const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [highlightedCompanyIndex, setHighlightedCompanyIndex] = useState(-1);
    const [manualCompanyEntry, setManualCompanyEntry] = useState(false);
    const [companyNumber, setCompanyNumber] = useState("");
    const companySearchTimeout = useRef<NodeJS.Timeout | null>(null);
    const companyInputRef = useRef<HTMLDivElement>(null);

    // Step navigation and animation
    const [currentStep, setCurrentStep] = useState(() => {
        const s = new URLSearchParams(window.location.search).get("step");
        if (s?.startsWith("d")) return 4;
        return Math.min(4, Math.max(1, parseInt(s || "1") || 1));
    });
    const [displayedStep, setDisplayedStep] = useState(() => {
        const s = new URLSearchParams(window.location.search).get("step");
        if (s?.startsWith("d")) return 0;
        return Math.min(4, Math.max(1, parseInt(s || "1") || 1));
    });
    const [animationPhase, setAnimationPhase] = useState<"idle" | "fadeOut" | "resize" | "fadeIn">("idle");
    const animationPhaseRef = useRef(animationPhase);
    animationPhaseRef.current = animationPhase;
    const [cardHeight, setCardHeight] = useState<number | "auto">("auto");
    const [showLoading, setShowLoading] = useState(false);
    const [cardVisible, setCardVisible] = useState(() => {
        const s = new URLSearchParams(window.location.search).get("step");
        return !s?.startsWith("d");
    });
    const [playConfetti, setPlayConfetti] = useState(false);
    const [showDashboardLoading, setShowDashboardLoading] = useState(false);
    const [showDashboard, setShowDashboard] = useState(() => {
        const s = new URLSearchParams(window.location.search).get("step");
        return s?.startsWith("d") ?? false;
    });
    const [dashboardStep, setDashboardStep] = useState(() => {
        const s = new URLSearchParams(window.location.search).get("step");
        if (s?.startsWith("d")) return Math.min(6, Math.max(1, parseInt(s.slice(1)) || 1));
        return 1;
    });
    const [sidebarVisible, setSidebarVisible] = useState(() => {
        const s = new URLSearchParams(window.location.search).get("step");
        return !s?.startsWith("d");
    });
    const targetStepRef = useRef<number>(1);
    const step1Ref = useRef<HTMLDivElement>(null);
    const step2Ref = useRef<HTMLDivElement>(null);
    const step3Ref = useRef<HTMLDivElement>(null);
    const step4Ref = useRef<HTMLDivElement>(null);

    // Step 2: About You form fields
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneError, setPhoneError] = useState(false);
    const [ownsHouse, setOwnsHouse] = useState<boolean | null>(null);

    // Step 3: About Your Company form fields
    const [tradingDuration, setTradingDuration] = useState<string | null>(null);
    const [yearlyTurnover, setYearlyTurnover] = useState<string | null>(null);
    const [fundsReason, setFundsReason] = useState<string | null>(null);
    const [businessTradingDuration, setBusinessTradingDuration] = useState<string | null>(null);
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Check if all required fields are filled and no errors (Step 1)
    const isStep1Valid = borrowAmount && !borrowAmountError && tradingStyle && companyName && email && !emailError && (!manualCompanyEntry || companyNumber);

    // Check if step 2 is valid
    const isStep2Valid = firstName && lastName && phoneNumber && !phoneError && ownsHouse !== null;

    // Check if step 3 is valid
    const isStep3Valid = tradingDuration && yearlyTurnover && fundsReason && businessTradingDuration;

    // Get ref for a specific step
    const getStepRef = (step: number) => {
        switch (step) {
            case 1: return step1Ref;
            case 2: return step2Ref;
            case 3: return step3Ref;
            case 4: return step4Ref;
            default: return step1Ref;
        }
    };

    // Sync the current step to the URL without triggering a navigation/reload
    const syncUrl = (step: number, inDashboard: boolean, dashStep: number) => {
        const stepParam = inDashboard ? `d${dashStep}` : String(step);
        window.history.replaceState(null, "", `?step=${stepParam}`);
    };

    // Transition timing constants
    const FADE_DURATION = 100;
    const RESIZE_DURATION = 400;
    const LOADING_DURATION = 2000;

    // Handle step transition with phased animation using timeouts
    const animateToStep = (targetStep: number) => {
        if (animationPhaseRef.current !== "idle" || targetStep === displayedStep) return;

        // Store target step
        targetStepRef.current = targetStep;

        // Get current height and lock it
        const currentRef = getStepRef(displayedStep);
        const currentHeight = currentRef.current?.offsetHeight || 0;
        setCardHeight(currentHeight);

        // Phase 1: Fade out content
        requestAnimationFrame(() => {
            setAnimationPhase("fadeOut");

            // After fade out completes, change content and resize
            setTimeout(() => {
                setDisplayedStep(targetStep);
                setCurrentStep(targetStep);
                syncUrl(targetStep, false, 1);

                // Wait for React to render new content, then measure and resize
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const targetRef = getStepRef(targetStep);
                        const targetHeight = targetRef.current?.offsetHeight || 0;
                        setCardHeight(targetHeight);
                        setAnimationPhase("resize");

                        // After resize completes, fade in
                        setTimeout(() => {
                            setCardHeight("auto");
                            setAnimationPhase("fadeIn");

                            // After fade in completes, return to idle
                            setTimeout(() => {
                                setAnimationPhase("idle");
                            }, FADE_DURATION);
                        }, RESIZE_DURATION);
                    });
                });
            }, FADE_DURATION);
        });
    };

    // Handle step 3 → loading → step 4 transition
    const animateToLoading = () => {
        if (animationPhaseRef.current !== "idle") return;

        // Phase 1: Fade out the entire card
        setCardVisible(false);

        // After card fades out, show loading
        setTimeout(() => {
            setShowLoading(true);
            setDisplayedStep(0); // Hide card content

            // After loading duration, transition to step 4
            setTimeout(() => {
                setShowLoading(false);
                setDisplayedStep(4);
                setCurrentStep(4);
                syncUrl(4, false, 1);

                // Small delay then fade in the card
                requestAnimationFrame(() => {
                    setCardVisible(true);
                    setAnimationPhase("idle");
                });
            }, LOADING_DURATION);
        }, FADE_DURATION);
    };

    // Handle next step button click
    const handleNextStep = () => {
        if (currentStep === 3) {
            // Special transition with loading state
            animateToLoading();
        } else {
            animateToStep(currentStep + 1);
        }
    };

    // Handle previous step button click
    const handlePrevStep = () => {
        if (currentStep > 1) {
            animateToStep(currentStep - 1);
        }
    };

    // Handle "Add more details" button click - transition to dashboard
    const handleAddMoreDetails = () => {
        // Slide out sidebar and fade out content
        setSidebarVisible(false);
        setCardVisible(false);

        // After sidebar slides out, show dashboard loading
        setTimeout(() => {
            setShowDashboardLoading(true);
            setDisplayedStep(0);

            // After 2 seconds, fade in dashboard
            setTimeout(() => {
                setShowDashboardLoading(false);
                setShowDashboard(true);
                syncUrl(4, true, 1);
            }, LOADING_DURATION);
        }, 300); // Wait for sidebar slide animation (300ms)
    };

    // Handle debug navigation (skips loading screens)
    const handleDebugNav = (direction: "prev" | "next") => {
        // Skip loading screens if currently showing
        if (showLoading) {
            setShowLoading(false);
            setDisplayedStep(4);
            setCurrentStep(4);
            setCardVisible(true);
            syncUrl(4, false, 1);
            return;
        }
        if (showDashboardLoading) {
            setShowDashboardLoading(false);
            setShowDashboard(true);
            syncUrl(4, true, 1);
            return;
        }

        // Handle navigation within dashboard steps (step 6 = done screen)
        const MAX_DASHBOARD_STEP = 6;
        if (showDashboard) {
            if (direction === "next") {
                if (dashboardStep >= MAX_DASHBOARD_STEP) return;
                setDashboardStep(prev => prev + 1);
                syncUrl(4, true, dashboardStep + 1);
            } else {
                // Go to previous dashboard step, or back to main flow if at step 1
                if (dashboardStep === 1) {
                    setShowDashboard(false);
                    setSidebarVisible(true);
                    setCardVisible(true);
                    setDisplayedStep(4);
                    setCurrentStep(4);
                    syncUrl(4, false, 1);
                } else {
                    setDashboardStep(prev => prev - 1);
                    syncUrl(4, true, dashboardStep - 1);
                }
            }
            return;
        }

        // Handle going forward to dashboard from step 4 (skip loading)
        if (direction === "next" && currentStep === 4 && !showDashboard) {
            setSidebarVisible(false);
            setCardVisible(false);
            setDisplayedStep(0);
            setShowDashboard(true);
            setDashboardStep(1);
            syncUrl(4, true, 1);
            return;
        }

        const targetStep = direction === "next"
            ? Math.min(4, currentStep + 1)
            : Math.max(1, currentStep - 1);

        // Skip loading when going from step 3 to 4
        if (direction === "next" && currentStep === 3) {
            setCardVisible(false);
            setTimeout(() => {
                setDisplayedStep(4);
                setCurrentStep(4);
                setCardVisible(true);
                syncUrl(4, false, 1);
            }, 100);
        } else {
            animateToStep(targetStep);
        }
    };

    const validateBorrowAmount = (value: string) => {
        // Remove commas and non-numeric characters except decimal point
        const numericValue = parseFloat(value.replace(/,/g, ""));

        if (isNaN(numericValue) || numericValue < 1000 || numericValue > 750000) {
            setBorrowAmountError(true);
        } else {
            setBorrowAmountError(false);
        }
    };

    const handleBorrowAmountBlur = () => {
        if (borrowAmount) {
            validateBorrowAmount(borrowAmount);
        }
    };

    const handleBorrowAmountChange = (value: string) => {
        setBorrowAmount(value);
        // Clear error when user starts typing
        if (borrowAmountError) {
            setBorrowAmountError(false);
        }
    };

    const validateEmail = (value: string) => {
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(value)) {
            setEmailError(true);
        } else {
            setEmailError(false);
        }
    };

    const handleEmailBlur = () => {
        if (email) {
            validateEmail(email);
        }
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        // Clear error when user starts typing
        if (emailError) {
            setEmailError(false);
        }
    };

    const validatePhone = (value: string) => {
        // Remove spaces and check if only digits
        const digitsOnly = value.replace(/\s/g, "");
        const isOnlyNumbers = /^\d*$/.test(digitsOnly);
        const hasMinDigits = digitsOnly.length >= 10;

        if (!isOnlyNumbers || !hasMinDigits) {
            setPhoneError(true);
        } else {
            setPhoneError(false);
        }
    };

    const handlePhoneBlur = () => {
        if (phoneNumber) {
            validatePhone(phoneNumber);
        }
    };

    const handlePhoneChange = (value: string) => {
        // Strip leading +44 or 0 prefix (browser autofill may include it)
        const stripped = value.replace(/^\+44\s?/, "").replace(/^0/, "");
        setPhoneNumber(stripped);
        // Clear error when user starts typing
        if (phoneError) {
            setPhoneError(false);
        }
    };

    // Company name search handler with debounce
    const handleCompanyNameChange = (value: string) => {
        setCompanyName(value);
        setSelectedCompanyId(null);
        setHighlightedCompanyIndex(-1);

        // Clear any existing timeout
        if (companySearchTimeout.current) {
            clearTimeout(companySearchTimeout.current);
        }

        if (value.length > 0) {
            // Show loading state immediately
            setCompanySearching(true);
            setCompanyDropdownOpen(true);

            // After 1 second, show results
            companySearchTimeout.current = setTimeout(() => {
                setCompanySearching(false);
            }, 1000);
        } else {
            setCompanySearching(false);
            setCompanyDropdownOpen(false);
        }
    };

    // Handle company selection
    const handleCompanySelect = (company: (typeof staticCompanies)[0]) => {
        setCompanyName(company.name);
        setSelectedCompanyId(company.id);
        setCompanyDropdownOpen(false);
        setCompanySearching(false);
        setHighlightedCompanyIndex(-1);
    };

    // Keyboard navigation for company search combobox
    const handleCompanyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!companyDropdownOpen) {
            if (e.key === "ArrowDown" && companyName.length > 0) {
                e.preventDefault();
                setCompanyDropdownOpen(true);
            }
            return;
        }

        if (companySearching) {
            if (e.key === "Escape") {
                e.preventDefault();
                setCompanyDropdownOpen(false);
                setHighlightedCompanyIndex(-1);
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedCompanyIndex(prev =>
                    prev < staticCompanies.length - 1 ? prev + 1 : 0);
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedCompanyIndex(prev =>
                    prev > 0 ? prev - 1 : staticCompanies.length - 1);
                break;
            case "Enter":
                e.preventDefault();
                if (highlightedCompanyIndex >= 0 && highlightedCompanyIndex < staticCompanies.length) {
                    handleCompanySelect(staticCompanies[highlightedCompanyIndex]);
                }
                break;
            case "Escape":
                e.preventDefault();
                setCompanyDropdownOpen(false);
                setHighlightedCompanyIndex(-1);
                break;
        }
    };

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    // Scroll highlighted company option into view
    useEffect(() => {
        if (highlightedCompanyIndex >= 0) {
            const element = document.getElementById(`company-option-${staticCompanies[highlightedCompanyIndex].id}`);
            element?.scrollIntoView({ block: "nearest" });
        }
    }, [highlightedCompanyIndex]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (companyInputRef.current && !companyInputRef.current.contains(event.target as Node)) {
                setCompanyDropdownOpen(false);
                setCompanySearching(false);
                setHighlightedCompanyIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (companySearchTimeout.current) {
                clearTimeout(companySearchTimeout.current);
            }
        };
    }, []);

    // Simulate loading for 1 second
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    // Trigger confetti 200ms after step 4 becomes visible
    useEffect(() => {
        if (displayedStep === 4 && cardVisible) {
            const timer = setTimeout(() => {
                setPlayConfetti(true);
            }, 200);
            return () => clearTimeout(timer);
        } else {
            setPlayConfetti(false);
        }
    }, [displayedStep, cardVisible]);

    // Trustpilot component for reuse in mobile and desktop

    return (
        <div className="flex min-h-screen w-full bg-secondary md:bg-tertiary">
            {/* Left Sidebar - hidden on mobile, thinner on tablet, slides out for dashboard */}
            <aside
                className="hidden md:flex flex-col gap-6 lg:gap-10 md:w-[280px] lg:w-[400px] xl:w-[480px] min-h-screen border-r border-secondary p-4 lg:p-6 shadow-2xl shrink-0"
                style={{
                    background: isDark ? sidebarGradientDark : sidebarGradientLight,
                    marginLeft: sidebarVisible ? "0px" : "-480px",
                    transition: "margin-left 300ms ease-out",
                }}
            >
                {/* Logo */}
                <div className="h-10 lg:h-[50px] w-auto">
                    <LoveyLogo />
                </div>

                {/* Main content */}
                <div className="flex flex-col flex-1 gap-6 lg:gap-8 justify-center pb-18">
                    {/* Headline */}
                    <h1 className="text-white md:text-2xl lg:text-3xl font-medium leading-tight">
                        Who says business loans need to be awkward?
                    </h1>

                    {/* Features list */}
                    <div className="flex flex-col gap-2 lg:gap-3 w-full">
                        <FeatureItem size="sm">Enquiry doesn't affect credit</FeatureItem>
                        <FeatureItem size="sm">Apply in 2 minutes</FeatureItem>
                        <FeatureItem size="sm">Funds in as little as 4 hours</FeatureItem>
                        <FeatureItem size="sm">Unsecured loans up to £750,000</FeatureItem>
                    </div>
                </div>

                {/* Trustpilot section - desktop */}
                <TrustpilotSection variant="dark" />
            </aside>

            {/* Main Content Area */}
            <main className="flex flex-1 flex-col">
                {/* Mobile header with logo - hidden on desktop */}
                <div className="flex md:hidden items-center p-4">
                    <LoveyLogoPurple />
                </div>


                {/* Form content - hide when showing dashboard */}
                {!showDashboardLoading && !showDashboard && (
                <div className="flex flex-1 flex-col items-center justify-start md:justify-center pb-4 md:px-6 lg:px-8">
                    <div className="flex flex-col gap-0 md:gap-3 items-end justify-center w-full md:max-w-[480px]">
                        {/* Progress indicator - hide on success step and loading */}
                        {displayedStep > 0 && displayedStep < 4 && !showLoading && (isLoading ? <ProgressStepsSkeleton /> : (
                            <div
                                className="w-full pb-3 md:pb-0"
                                style={{
                                    opacity: cardVisible ? 1 : 0,
                                    transition: "opacity 100ms ease-in-out",
                                }}
                            >
                                <ProgressSteps currentStep={displayedStep} totalSteps={3} />
                            </div>
                        ))}

                        {/* Loading state */}
                        {showLoading && (
                            <div className="flex flex-col gap-2 items-center justify-center w-full py-16">
                                <DotLottieReact
                                    src="/material_loading.lottie"
                                    loop
                                    autoplay
                                    className="size-30"
                                />
                                <p className="text-quaternary text-lg text-center">
                                    Checking your eligibility
                                </p>
                            </div>
                        )}

                        {/* Success heading - only show on step 4 */}
                        {displayedStep === 4 && !showLoading && (
                            <div className="relative w-full md:max-w-[480px] pt-6 pb-3 md:pb-0">
                                {/* Confetti animation - plays once after 200ms delay, behind heading */}
                                {playConfetti && (
                                    <DotLottieReact
                                        src="/confetti.lottie"
                                        autoplay
                                        className="absolute -bottom-3 left-0 w-full h-auto z-0 pointer-events-none"
                                    />
                                )}
                                <h1
                                    className="relative z-10 text-primary text-3xl font-semibold text-center w-full leading-tight"
                                    style={{
                                        opacity: cardVisible ? 1 : 0,
                                        transition: "opacity 100ms ease-in-out",
                                    }}
                                >
                                    Great news!<br />
                                    You're eligible for a loan
                                </h1>
                            </div>
                        )}

                        {/* Form Card with phased animation */}
                        {!showLoading && displayedStep > 0 && (
                        <div className="relative w-full md:max-w-[480px]">
                            {/* Success character image - positioned behind card on right, hidden on mobile and tablet */}
                            {displayedStep === 4 && (
                                <img
                                    src="/success_character.png"
                                    alt=""
                                    className="hidden lg:block absolute -right-38 bottom-0 w-48 h-auto z-0 pointer-events-none"
                                    style={{
                                        opacity: cardVisible ? 1 : 0,
                                        transition: "opacity 100ms ease-in-out",
                                    }}
                                />
                            )}
                            <div
                                className="relative z-10 w-full overflow-hidden md:bg-primary_alt md:rounded-xl md:border md:border-secondary md:shadow-xs"
                                style={{
                                    height: cardHeight === "auto" ? "auto" : `${cardHeight}px`,
                                    transition: "height 400ms ease-in-out, opacity 100ms ease-in-out",
                                    opacity: cardVisible ? 1 : 0,
                                }}
                            >
                                {/* Content wrapper with fade animation */}
                                <div
                                    style={{
                                        opacity: animationPhase === "fadeOut" || animationPhase === "resize" ? 0 : 1,
                                        transition: "opacity 100ms ease-in-out",
                                    }}
                                >
                            {/* Step 1: Let's get started */}
                            {displayedStep === 1 && (
                                <div ref={step1Ref} className="flex flex-col gap-4 px-2 pt-2 pb-6 md:gap-0 md:px-0 md:pt-0 md:pb-0">
                                    <div className="bg-primary_alt rounded-xl border border-secondary md:bg-transparent md:rounded-none md:border-0">
                                    {/* Card Header */}
                                    <div className="flex items-center gap-1 px-3 md:px-4 py-3 border-b border-secondary">
                                        {isLoading ? (
                                            <div className="flex flex-1 items-center gap-3">
                                                <Skeleton className="size-8 rounded-full" />
                                                <Skeleton className="h-6 w-40" />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-1 items-center gap-3">
                                                    <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                        <Flag05 className="size-4 text-fg-brand-primary" />
                                                    </div>
                                                    <h2 className="flex-1 text-md md:text-lg font-semibold text-secondary">Let's get started!</h2>
                                                </div>
                                                <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                                    <TooltipTrigger className="size-8 rounded-full flex items-center justify-center">
                                                        <HelpCircle className="size-4 text-fg-quaternary" />
                                                    </TooltipTrigger>
                                                </Tooltip>
                                            </>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 md:pb-0">
                                        <div className="flex flex-col gap-5 w-full">
                                            {isLoading ? (
                                                <>
                                                    <InputSkeleton />
                                                    <InputSkeleton />
                                                    <InputSkeleton />
                                                    <InputSkeleton />
                                                </>
                                            ) : (
                                                <>
                                                    {/* Borrow amount input with £ prefix */}
                                                    <div className="flex flex-col gap-1.5 w-full">
                                                        <label className="text-secondary font-medium text-base">
                                                            How much would you like to borrow?
                                                        </label>
                                                        <div className={`flex w-full h-11 rounded-lg bg-primary shadow-xs ring-1 ring-inset overflow-hidden ${borrowAmountError ? "ring-error_subtle" : "ring-primary"} focus-within:ring-2 focus-within:ring-brand ${borrowAmountError ? "focus-within:ring-error" : ""}`}>
                                                            <div className="flex items-center pl-3.5 shrink-0">
                                                                <span className="text-placeholder text-md">£</span>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                pattern="[0-9,]*"
                                                                placeholder="100,000"
                                                                value={borrowAmount}
                                                                onChange={(e) => handleBorrowAmountChange(e.target.value)}
                                                                onBlur={handleBorrowAmountBlur}
                                                                className="flex-1 bg-transparent text-md text-primary pl-0.5 pr-3.5 outline-none placeholder:text-placeholder"
                                                            />
                                                        </div>
                                                        <p className={borrowAmountError ? "text-error-primary text-sm" : "text-tertiary text-sm"}>
                                                            {borrowAmountError ? "Please enter an amount between £1,000 and £750,000" : "Between £1k and £750k"}
                                                        </p>
                                                    </div>

                                                    {/* Trading style select */}
                                                    <Select
                                                        label="What is your trading style"
                                                        placeholder="Select an option"
                                                        items={tradingStyleOptions}
                                                        selectedKey={tradingStyle}
                                                        onSelectionChange={(key) => {
                                                            setTradingStyle(key as string);
                                                            setCompanyName("");
                                                            setSelectedCompanyId(null);
                                                            setCompanyDropdownOpen(false);
                                                            setCompanySearching(false);
                                                            setHighlightedCompanyIndex(-1);
                                                            setManualCompanyEntry(false);
                                                            setCompanyNumber("");
                                                        }}
                                                    >
                                                        {(item) => <Select.Item id={item.id} key={item.id}>{item.label}</Select.Item>}
                                                    </Select>

                                                    {/* Company name - free text for sole trader or manual entry, combobox lookup for limited company */}
                                                    {tradingStyle === "sole-trader" || manualCompanyEntry ? (
                                                        <>
                                                            <Input
                                                                label="What is your company's name?"
                                                                placeholder="Enter your company name"
                                                                type="text"
                                                                value={companyName}
                                                                onChange={setCompanyName}
                                                            />
                                                            {manualCompanyEntry && (
                                                                <Input
                                                                    label="Company number"
                                                                    placeholder="Enter your company number"
                                                                    type="text"
                                                                    value={companyNumber}
                                                                    onChange={(value) => setCompanyNumber(value.replace(/\D/g, ""))}
                                                                    hint={
                                                                        <a
                                                                            href="https://find-and-update.company-information.service.gov.uk/"
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="underline text-tertiary hover:text-secondary"
                                                                        >
                                                                            Find your company number here
                                                                        </a>
                                                                    }
                                                                />
                                                            )}
                                                        </>
                                                    ) : (
                                                    <div ref={companyInputRef} className="flex flex-col gap-1.5 w-full">
                                                        <label id="company-search-label" className="text-sm font-medium text-secondary">
                                                            What is your company's name?
                                                        </label>
                                                        <div className="relative w-full">
                                                            <div className="relative flex h-11 w-full items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset transition-shadow duration-100 ease-linear focus-within:ring-2 focus-within:ring-brand">
                                                                <SearchMd className="pointer-events-none absolute left-3 size-5 text-fg-quaternary" aria-hidden="true" />
                                                                <input
                                                                    id="company-search-input"
                                                                    role="combobox"
                                                                    type="text"
                                                                    placeholder="Start typing to search"
                                                                    value={companyName}
                                                                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                                                                    onFocus={() => {
                                                                        // Wait for the mobile keyboard to finish animating in,
                                                                        // then scroll the input to the top of the viewport so the
                                                                        // dropdown has the maximum space below it.
                                                                        setTimeout(() => {
                                                                            companyInputRef.current?.scrollIntoView({
                                                                                behavior: "smooth",
                                                                                block: "start",
                                                                            });
                                                                        }, 300);
                                                                    }}
                                                                    onKeyDown={handleCompanyKeyDown}
                                                                    onBlur={(e) => {
                                                                        if (!companyInputRef.current?.contains(e.relatedTarget as Node)) {
                                                                            setCompanyDropdownOpen(false);
                                                                            setHighlightedCompanyIndex(-1);
                                                                        }
                                                                    }}
                                                                    aria-expanded={companyDropdownOpen}
                                                                    aria-controls="company-search-listbox"
                                                                    aria-autocomplete="list"
                                                                    aria-activedescendant={
                                                                        highlightedCompanyIndex >= 0 && !companySearching
                                                                            ? `company-option-${staticCompanies[highlightedCompanyIndex].id}`
                                                                            : undefined
                                                                    }
                                                                    aria-labelledby="company-search-label"
                                                                    autoComplete="off"
                                                                    className="w-full bg-transparent text-md text-primary pl-10 pr-3.5 py-2 rounded-lg outline-none placeholder:text-placeholder"
                                                                />
                                                            </div>

                                                            {/* Company search dropdown */}
                                                            {companyDropdownOpen && (
                                                                <div
                                                                    id="company-search-listbox"
                                                                    role="listbox"
                                                                    aria-labelledby="company-search-label"
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    className="absolute top-full left-0 right-0 mt-1 bg-primary border border-secondary rounded-lg shadow-lg z-10 py-1 max-h-[220px] overflow-y-auto"
                                                                >
                                                                    {companySearching ? (
                                                                        <div className="px-1.5 py-px" role="status">
                                                                            <div className="p-2 rounded-md">
                                                                                <p className="text-quaternary text-base">
                                                                                    Searching for companies..
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        staticCompanies.map((company, index) => {
                                                                            const isSelected = selectedCompanyId === company.id;
                                                                            const isHighlighted = highlightedCompanyIndex === index;
                                                                            return (
                                                                                <div
                                                                                    key={company.id}
                                                                                    className="px-1.5 py-px"
                                                                                >
                                                                                    <div
                                                                                        id={`company-option-${company.id}`}
                                                                                        role="option"
                                                                                        aria-selected={isSelected}
                                                                                        onClick={() => handleCompanySelect(company)}
                                                                                        className={`w-full flex items-center gap-2 p-2 rounded-md text-left cursor-pointer transition-colors hover:bg-active ${
                                                                                            isSelected ? "bg-active" : ""
                                                                                        } ${isHighlighted && !isSelected ? "bg-primary_hover" : ""}`}
                                                                                    >
                                                                                        <div className="flex-1 flex items-center gap-2">
                                                                                            <span className="text-primary font-medium text-base">
                                                                                                {company.name}
                                                                                            </span>
                                                                                            <span className="text-quaternary text-base">
                                                                                                {company.postcode}
                                                                                            </span>
                                                                                        </div>
                                                                                        {isSelected && (
                                                                                            <Check className="size-5 text-fg-brand-primary shrink-0" aria-hidden="true" />
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}
                                                                    {/* Can't find my company button */}
                                                                    <div className="px-1.5 pt-1 pb-0.5 border-t border-secondary mt-1">
                                                                        <Button
                                                                            color="secondary"
                                                                            size="sm"
                                                                            className="w-full"
                                                                            onClick={() => {
                                                                                setManualCompanyEntry(true);
                                                                                setCompanyDropdownOpen(false);
                                                                                setCompanySearching(false);
                                                                                setSelectedCompanyId(null);
                                                                                setHighlightedCompanyIndex(-1);
                                                                            }}
                                                                        >
                                                                            Can't find my company
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    )}

                                                    {/* Email input */}
                                                    <Input
                                                        label="What is your email address?"
                                                        placeholder="name@businessmail.com"
                                                        type="email"
                                                        autoComplete="email"
                                                        hint={emailError ? "Please enter a valid email address" : undefined}
                                                        value={email}
                                                        onChange={handleEmailChange}
                                                        onBlur={handleEmailBlur}
                                                        isInvalid={emailError}
                                                    />

                                                </>
                                            )}
                                        </div>
                                    </div>
                                    </div>

                                    {/* Newsletter checkbox - outside card */}
                                    <div className="px-2 md:px-4 md:pt-6">
                                        {isLoading ? (
                                            <CheckboxSkeleton />
                                        ) : (
                                            <Checkbox
                                                label="Keep me up-to-date with exclusive offers and SME news"
                                                hint="We'll send a maximum of 2 emails a week"
                                            />
                                        )}
                                    </div>

                                    {/* Submit button - outside card */}
                                    <div className="pt-2 md:pt-6 md:px-4 md:pb-4">
                                        {isLoading ? (
                                            <Skeleton className="h-12 w-full rounded-lg" />
                                        ) : (
                                            <Button
                                                color="primary"
                                                size="lg"
                                                iconTrailing={ArrowRight}
                                                isDisabled={!isStep1Valid}
                                                className="w-full"
                                                onClick={handleNextStep}
                                            >
                                                Get Started
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: About You */}
                            {displayedStep === 2 && (
                                <div ref={step2Ref} className="flex flex-col gap-4 px-2 pt-2 pb-6 md:gap-0 md:px-0 md:pt-0 md:pb-0">
                                    <div className="bg-primary_alt rounded-xl border border-secondary md:bg-transparent md:rounded-none md:border-0">
                                    {/* Card Header */}
                                    <div className="flex items-center gap-1 px-3 md:px-4 py-3 border-b border-secondary">
                                        <div className="flex flex-1 items-center gap-3">
                                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                <User01 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <h2 className="flex-1 text-md md:text-lg font-semibold text-secondary">About You</h2>
                                        </div>
                                        <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                            <TooltipTrigger className="size-8 rounded-full flex items-center justify-center">
                                                <HelpCircle className="size-4 text-fg-quaternary" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 md:pb-0">
                                        <div className="flex flex-col gap-5 w-full">
                                            {/* Name fields - side by side */}
                                            <div className="flex flex-col gap-1.5 w-full">
                                                <label className="text-secondary font-medium text-base">
                                                    What is your name?
                                                </label>
                                                <div className="flex gap-1.5 w-full">
                                                    <Input
                                                        placeholder="First Name"
                                                        value={firstName}
                                                        onChange={setFirstName}
                                                    />
                                                    <Input
                                                        placeholder="Last Name"
                                                        value={lastName}
                                                        onChange={setLastName}
                                                    />
                                                </div>
                                            </div>

                                            {/* Phone number with +44 prefix */}
                                            <div className="flex flex-col gap-1.5 w-full">
                                                <label className="text-secondary font-medium text-base">
                                                    What is your phone number?
                                                </label>
                                                <div className={`flex w-full h-11 rounded-lg bg-primary shadow-xs ring-1 ring-inset overflow-hidden ${phoneError ? "ring-error_subtle" : "ring-primary"}`}>
                                                    <div className="flex items-center px-3.5 border-r border-primary shrink-0">
                                                        <span className="text-tertiary text-base">+44</span>
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        autoComplete="tel"
                                                        placeholder="7700 900000"
                                                        value={phoneNumber}
                                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                                        onBlur={handlePhoneBlur}
                                                        className="flex-1 bg-transparent text-md text-primary px-3.5 outline-none placeholder:text-placeholder"
                                                    />
                                                </div>
                                                <p className={phoneError ? "text-error-primary text-sm" : "text-tertiary text-sm"}>
                                                    {phoneError ? "Please enter a UK phone number" : "We'll only call you regarding your loan application"}
                                                </p>
                                            </div>

                                            {/* House ownership - Yes/No button group */}
                                            <div className="flex flex-col gap-1.5 w-full">
                                                <label className="text-secondary font-medium text-base">
                                                    Do any of the directors own a house in the UK?
                                                </label>
                                                <div className="flex w-full border border-primary rounded-lg shadow-xs-skeumorphic overflow-hidden h-10">
                                                    <button type="button" onClick={() => setOwnsHouse(true)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md border-r border-primary transition-colors ${ownsHouse === true ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>Yes</button>
                                                    <button type="button" onClick={() => setOwnsHouse(false)} className={`flex-1 flex items-center justify-center px-4 py-2 text-md transition-colors ${ownsHouse === false ? "bg-quaternary font-medium text-secondary_hover" : "bg-primary text-secondary"}`}>No</button>
                                                </div>
                                                <p className="text-tertiary text-sm">
                                                    This just helps us understand your circumstances better. Our loans are unsecured and not secured against your property.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    </div>

                                    {/* Navigation buttons - outside card */}
                                    <div className="pt-2 md:pt-6 md:px-4 md:pb-4">
                                        <div className="flex gap-3 w-full">
                                            <button
                                                type="button"
                                                onClick={handlePrevStep}
                                                className="p-3 bg-primary border border-disabled_subtle rounded-lg shadow-xs hover:bg-primary_hover transition-colors"
                                            >
                                                <ArrowLeft className="size-5 text-fg-secondary" />
                                            </button>
                                            <Button
                                                color="primary"
                                                size="lg"
                                                iconTrailing={ArrowRight}
                                                isDisabled={!isStep2Valid}
                                                className="flex-1"
                                                onClick={handleNextStep}
                                            >
                                                Continue
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: About Your Company */}
                            {displayedStep === 3 && (
                                <div ref={step3Ref} className="flex flex-col gap-4 px-2 pt-2 pb-6 md:gap-0 md:px-0 md:pt-0 md:pb-0">
                                    <div className="bg-primary_alt rounded-xl border border-secondary md:bg-transparent md:rounded-none md:border-0">
                                    {/* Card Header */}
                                    <div className="flex items-center gap-1 px-3 md:px-4 py-3 border-b border-secondary">
                                        <div className="flex flex-1 items-center gap-3">
                                            <div className="size-8 rounded-full bg-brand-secondary flex items-center justify-center shrink-0">
                                                <Building06 className="size-4 text-fg-brand-primary" />
                                            </div>
                                            <h2 className="flex-1 text-md md:text-lg font-semibold text-secondary">About your company</h2>
                                        </div>
                                        <Tooltip title="This is a tooltip" description="Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text." arrow placement="top right">
                                            <TooltipTrigger className="size-8 rounded-full flex items-center justify-center">
                                                <HelpCircle className="size-4 text-fg-quaternary" />
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 md:pb-0">
                                        <div className="flex flex-col gap-5 w-full">
                                            {/* Business trading duration */}
                                            <Select
                                                label={companyName.trim() ? `How long have you been trading under ${companyName.trim()}?` : "How long have you been trading under your business name?"}
                                                placeholder="Select an option"
                                                items={businessTradingDurationOptions}
                                                selectedKey={businessTradingDuration}
                                                onSelectionChange={(key) => setBusinessTradingDuration(key as string)}
                                            >
                                                {(item) => <Select.Item id={item.id} key={item.id}>{item.label}</Select.Item>}
                                            </Select>

                                            {/* Loan term select */}
                                            <Select
                                                label="What loan term works best for you?"
                                                placeholder="Select an option"
                                                items={tradingDurationOptions}
                                                selectedKey={tradingDuration}
                                                onSelectionChange={(key) => setTradingDuration(key as string)}
                                                hint="This will help us work out your payments"
                                            >
                                                {(item) => <Select.Item id={item.id} key={item.id}>{item.label}</Select.Item>}
                                            </Select>

                                            {/* Yearly turnover select */}
                                            <Select
                                                label="What was your turnover over the last 12 months?"
                                                placeholder="Select an option"
                                                items={yearlyTurnoverOptions}
                                                selectedKey={yearlyTurnover}
                                                onSelectionChange={(key) => setYearlyTurnover(key as string)}
                                                hint="This helps us get an idea of affordability."
                                            >
                                                {(item) => <Select.Item id={item.id} key={item.id}>{item.label}</Select.Item>}
                                            </Select>

                                            {/* Funds reason select */}
                                            <Select
                                                label="What do you need the funds for?"
                                                placeholder="Select an option"
                                                items={fundsReasonOptions}
                                                selectedKey={fundsReason}
                                                onSelectionChange={(key) => setFundsReason(key as string)}
                                                hint="We'll use this to find the most suitable lender."
                                            >
                                                {(item) => <Select.Item id={item.id} key={item.id}>{item.label}</Select.Item>}
                                            </Select>

                                        </div>
                                    </div>
                                    </div>

                                    {/* Submit button and disclaimer - outside card */}
                                    <div className="pt-2 flex flex-col gap-2 items-center md:pt-6 md:px-4 md:pb-4">
                                        <div className="flex gap-3 w-full">
                                            <button
                                                type="button"
                                                onClick={handlePrevStep}
                                                className="p-3 bg-primary border border-disabled_subtle rounded-lg shadow-xs hover:bg-primary_hover transition-colors"
                                            >
                                                <ArrowLeft className="size-5 text-fg-secondary" />
                                            </button>
                                            <Button
                                                color="primary"
                                                size="lg"
                                                iconTrailing={ArrowRight}
                                                isDisabled={!isStep3Valid}
                                                className="flex-1"
                                                onClick={handleNextStep}
                                            >
                                                See if I'm eligible
                                            </Button>
                                        </div>
                                        <p className="text-quaternary text-sm text-center">
                                            This will not affect your credit score
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Success - Eligible */}
                            {displayedStep === 4 && (
                                <div ref={step4Ref} className="flex flex-col gap-6 p-4">
                                    {/* Content section */}
                                    <div className="flex flex-col gap-6 p-4 bg-primary_alt rounded-lg border border-secondary overflow-hidden md:p-0 md:bg-transparent md:rounded-none md:border-0 md:overflow-visible">
                                        {/* What happens now */}
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-primary font-semibold text-base">
                                                What happens now?
                                            </h3>
                                            <p className="text-tertiary text-base">
                                                You are eligible to borrow! We'll ask for some company and financial details to match you with the best lenders and see what we can do for you.
                                            </p>
                                        </div>

                                        {/* Add more details section */}
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-2">
                                                <h3 className="text-primary font-semibold text-base">
                                                    Add more details to speed up the process
                                                </h3>
                                                <p className="text-tertiary text-base">
                                                    We'll ask about:
                                                </p>
                                            </div>

                                            {/* Checklist */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex gap-3 items-start">
                                                    <CheckCircle className="size-6 text-fg-brand-primary shrink-0" />
                                                    <p className="text-tertiary text-base">
                                                        All directors' details
                                                    </p>
                                                </div>
                                                <div className="flex gap-3 items-start">
                                                    <CheckCircle className="size-6 text-fg-brand-primary shrink-0" />
                                                    <p className="text-tertiary text-base">
                                                        Accounts and Bank Statements
                                                    </p>
                                                </div>
                                                <div className="flex gap-3 items-start">
                                                    <CheckCircle className="size-6 text-fg-brand-primary shrink-0" />
                                                    <p className="text-tertiary text-base">
                                                        Loan Term and reason
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-tertiary text-base">
                                                Most of applicants complete this stage in under 15 minutes.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Add more details button */}
                                    <Button
                                        color="primary"
                                        size="lg"
                                        iconTrailing={ArrowRight}
                                        className="w-full"
                                        onClick={handleAddMoreDetails}
                                    >
                                        Add more details
                                    </Button>
                                </div>
                            )}
                                </div>
                            </div>
                        </div>
                        )}
                    </div>

                </div>
                )}

                {/* Trustpilot section - mobile only, sticky to bottom or below content */}
                {!showDashboardLoading && !showDashboard && (
                    <div className="flex md:hidden justify-center mt-auto pb-6">
                        <TrustpilotSection variant="light" />
                    </div>
                )}

                {/* Dashboard loading screen */}
                {showDashboardLoading && (
                    <div className="fixed inset-0 flex flex-col gap-4 items-center justify-center bg-tertiary z-50">
                        <DotLottieReact
                            src="/material_loading.lottie"
                            loop
                            autoplay
                            className="size-30"
                        />
                        <p className="text-quaternary text-lg text-center">
                            Preparing your dashboard
                        </p>
                    </div>
                )}

                {/* Dashboard Steps */}
                {showDashboard && (dashboardStep >= 1 && dashboardStep <= 6) && (
                    <DashboardStep1 externalDashStep={dashboardStep} firstName={firstName} lastName={lastName} email={email} onStepChange={(step) => syncUrl(4, true, step)} />
                )}
            </main>

            {/* Debug navigation and theme toggle */}
            <div className="fixed bottom-4 right-4 flex gap-2 opacity-15 hover:opacity-40 transition-opacity z-50">
                <button
                    onClick={toggleTheme}
                    className="p-2"
                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {isDark ? (
                        <Sun className="size-5 text-fg-primary" />
                    ) : (
                        <MoonStar className="size-5 text-fg-primary" />
                    )}
                </button>
                <button
                    onClick={() => handleDebugNav("prev")}
                    disabled={(currentStep === 1 && !showDashboard && dashboardStep === 1) || animationPhase !== "idle" || showLoading || showDashboardLoading}
                    className="p-2 disabled:opacity-30"
                >
                    <ArrowRight className="size-5 text-fg-primary rotate-180" />
                </button>
                <button
                    onClick={() => handleDebugNav("next")}
                    disabled={(showDashboard && dashboardStep >= 6) || animationPhase !== "idle" || showLoading || showDashboardLoading}
                    className="p-2 disabled:opacity-30"
                >
                    <ArrowRight className="size-5 text-fg-primary" />
                </button>
                <button
                    onClick={() => {
                        setSidebarVisible(false);
                        setCardVisible(false);
                        setDisplayedStep(0);
                        setShowDashboard(true);
                        setDashboardStep(6);
                        syncUrl(4, true, 6);
                    }}
                    className="p-2"
                    aria-label="Jump to last step"
                >
                    <CheckCircle className="size-5 text-fg-primary" />
                </button>
            </div>
        </div>
    );
};
