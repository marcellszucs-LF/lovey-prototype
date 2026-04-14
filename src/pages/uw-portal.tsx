import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
    AlertTriangle,
    AlignTopArrow02,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    CheckDone01,
    ChevronDown,
    Rows03,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ChevronSelectorVertical,
    ChevronUp,
    Download01,
    Edit01,
    LifeBuoy01,
    Mail05,
    MessageSquare01,
    PhoneCall01,
    Printer,
    SearchLg,
    Settings01,
    Table,
    Trash01,
    UploadCloud02,
    XClose,
    User01,
    UserEdit,
    XCircle,
    LogOut01,
} from "@untitledui/icons";
import { CalendarDate } from "@internationalized/date";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { Badge } from "@/components/base/badges/badges";
import { DateField } from "@/components/application/date-picker/date-field";
import { Input } from "@/components/base/input/input";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateRange { start: Date; end: Date }
interface AmountRange { min: number | null; max: number | null }

type LeadStage = "triage" | "new" | "waiting" | "done";

interface Lead {
    id: string;
    company: string;
    companyNumber: string;
    email?: string;
    address?: string;
    incorporated?: string;
    applicantName?: string;
    telephone?: string;
    loanAmount: number;
    termMonths: number;
    purpose: string;
    timeAgo: string;
    assignee: { name: string; initials: string };
    flagged?: boolean;
    decision?: "approved" | "declined";
}

// ─── Drag-to-scroll ───────────────────────────────────────────────────────────

function useDragScroll() {
    const ref = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startScrollLeft = useRef(0);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const stop = () => {
            isDragging.current = false;
            if (ref.current) ref.current.style.cursor = isOverflowing ? "grab" : "";
        };
        window.addEventListener("mouseup", stop);
        return () => window.removeEventListener("mouseup", stop);
    }, [isOverflowing]);

    return {
        ref,
        dragProps: {
            style: { cursor: isOverflowing ? "grab" : "default" } as React.CSSProperties,
            onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
                if (!ref.current || !isOverflowing) return;
                isDragging.current = true;
                startX.current = e.pageX;
                startScrollLeft.current = ref.current.scrollLeft;
                ref.current.style.cursor = "grabbing";
            },
            onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
                if (!isDragging.current || !ref.current) return;
                ref.current.scrollLeft = startScrollLeft.current - (e.pageX - startX.current);
            },
        },
    };
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const navItems: (NavItemType & { icon: React.FC<{ className?: string }> })[] = [
    { label: "Applicants", href: "/uw-portal", icon: Rows03 },
];

const footerItems: (NavItemType & { icon: React.FC<{ className?: string }> })[] = [
    { label: "Help",     href: "/uw-portal/support",  icon: LifeBuoy01 },
    { label: "Settings", href: "/uw-portal/settings", icon: Settings01 },
    { label: "Log out",  href: "#",                   icon: LogOut01 },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = 68;

const UWPortalSidebar = ({
    activeUrl,
    onRefresh,
    isRefreshing,
}: {
    activeUrl: string;
    onRefresh: () => void;
    isRefreshing: boolean;
}) => {
    return (
        <>
            {/* Real sidebar — fixed */}
            <div className="fixed bottom-2 left-2 top-2 z-50" style={{ width: SIDEBAR_WIDTH }}>
                <div
                    className="flex h-full flex-col items-center justify-between rounded-xl border border-secondary bg-primary py-5 shadow-xs"
                >
                    {/* Top: logo + nav items */}
                    <div className="flex flex-col items-center gap-6 w-full">
                        {/* Logo */}
                        <div className="flex justify-center px-3">
                            <button
                                type="button"
                                onClick={onRefresh}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center focus:outline-none"
                            >
                                <img
                                    src="/lovey-icon.svg"
                                    alt="Lovey"
                                    className={cx("h-8 w-8 shrink-0", isRefreshing && "spin-once")}
                                />
                            </button>
                        </div>

                        {/* Nav items */}
                        <ul className="flex flex-col gap-0.5 px-3 w-full">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeUrl === item.href || activeUrl.startsWith(item.href + "/");
                                return (
                                    <li key={item.label} className="flex justify-center">
                                        <Link
                                            to={item.href ?? "#"}
                                            aria-label={item.label}
                                            title={item.label}
                                            className={cx(
                                                "flex size-10 items-center justify-center rounded-md text-fg-quaternary transition duration-100 hover:bg-active",
                                                isActive && "bg-active text-fg-secondary",
                                            )}
                                        >
                                            <Icon className="size-5 shrink-0" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Bottom: footer items + avatar */}
                    <div className="flex flex-col items-center gap-4 px-3 w-full">
                        <ul className="flex flex-col gap-0.5 w-full">
                            {footerItems.map((item) => {
                                const Icon = item.icon;
                                const isLogOut = item.label === "Log out";
                                return (
                                    <li key={item.label} className="flex justify-center">
                                        <Link
                                            to={item.href ?? "#"}
                                            aria-label={item.label}
                                            title={item.label}
                                            className={cx(
                                                "group flex size-10 items-center justify-center rounded-md text-fg-quaternary transition duration-100",
                                                isLogOut ? "hover:bg-error-primary" : "hover:bg-active",
                                            )}
                                        >
                                            <Icon className={cx("size-5 shrink-0", isLogOut && "group-hover:text-fg-error-primary")} />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Avatar */}
                        <img
                            src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"
                            alt="Jake Torres"
                            className="size-10 shrink-0 rounded-full object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Invisible spacer so content doesn't go under sidebar */}
            <div style={{ width: SIDEBAR_WIDTH + 8 }} className="shrink-0" />
        </>
    );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseTimeAgoMinutes = (t: string) => {
    const m = t.match(/^(\d+)(min|h|d)$/);
    if (!m) return 0;
    const n = parseInt(m[1]);
    if (m[2] === "min") return n;
    if (m[2] === "h")   return n * 60;
    return n * 1440;
};

const formatAmount = (amount: number) =>
    amount >= 1_000_000
        ? `£${(amount / 1_000_000).toFixed(1)}M`
        : `£${amount.toLocaleString("en-GB")}`;

const totalPipeline = (leads: Lead[]) =>
    leads.reduce((sum, l) => sum + l.loanAmount, 0);

// ─── Company avatar colors ─────────────────────────────────────────────────────

const COMPANY_COLORS: Record<string, string> = {
    "Stack3d Lab": "#2563eb",
    "Warpspeed": "#78350f",
    "ContrastAI": "#7c3aed",
    "SkyTech Innovations": "#475569",
    "GreenWave Solutions": "#16a34a",
    "NovaMed Clinic": "#0891b2",
    "Brick & Mortar Co.": "#ea580c",
    "Apex Security Ltd": "#dc2626",
    "Blue Fin Restaurant": "#0369a1",
    "Quantum Forge": "#b45309",
    "Riviera Studios": "#be185d",
    "ForgePoint Capital": "#059669",
};

const getCompanyColor = (name: string) => COMPANY_COLORS[name] ?? "#6b7280";

const getInitials = (name: string) =>
    name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

// ─── Lead data ────────────────────────────────────────────────────────────────

const initialLeadsData: Record<LeadStage, Lead[]> = {
    triage: [
        { id: "1", company: "Stack3d Lab", companyNumber: "14823901", email: "hello@stack3dlab.com", address: "12 Shoreditch High St, London E1 6JE", incorporated: "14 Mar 2021", applicantName: "Alex Morgan", telephone: "+44 20 7946 0012", loanAmount: 120000, termMonths: 36, purpose: "Equipment or Assets", timeAgo: "2h", assignee: { name: "Jake Torres", initials: "JT" } },
        { id: "2", company: "Warpspeed", companyNumber: "13047562", email: "finance@warpspeed.io", address: "7 Kings Road, Bristol BS1 4EJ", incorporated: "02 Sep 2019", applicantName: "Jamie Lee", telephone: "+44 117 906 0032", loanAmount: 5000, termMonths: 12, purpose: "Payroll", timeAgo: "5h", assignee: { name: "Sarah Chen", initials: "SC" }, flagged: true },
        { id: "3", company: "NovaMed Clinic", companyNumber: "09381274", email: "ops@novamed.co.uk", address: "88 Harley Street, London W1G 7HJ", incorporated: "22 Jun 2016", applicantName: "Dr. Priya Shah", telephone: "+44 20 7946 0088", loanAmount: 350000, termMonths: 48, purpose: "New Products", timeAgo: "1h", assignee: { name: "Marcus Webb", initials: "MW" } },
        { id: "13", company: "Riviera Studios", companyNumber: "16204758", email: "hello@rivierastudios.co.uk", address: "Studio 12, 80 Bermondsey St, London SE1 3UD", incorporated: "07 May 2023", applicantName: "Chloe Dupont", telephone: "+44 20 7946 0130", loanAmount: 55000, termMonths: 18, purpose: "Working Capital", timeAgo: "14d", assignee: { name: "Lisa Park", initials: "LP" } },
        { id: "14", company: "ForgePoint Capital", companyNumber: "10837264", email: "ops@forgepointcap.com", address: "Level 3, 100 Cheapside, London EC2V 6DT", incorporated: "19 Feb 2018", applicantName: "Daniel Osei", telephone: "+44 20 7946 0141", loanAmount: 480000, termMonths: 60, purpose: "Invoice Finance", timeAgo: "45d", assignee: { name: "Jake Torres", initials: "JT" }, flagged: true },
    ],
    new: [
        { id: "4", company: "Warpspeed", companyNumber: "13047562", email: "finance@warpspeed.io", address: "7 Kings Road, Bristol BS1 4EJ", incorporated: "02 Sep 2019", applicantName: "Jamie Lee", telephone: "+44 117 906 0032", loanAmount: 80000, termMonths: 12, purpose: "Invoice Finance", timeAgo: "5h", assignee: { name: "Sarah Chen", initials: "SC" } },
        { id: "5", company: "Brick & Mortar Co.", companyNumber: "07265183", email: "accounts@brickmortar.com", address: "45 Union Street, Manchester M1 3GH", incorporated: "11 Jan 2015", applicantName: "Tom Briggs", telephone: "+44 161 496 0045", loanAmount: 45000, termMonths: 24, purpose: "Working Capital", timeAgo: "3h", assignee: { name: "Lisa Park", initials: "LP" } },
        { id: "15", company: "Quantum Forge", companyNumber: "12947503", email: "bd@quantumforge.io", address: "Forge House, 99 Innovation Blvd, Leeds LS2 7EY", incorporated: "03 Dec 2020", applicantName: "Ryan Foster", telephone: "+44 113 320 0012", loanAmount: 95000, termMonths: 24, purpose: "New Products", timeAgo: "22d", assignee: { name: "Marcus Webb", initials: "MW" } },
    ],
    waiting: [
        { id: "6", company: "ContrastAI", companyNumber: "15109347", email: "cfo@contrastai.com", address: "Suite 4, 22 Cambridge Science Park, Cambridge CB4 0FX", incorporated: "30 Nov 2022", applicantName: "Nina Patel", telephone: "+44 1223 490 006", loanAmount: 200000, termMonths: 24, purpose: "Invoice Finance", timeAgo: "12min", assignee: { name: "Jake Torres", initials: "JT" } },
        { id: "7", company: "Stack3d Lab", companyNumber: "14823901", email: "hello@stack3dlab.com", address: "12 Shoreditch High St, London E1 6JE", incorporated: "14 Mar 2021", applicantName: "Alex Morgan", telephone: "+44 20 7946 0012", loanAmount: 120000, termMonths: 36, purpose: "Equipment or Assets", timeAgo: "4h", assignee: { name: "Marcus Webb", initials: "MW" } },
        { id: "8", company: "SkyTech Innovations", companyNumber: "11748302", email: "finance@skytech.co.uk", address: "Unit 9 Innova Park, Enfield EN3 7NJ", incorporated: "05 Apr 2018", applicantName: "Chris Walton", telephone: "+44 20 8090 0009", loanAmount: 65000, termMonths: 6, purpose: "New Products", timeAgo: "30min", assignee: { name: "Sarah Chen", initials: "SC" } },
        { id: "9", company: "GreenWave Solutions", companyNumber: "10293847", email: "hello@greenwave.io", address: "Clarence House, 2 Clarence St, Glasgow G3 8AX", incorporated: "19 Jul 2017", applicantName: "Fiona Grant", telephone: "+44 141 229 0019", loanAmount: 95000, termMonths: 18, purpose: "Other", timeAgo: "2h", assignee: { name: "Lisa Park", initials: "LP" } },
    ],
    done: [
        { id: "10", company: "Apex Security Ltd", companyNumber: "08374651", email: "biz@apexsecurity.co.uk", address: "Apex House, 1 Security Way, Reading RG1 3AP", incorporated: "08 Aug 2013", applicantName: "Mark Dawson", telephone: "+44 118 909 0010", loanAmount: 180000, termMonths: 60, purpose: "Equipment or Assets", timeAgo: "2d", assignee: { name: "Jake Torres", initials: "JT" } },
        { id: "11", company: "Blue Fin Restaurant", companyNumber: "06582930", email: "owner@bluefin.co.uk", address: "31 Harbour Walk, Brighton BN1 1NE", incorporated: "27 Feb 2010", applicantName: "Sophie Turner", telephone: "+44 1273 490 011", loanAmount: 75000, termMonths: 12, purpose: "Working Capital", timeAgo: "1d", assignee: { name: "Sarah Chen", initials: "SC" } },
        { id: "12", company: "Quantum Forge", companyNumber: "12947503", email: "finance@quantumforge.io", address: "Forge House, 99 Innovation Blvd, Leeds LS2 7EY", incorporated: "03 Dec 2020", applicantName: "Ryan Foster", telephone: "+44 113 320 0012", loanAmount: 420000, termMonths: 48, purpose: "New Products", timeAgo: "3d", assignee: { name: "Marcus Webb", initials: "MW" } },
    ],
};

// ─── Column config ─────────────────────────────────────────────────────────────

const columnConfig: Array<{ id: LeadStage; label: string }> = [
    { id: "triage", label: "New" },
    { id: "new", label: "Assigned" },
    { id: "waiting", label: "Waiting for Customer" },
    { id: "done", label: "Decision Made" },
];

// ─── Stage config ──────────────────────────────────────────────────────────────

const STAGE_DOT: Record<LeadStage, string> = {
    triage:  "bg-fg-quaternary",
    new:     "bg-blue-500",
    waiting: "bg-rose-500",
    done:    "bg-green-500",
};


// ─── Company Avatar ───────────────────────────────────────────────────────────

const CompanyAvatar = ({ name }: { name: string }) => (
    <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: getCompanyColor(name) }}
    >
        {getInitials(name)}
    </div>
);

// ─── Info Pill ────────────────────────────────────────────────────────────────

const InfoPill = ({ children }: { children: React.ReactNode }) => (
    <span className="shrink-0 whitespace-nowrap rounded-md border border-tertiary bg-primary px-2 py-0.5 text-xs font-medium text-secondary">
        {children}
    </span>
);

// ─── Lead Card ────────────────────────────────────────────────────────────────

const LeadCard = ({ lead }: { lead: Lead }) => {
    const navigate = useNavigate();
    return (
    <div onClick={() => navigate(`/uw-portal/lead/${lead.id}`)} className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-4 transition-colors hover:bg-secondary_subtle">
        <div className="relative shrink-0">
            <CompanyAvatar name={lead.company} />
            {lead.decision === "approved" && (
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-[#17b26a] ring-2 ring-primary" />
            )}
            {lead.decision === "declined" && (
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-[#f04438] ring-2 ring-primary" />
            )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
            {/* Name + time + status icon */}
            <div className="flex items-center justify-between gap-1">
                <div className="flex min-w-0 items-center gap-1">
                    <span className="truncate text-sm font-medium text-primary">{lead.company}</span>
                    <span className="size-1 shrink-0 rounded-full bg-fg-quaternary" />
                    <span className="shrink-0 text-sm text-quaternary">{lead.timeAgo}</span>
                </div>
                {lead.flagged && (
                    <Tooltip title="Warning Text" placement="top">
                        <TooltipTrigger className="flex shrink-0 items-center justify-center rounded-md border border-utility-warning-200 bg-utility-warning-50 p-[5px]">
                            <AlertTriangle className="size-3 text-utility-warning-600" />
                        </TooltipTrigger>
                    </Tooltip>
                )}
            </div>

            {/* Loan detail pills */}
            <div className="flex items-center gap-1 overflow-hidden">
                <InfoPill>{formatAmount(lead.loanAmount)}</InfoPill>
                <InfoPill>{lead.termMonths} mo</InfoPill>
                <InfoPill>{lead.purpose}</InfoPill>
            </div>
        </div>
    </div>
    );
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

const LeadCardSkeleton = () => (
    <div className="flex items-center gap-3 rounded-xl px-2 py-4">
        <div className="skeleton size-9 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="flex gap-1">
                <div className="skeleton h-5 w-14 rounded-md" />
                <div className="skeleton h-5 w-10 rounded-md" />
                <div className="skeleton h-5 w-20 rounded-md" />
            </div>
        </div>
    </div>
);

const TableRowSkeleton = () => (
    <tr>
        <TD className="border-l">
            <div className="flex items-center gap-3">
                <div className="skeleton size-9 shrink-0 rounded-full" />
                <div className="flex flex-col gap-1.5">
                    <div className="skeleton h-4 w-28 rounded" />
                    <div className="skeleton h-3 w-36 rounded" />
                </div>
            </div>
        </TD>
        <TD><div className="skeleton h-4 w-16 rounded" /></TD>
        <TD><div className="skeleton h-4 w-16 rounded" /></TD>
        <TD><div className="skeleton h-4 w-24 rounded" /></TD>
        <TD><div className="skeleton h-5 w-20 rounded-md" /></TD>
        <TD><div className="skeleton h-4 w-24 rounded" /></TD>
        <TD><div className="skeleton h-4 w-10 rounded" /></TD>
        <TD className="border-r">{null}</TD>
    </tr>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const ColumnEmptyState = ({ label }: { label: string }) => (
    <div className="flex items-start gap-3 rounded-xl bg-primary px-4 py-3.5">
        <XCircle className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
        <p className="text-sm text-tertiary">
            No Applications matching your filters are {label.toLowerCase()}
        </p>
    </div>
);

// ─── Panel Card ────────────────────────────────────────────────────────────────

interface PanelCardProps {
    title: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    innerClassName?: string;
}

export const PanelCard = ({ title, badge, children, className, innerClassName }: PanelCardProps) => (
    <div className={cx("flex w-full flex-col rounded-xl border border-secondary bg-secondary_subtle shadow-xs", className)}>
        <div className="flex shrink-0 items-center gap-4 pl-5 pr-3 pt-3 pb-2">
            <span className="flex-1 text-sm font-semibold text-primary">{title}</span>
            {badge}
        </div>
        <div className={cx("flex flex-col gap-2 rounded-xl border border-secondary bg-primary px-2 py-4", innerClassName)}>
            {children}
        </div>
    </div>
);

// ─── Kanban Column ─────────────────────────────────────────────────────────────

const KanbanColumn = ({ label, leads, isRefreshing }: { id: LeadStage; label: string; leads: Lead[]; isRefreshing?: boolean }) => {
    const sorted = [...leads].sort((a, b) => parseTimeAgoMinutes(a.timeAgo) - parseTimeAgoMinutes(b.timeAgo));
    return (
    <div className="scrollbar-hide min-w-80 flex-1 overflow-y-auto pb-4">
        <PanelCard
            title={label}
            badge={
                <div className="flex w-[22px] items-center justify-center rounded-md border border-secondary px-1.5 py-0.5">
                    {isRefreshing
                        ? <div className="skeleton h-3 w-4 rounded" />
                        : <span className="text-center text-xs font-medium text-secondary">{leads.length}</span>
                    }
                </div>
            }
        >
            {isRefreshing ? (
                Array.from({ length: Math.max(leads.length, 1) }).map((_, i) => <LeadCardSkeleton key={i} />)
            ) : sorted.length === 0 ? (
                <ColumnEmptyState label={label} />
            ) : (
                sorted.map((lead) => <LeadCard key={lead.id} lead={lead} />)
            )}
        </PanelCard>
    </div>
    );
};

// ─── Filter options ───────────────────────────────────────────────────────────

const SORT_OPTIONS    = ["Newest first", "Oldest First", "Amount: High → Low", "Amount: Low → High"];
const PURPOSE_OPTIONS = ["All purposes", "Working Capital", "Equipment or Assets", "New Products", "Payroll", "Tax Payment", "Invoice Finance", "Other"];

const FILTER_DEFAULTS = {
    sort: SORT_OPTIONS[0],
    purpose: PURPOSE_OPTIONS[0],
};

const ASSIGNEES = [
    { name: "Jake Torres", avatar: "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80" },
    { name: "Sarah Chen",  avatar: "https://www.untitledui.com/images/avatars/phoenix-baker?fm=webp&q=80" },
    { name: "Marcus Webb", avatar: "https://www.untitledui.com/images/avatars/lana-steiner?fm=webp&q=80" },
    { name: "Lisa Park",   avatar: "https://www.untitledui.com/images/avatars/demi-wilkinson?fm=webp&q=80" },
];

// ─── Clear Filters Icon ───────────────────────────────────────────────────────

const ClearFiltersIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M4 10H14M1.5 5H16.5M6.5 15H11.5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 13L13 19M13 13L19 19" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ─── Filter Select ────────────────────────────────────────────────────────────

const FilterSelect = ({
    value,
    onChange,
    options,
    selectClassName,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    selectClassName?: string;
}) => (
    <div className="relative inline-flex">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cx("appearance-none cursor-pointer rounded-lg border border-primary bg-primary py-2.5 pl-3.5 pr-8 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-primary_hover hover:text-secondary_hover focus:outline-none", selectClassName)}
        >
            {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-fg-quaternary" />
    </div>
);

// ─── Date Range Filter ────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getCalendarDays = (viewDate: Date): Date[] => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7;
    const days: Date[] = [];
    for (let i = startDow - 1; i >= 0; i--) days.push(new Date(year, month, -i));
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    const remaining = (7 - days.length % 7) % 7;
    for (let d = 1; d <= remaining; d++) days.push(new Date(year, month + 1, d));
    return days;
};

const fmtDateShort = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const toCalendarDate = (d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
const fromCalendarDate = (cd: CalendarDate): Date => new Date(cd.year, cd.month - 1, cd.day);

const makeRange = (days: number): DateRange => {
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const start = new Date(); start.setDate(start.getDate() - days); start.setHours(0, 0, 0, 0);
    return { start, end };
};

const DateRangeFilter = ({ value, label: labelOverride, onChange }: {
    value: DateRange | null;
    label: string;
    onChange: (v: DateRange | null, label: string) => void;
}) => {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => new Date());
    const [anchor, setAnchor] = useState<Date | null>(null);
    const [hover, setHover] = useState<Date | null>(null);
    const [draft, setDraft] = useState<DateRange | null>(value);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = getCalendarDays(viewDate);
    const currentMonth = viewDate.getMonth();

    const handleDayClick = (day: Date) => {
        if (!anchor) {
            setAnchor(day);
            setDraft(null);
        } else {
            const start = day < anchor ? day : anchor;
            const end = day < anchor ? anchor : day;
            setDraft({ start, end });
            setAnchor(null);
        }
    };

    const previewRange = anchor && hover
        ? { start: hover < anchor ? hover : anchor, end: hover < anchor ? anchor : hover }
        : null;
    const displayRange = draft ?? previewRange;

    const isStart    = (d: Date) => !!displayRange && sameDay(d, displayRange.start);
    const isEnd      = (d: Date) => !!displayRange && sameDay(d, displayRange.end);
    const isInRange  = (d: Date) => !!displayRange && d > displayRange.start && d < displayRange.end;
    const isToday    = (d: Date) => sameDay(d, today);

    const applyShortcut = (numDays: number) => {
        const range = makeRange(numDays);
        setDraft(range);
        setAnchor(null);
        onChange(range, `${numDays} days`);
        setOpen(false);
    };

    const displayLabel = labelOverride || (value ? `${fmtDateShort(value.start)} – ${fmtDateShort(value.end)}` : "Date range");

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => { setDraft(value); setAnchor(null); setOpen(o => !o); }}
                className={cx("relative inline-flex cursor-pointer items-center rounded-lg border border-primary py-2.5 pl-3.5 pr-8 text-sm font-semibold text-secondary transition duration-100 hover:bg-primary_hover hover:text-secondary_hover focus:outline-none", open ? "bg-active" : "bg-primary")}
            >
                {displayLabel}
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[344px] rounded-xl border border-secondary bg-primary shadow-xl">
                    {/* Month navigation */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="flex size-8 cursor-pointer items-center justify-center rounded-md text-fg-quaternary hover:bg-active">
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="text-sm font-semibold text-primary">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                        <button type="button" onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="flex size-8 cursor-pointer items-center justify-center rounded-md text-fg-quaternary hover:bg-active">
                            <ChevronRight className="size-4" />
                        </button>
                    </div>

                    {/* Date inputs */}
                    <div className="flex items-center gap-2 px-4 pb-3">
                        <DateField
                            className="flex-1"
                            value={draft?.start ? toCalendarDate(draft.start) : undefined}
                            onChange={(v) => {
                                if (v) {
                                    const start = fromCalendarDate(v as CalendarDate);
                                    setDraft(prev => ({ start, end: prev?.end ?? start }));
                                    setAnchor(null);
                                }
                            }}
                        />
                        <span className="shrink-0 text-fg-quaternary">–</span>
                        <DateField
                            className="flex-1"
                            value={draft?.end ? toCalendarDate(draft.end) : undefined}
                            onChange={(v) => {
                                if (v) {
                                    const end = fromCalendarDate(v as CalendarDate);
                                    setDraft(prev => ({ start: prev?.start ?? end, end }));
                                    setAnchor(null);
                                }
                            }}
                        />
                    </div>

                    {/* Shortcuts */}
                    <div className="flex items-center justify-between px-4 pb-3">
                        {[7, 30, 60].map(d => (
                            <button key={d} type="button" onClick={() => applyShortcut(d)}
                                className={cx(
                                    "cursor-pointer text-sm font-semibold hover:underline",
                                    labelOverride === `${d} days` ? "text-[#594483] underline" : "text-[#4b3a6e]",
                                )}>
                                {d} days
                            </button>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="px-4 pb-3">
                        <div className="grid grid-cols-7 pb-1">
                            {DAY_LABELS.map(d => (
                                <div key={d} className="flex h-8 items-center justify-center text-xs font-medium text-fg-quaternary">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {days.map((day, i) => {
                                const inMonth = day.getMonth() === currentMonth;
                                const _isStart = isStart(day);
                                const _isEnd   = isEnd(day);
                                const _isRange = isInRange(day);
                                const _isToday = isToday(day);
                                const single   = !!displayRange && sameDay(displayRange.start, displayRange.end);
                                return (
                                    <div key={i} className="relative flex h-10 items-center justify-center">
                                        {(_isRange || (_isEnd && !single)) && <div className="absolute inset-y-1 left-0 right-1/2 bg-active" />}
                                        {(_isRange || (_isStart && !single)) && <div className="absolute inset-y-1 left-1/2 right-0 bg-active" />}
                                        <button
                                            type="button"
                                            onClick={() => handleDayClick(day)}
                                            onMouseEnter={() => anchor && setHover(day)}
                                            onMouseLeave={() => setHover(null)}
                                            className={cx(
                                                "relative z-10 flex size-9 cursor-pointer items-center justify-center rounded-full text-sm",
                                                (_isStart || _isEnd)
                                                    ? "bg-[#594483] font-semibold text-white"
                                                    : _isRange
                                                    ? "text-secondary"
                                                    : inMonth
                                                    ? "text-secondary hover:bg-active"
                                                    : "text-fg-disabled hover:bg-active",
                                            )}
                                        >
                                            {day.getDate()}
                                            {_isToday && (
                                                <span className={cx(
                                                    "absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full",
                                                    (_isStart || _isEnd) ? "bg-white/70" : "bg-[#594483]",
                                                )} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 border-t border-secondary px-4 py-3">
                        <button type="button"
                            onClick={() => { const r = makeRange(7); setDraft(r); onChange(r, "7 days"); setOpen(false); setAnchor(null); }}
                            className="flex-1 cursor-pointer rounded-lg border border-secondary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover">
                            Reset
                        </button>
                        <button type="button"
                            onClick={() => { onChange(draft, draft ? `${fmtDateShort(draft.start)} – ${fmtDateShort(draft.end)}` : "Date range"); setOpen(false); }}
                            className="flex-1 cursor-pointer rounded-lg bg-[#594483] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#4b3a6e]">
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Amount Range Filter ──────────────────────────────────────────────────────

const AmountRangeFilter = ({ value, onChange }: { value: AmountRange | null; onChange: (v: AmountRange | null) => void }) => {
    const [open, setOpen] = useState(false);
    const [minVal, setMinVal] = useState(value?.min ? String(value.min) : "");
    const [maxVal, setMaxVal] = useState(value?.max ? String(value.max) : "");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const fmtK = (n: number) => n >= 1000 ? `£${Math.round(n / 1000)}K` : `£${n}`;

    const label = (() => {
        if (!value || (value.min === null && value.max === null)) return "All amounts";
        if (value.min !== null && value.max !== null) return `${fmtK(value.min)} – ${fmtK(value.max)}`;
        if (value.min !== null) return `Over ${fmtK(value.min)}`;
        return `Under ${fmtK(value.max!)}`;
    })();

    const applyShortcut = (min: number | null, max: number | null) => {
        setMinVal(min !== null ? String(min) : "");
        setMaxVal(max !== null ? String(max) : "");
    };

    const handleApply = () => {
        const min = minVal ? parseInt(minVal) : null;
        const max = maxVal ? parseInt(maxVal) : null;
        onChange(min === null && max === null ? null : { min, max });
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    setMinVal(value?.min ? String(value.min) : "");
                    setMaxVal(value?.max ? String(value.max) : "");
                    setOpen(o => !o);
                }}
                className={cx("relative inline-flex cursor-pointer items-center rounded-lg border border-primary py-2.5 pl-3.5 pr-8 text-sm font-semibold text-secondary transition duration-100 hover:bg-primary_hover hover:text-secondary_hover focus:outline-none", open ? "bg-active" : "bg-primary")}
            >
                {label}
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[344px] rounded-xl border border-secondary bg-primary shadow-xl">
                    {/* Amount inputs */}
                    <div className="flex items-center gap-2 px-4 pb-3 pt-4">
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-md text-secondary">£</span>
                            <input type="number" value={minVal} onChange={e => setMinVal(e.target.value)} placeholder="From"
                                className="h-11 w-full rounded-lg bg-primary pl-8 pr-3.5 text-md text-primary shadow-xs ring-1 ring-primary ring-inset placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand" />
                        </div>
                        <span className="shrink-0 text-fg-quaternary">–</span>
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-md text-secondary">£</span>
                            <input type="number" value={maxVal} onChange={e => setMaxVal(e.target.value)} placeholder="To"
                                className="h-11 w-full rounded-lg bg-primary pl-8 pr-3.5 text-md text-primary shadow-xs ring-1 ring-primary ring-inset placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand" />
                        </div>
                    </div>

                    {/* Shortcuts */}
                    <div className="flex items-center justify-between px-4 pb-3">
                        {([
                            { label: "Under £10K",   min: null,   max: 10000  },
                            { label: "£10K–£100K",   min: 10000,  max: 100000 },
                            { label: "Over £100K",   min: 100000, max: null   },
                        ] as const).map(({ label: l, min, max }) => (
                            <button key={l} type="button"
                                onClick={() => applyShortcut(min ?? null, max ?? null)}
                                className="cursor-pointer text-sm font-semibold text-[#4b3a6e] hover:underline">
                                {l}
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 border-t border-secondary px-4 py-3">
                        <button type="button"
                            onClick={() => { onChange(null); setMinVal(""); setMaxVal(""); setOpen(false); }}
                            className="flex-1 cursor-pointer rounded-lg border border-secondary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover">
                            Reset
                        </button>
                        <button type="button" onClick={handleApply}
                            className="flex-1 cursor-pointer rounded-lg bg-[#594483] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#4b3a6e]">
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Assignee Filter ──────────────────────────────────────────────────────────

const AssigneeFilter = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    useEffect(() => {
        if (open) {
            setSearch("");
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    const toggle = (name: string) =>
        onChange(value.includes(name) ? value.filter(n => n !== name) : [...value, name]);

    const label = (() => {
        if (value.length === 0) return "All assignees";
        if (value.length === 1) return value[0] === "Jake Torres" ? "Me" : value[0].split(" ")[0];
        return `${value.length} assignees`;
    })();

    const allEntries = ASSIGNEES.map((a, i) => ({
        display: i === 0 ? "Me" : a.name,
        key: a.name,
        avatar: a.avatar,
    }));
    const filtered = allEntries.filter(a => a.display.toLowerCase().includes(search.toLowerCase()));

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={cx("relative inline-flex cursor-pointer items-center rounded-lg border border-primary py-2.5 pl-3.5 pr-8 text-sm font-semibold text-secondary transition duration-100 hover:bg-primary_hover hover:text-secondary_hover focus:outline-none", open ? "bg-active" : "bg-primary")}
            >
                {label}
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[260px] overflow-hidden rounded-xl border border-secondary bg-primary shadow-xl">
                    {/* Search */}
                    <div className="flex items-center gap-2.5 border-b border-secondary px-4 py-3">
                        <SearchLg className="size-5 shrink-0 text-fg-quaternary" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search"
                            className="w-full bg-transparent text-md text-primary placeholder:text-placeholder focus:outline-none"
                        />
                    </div>
                    {/* List */}
                    <div className="max-h-[280px] overflow-y-auto py-1.5">
                        {filtered.map(({ display, key, avatar }) => {
                            const isSelected = value.includes(key);
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggle(key)}
                                    className={cx(
                                        "flex w-full cursor-pointer items-center gap-3 px-3 py-2",
                                        isSelected ? "bg-active" : "hover:bg-secondary_subtle",
                                    )}
                                >
                                    <img src={avatar} alt={display} className="size-8 shrink-0 rounded-full object-cover" />
                                    <span className="flex-1 text-left text-md font-medium text-primary">{display}</span>
                                    {isSelected && <CheckCircle className="size-5 shrink-0 text-brand-secondary" />}
                                </button>
                            );
                        })}
                        {filtered.length === 0 && (
                            <p className="px-3 py-4 text-center text-sm text-tertiary">No results</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Purpose Filter ───────────────────────────────────────────────────────────

const PurposeFilter = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const toggle = (opt: string) => {
        onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
    };

    const label = value.length === 0 ? "All purposes" : value.length === 1 ? value[0] : `${value.length} purposes`;
    const options = PURPOSE_OPTIONS.slice(1);

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={cx("relative inline-flex cursor-pointer items-center rounded-lg border border-primary py-2.5 pl-3.5 pr-8 text-sm font-semibold text-secondary transition duration-100 hover:bg-primary_hover hover:text-secondary_hover focus:outline-none", open ? "bg-active" : "bg-primary")}
            >
                {label}
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-[220px] overflow-hidden rounded-xl border border-secondary bg-primary shadow-xl">
                    <div className="max-h-[280px] overflow-y-auto py-1.5">
                        {options.map(opt => {
                            const isSelected = value.includes(opt);
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => toggle(opt)}
                                    className={cx(
                                        "flex w-full cursor-pointer items-center gap-3 px-3 py-2",
                                        isSelected ? "bg-active" : "hover:bg-secondary_subtle",
                                    )}
                                >
                                    <span className="flex-1 text-left text-md font-medium text-primary">{opt}</span>
                                    {isSelected && <CheckCircle className="size-5 shrink-0 text-brand-secondary" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Application Header ───────────────────────────────────────────────────────

interface HeaderFilters {
    dateRange: DateRange | null; setDateRange: (v: DateRange | null) => void;
    dateRangeLabel: string; setDateRangeLabel: (v: string) => void;
    amountRange: AmountRange | null; setAmountRange: (v: AmountRange | null) => void;
    sort: string; setSort: (v: string) => void;
    purpose: string[]; setPurpose: (v: string[]) => void;
    assignees: string[]; setAssignees: (v: string[]) => void;
    activeCount: number;
    onReset: () => void;
}

const ApplicationHeader = ({
    totalLeads,
    pipeline,
    searchRef,
    searchQuery,
    onSearchChange,
    filters,
    view,
    onViewChange,
}: {
    totalLeads: number;
    pipeline: number;
    searchRef: React.RefObject<HTMLInputElement | null>;
    searchQuery: string;
    onSearchChange: (v: string) => void;
    filters: HeaderFilters;
    view: "board" | "table";
    onViewChange: (v: "board" | "table") => void;
}) => {
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    // Resolve the actual <input> DOM node via querySelector and store it on
    // the shared ref so the "/" hotkey handler can reliably call .focus().
    useEffect(() => {
        const input = searchWrapperRef.current?.querySelector("input");
        if (input) (searchRef as React.MutableRefObject<HTMLInputElement | null>).current = input;
    }, [searchRef]);

    return (
    <div className="rounded-xl border border-secondary bg-secondary shadow-xs">
        {/* Title row */}
        <div className="flex items-center gap-4 px-5 py-4">
            <h1 className="text-lg font-semibold text-primary">Applications</h1>
            <Badge type="modern" color="gray" size="sm">
                {totalLeads} total applications
            </Badge>
            <Badge type="modern" color="gray" size="sm">
                £{(pipeline / 1_000_000).toFixed(1)}M in the pipeline
            </Badge>
            <div ref={searchWrapperRef} className="ml-auto">
                <Input size="sm" placeholder="Search" icon={SearchLg} shortcut="/" wrapperClassName="w-64" value={searchQuery} onChange={onSearchChange} />
            </div>
            {/* View toggle */}
            <div className="flex h-11 items-center rounded-lg border border-secondary bg-primary p-1 shadow-xs">
                <button
                    type="button"
                    onClick={() => onViewChange("table")}
                    title="Table view"
                    className={cx(
                        "flex h-full w-8 items-center justify-center rounded-md cursor-pointer",
                        view === "table" ? "bg-active shadow-xs text-fg-secondary" : "text-fg-quaternary hover:text-fg-quaternary_hover",
                    )}
                >
                    <Table className="size-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onViewChange("board")}
                    title="Board view"
                    className={cx(
                        "flex h-full w-8 items-center justify-center rounded-md cursor-pointer",
                        view === "board" ? "bg-active shadow-xs text-fg-secondary" : "text-fg-quaternary hover:text-fg-quaternary_hover",
                    )}
                >
                    <AlignTopArrow02 className="size-4" />
                </button>
            </div>
        </div>

        {/* Filters row — nested white card */}
        <div className="rounded-xl border border-secondary bg-primary">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    <DateRangeFilter
                        value={filters.dateRange}
                        label={filters.dateRangeLabel}
                        onChange={(v, l) => { filters.setDateRange(v); filters.setDateRangeLabel(l); }}
                    />
                    <AmountRangeFilter value={filters.amountRange} onChange={filters.setAmountRange} />
                    <PurposeFilter value={filters.purpose} onChange={filters.setPurpose} />
                    <AssigneeFilter value={filters.assignees} onChange={filters.setAssignees} />
                </div>

                {/* Reset filters button — only visible when filters are active */}
                {filters.activeCount > 0 && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={filters.onReset}
                            className="flex cursor-pointer items-center justify-center rounded-lg border border-primary bg-primary p-2.5 transition duration-100 hover:bg-primary_hover"
                            title="Reset filters"
                        >
                            <ClearFiltersIcon className="size-5 text-fg-quaternary" />
                        </button>
                        <span className="pointer-events-none absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-brand-solid text-xs font-semibold text-white">
                            {filters.activeCount}
                        </span>
                    </div>
                )}
            </div>
        </div>
    </div>
    );
};

// ─── Stage Badge ──────────────────────────────────────────────────────────────

const StageBadge = ({ stage }: { stage: LeadStage }) => {
    const label = columnConfig.find((c) => c.id === stage)?.label ?? stage;
    return (
        <div className="inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary px-1.5 py-0.5">
            <span className={cx("size-1.5 shrink-0 rounded-full", STAGE_DOT[stage])} />
            <span className="text-xs font-medium text-secondary">{label}</span>
        </div>
    );
};

// ─── Table View ───────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 10;

type SortCol = "company" | "loanAmount" | "termMonths" | "purpose" | "stage" | "assignee" | "timeAgo";
type SortDir = "asc" | "desc";

const parseTimeAgo = (t: string): number => {
    if (t.endsWith("min")) return parseInt(t);
    if (t.endsWith("h")) return parseInt(t) * 60;
    if (t.endsWith("d")) return parseInt(t) * 1440;
    return 0;
};

const TH = ({
    children,
    col,
    sortCol,
    sortDir,
    onSort,
}: {
    children: React.ReactNode;
    col: SortCol;
    sortCol: SortCol;
    sortDir: SortDir;
    onSort: (col: SortCol) => void;
}) => {
    const isSorted = sortCol === col;
    return (
        <th
            className="h-11 cursor-pointer select-none border-b border-secondary px-6 py-3 text-left"
            onClick={() => onSort(col)}
        >
            <div className="inline-flex items-center gap-1">
                <span className="text-xs font-semibold text-quaternary">{children}</span>
                {isSorted ? (
                    sortDir === "desc"
                        ? <ArrowUp className="size-3 text-tertiary" />
                        : <ArrowDown className="size-3 text-tertiary" />
                ) : (
                    <ChevronSelectorVertical className="size-3 text-quaternary" />
                )}
            </div>
        </th>
    );
};

const TD = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={cx("h-[72px] border-b border-secondary bg-primary px-6 py-4 text-sm font-normal text-tertiary transition-colors duration-100 group-hover:bg-secondary_subtle", className)}>
        {children}
    </td>
);

const sortLeads = (leads: Array<Lead & { stage: LeadStage }>, col: SortCol, dir: SortDir) => {
    const stageOrder: Record<LeadStage, number> = { triage: 0, new: 1, waiting: 2, done: 3 };
    const sorted = [...leads].sort((a, b) => {
        switch (col) {
            case "company":   return a.company.localeCompare(b.company);
            case "loanAmount": return a.loanAmount - b.loanAmount;
            case "termMonths": return a.termMonths - b.termMonths;
            case "purpose":   return a.purpose.localeCompare(b.purpose);
            case "stage":     return stageOrder[a.stage] - stageOrder[b.stage];
            case "assignee":  return a.assignee.name.localeCompare(b.assignee.name);
            case "timeAgo":   return parseTimeAgo(a.timeAgo) - parseTimeAgo(b.timeAgo);
        }
    });
    return dir === "desc" ? sorted.reverse() : sorted;
};

const TableView = ({ leads, isRefreshing }: { leads: Array<Lead & { stage: LeadStage }>; isRefreshing?: boolean }) => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE);
    const [sortCol, setSortCol] = useState<SortCol>("timeAgo");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const handleSort = (col: SortCol) => {
        if (col === sortCol) {
            setSortDir((d) => (d === "desc" ? "asc" : "desc"));
        } else {
            setSortCol(col);
            setSortDir("desc");
        }
        setPage(1);
    };

    const sorted = sortLeads(leads, sortCol, sortDir);
    const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
    const pageLeads = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const pages: (number | "…")[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1, 2, 3);
        if (page > 4) pages.push("…");
        if (page > 3 && page < totalPages - 2) pages.push(page);
        if (page < totalPages - 3) pages.push("…");
        pages.push(totalPages - 1, totalPages);
    }

    const thProps = { sortCol, sortDir, onSort: handleSort };

    return (
        <div className="px-5 pb-5">
            <div className="rounded-xl border border-secondary bg-secondary shadow-xs">
                <div>
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10 bg-secondary">
                            <tr>
                                <TH col="company"    {...thProps}>Company</TH>
                                <TH col="loanAmount" {...thProps}>Amount</TH>
                                <TH col="termMonths" {...thProps}>Term</TH>
                                <TH col="purpose"    {...thProps}>Purpose</TH>
                                <TH col="stage"      {...thProps}>Status</TH>
                                <TH col="assignee"   {...thProps}>Assignee</TH>
                                <TH col="timeAgo"    {...thProps}>Created</TH>
                                <th className="h-11 w-16 border-b border-secondary" />
                            </tr>
                        </thead>
                        <tbody>
                            {isRefreshing ? (
                                Array.from({ length: Math.max(pageLeads.length, 3) }).map((_, i) => <TableRowSkeleton key={i} />)
                            ) : pageLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="bg-primary px-6 py-10 text-center text-sm text-tertiary">
                                        No applications match your filters.
                                    </td>
                                </tr>
                            ) : pageLeads.map((lead) => (
                                <tr key={lead.id} onClick={() => navigate(`/uw-portal/lead/${lead.id}`)} className="group cursor-pointer">
                                    <TD className="border-l">
                                        <div className="flex items-center gap-3">
                                            <CompanyAvatar name={lead.company} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-primary">{lead.company}</span>
                                                <span className="text-sm text-tertiary">{lead.email ?? ""}</span>
                                            </div>
                                        </div>
                                    </TD>
                                    <TD>{formatAmount(lead.loanAmount)}</TD>
                                    <TD>{lead.termMonths} months</TD>
                                    <TD>{lead.purpose}</TD>
                                    <TD><StageBadge stage={lead.stage} /></TD>
                                    <TD>{lead.assignee.name}</TD>
                                    <TD>{lead.timeAgo}</TD>
                                    <TD className="border-r">
                                        <button
                                            type="button"
                                            className="flex items-center justify-center rounded-md p-1.5 text-fg-quaternary opacity-0 transition-opacity hover:bg-secondary_subtle group-hover:opacity-100"
                                        >
                                            <Edit01 className="size-4" />
                                        </button>
                                    </TD>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex shrink-0 items-center justify-between border-t border-secondary px-5 pt-5 pb-4">
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:text-disabled"
                    >
                        <ArrowLeft className="size-5" /> Previous
                    </button>

                    <div className="flex items-center gap-0.5">
                        {pages.map((p, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={p === "…"}
                                onClick={() => typeof p === "number" && setPage(p)}
                                className={cx(
                                    "flex size-10 items-center justify-center rounded-lg text-sm font-medium transition",
                                    p === page
                                        ? "bg-primary_hover text-secondary"
                                        : "text-tertiary hover:bg-primary_hover",
                                    p === "…" && "cursor-default",
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <FilterSelect
                            value={String(rowsPerPage)}
                            onChange={(v) => { setRowsPerPage(Number(v)); setPage(1); }}
                            options={["10", "50", "100"]}
                            selectClassName="py-2"
                        />
                        <button
                            type="button"
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => p + 1)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:text-disabled"
                        >
                            Next <ArrowRight className="size-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Activity mock data ───────────────────────────────────────────────────────

interface ActivityEntry {
    id: string;
    type: "event" | "comment";
    text: string;
    author: string;
    source?: string;
    date: string;
    time: string;
}

const MOCK_ACTIVITY: ActivityEntry[] = [
    { id: "a1", type: "event",   text: "Application submitted",       author: "System",      source: "Website form", date: "20 March", time: "11:23" },
    { id: "a2", type: "event",   text: "Assigned to Jake Torres",     author: "Sarah Chen",                          date: "20 March", time: "11:59" },
    { id: "a3", type: "comment", text: "Requested latest bank statements. Applicant confirmed they will send over by end of day.", author: "Jake Torres", date: "20 March", time: "12:03" },
    { id: "a4", type: "event",   text: "Moved to New", author: "Jake Torres",                       date: "21 March", time: "09:14" },
    { id: "a5", type: "comment", text: "Initial eligibility check passed. Awaiting supporting docs before progressing.", author: "Jake Torres", date: "21 March", time: "09:22" },
];

// ─── Copy toast ───────────────────────────────────────────────────────────────

const CopyToastCtx = createContext<(message?: string, icon?: React.FC<{ className?: string }>) => void>(() => {});

const CopyToast = ({ visible, message = "Copied to your clipboard", icon: Icon = CheckDone01 }: { visible: boolean; message?: string; icon?: React.FC<{ className?: string }> }) => (
    <div
        className={cx(
            "pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-secondary bg-primary px-4 py-2.5 shadow-lg text-sm font-medium text-primary transition-all duration-200",
            visible ? "opacity-100 translate-y-0" : "translate-y-2 opacity-0",
        )}
    >
        <Icon className="size-4 text-success-500" />
        {message}
    </div>
);

// ─── Lead Detail Header ───────────────────────────────────────────────────────

const HeaderPill = ({ children }: { children: React.ReactNode }) => (
    <span className="rounded-sm border border-primary bg-primary px-1.5 py-0.5 text-xs font-medium text-secondary shadow-xs">
        {children}
    </span>
);

const LeadDetailHeader = ({ lead, onBack }: { lead: Lead & { stage: LeadStage }; onBack: () => void }) => (
    <div className="rounded-xl border border-secondary bg-secondary shadow-xs">
        <div className="flex items-center gap-3 px-4 py-4">
            <button
                type="button"
                onClick={onBack}
                className="flex shrink-0 items-center justify-center rounded-lg border border-primary bg-primary p-2.5 shadow-xs transition hover:bg-primary_hover"
            >
                <ChevronLeft className="size-5 text-fg-secondary" />
            </button>

            <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-primary">{lead.company}</span>
                <HeaderPill>{formatAmount(lead.loanAmount)}</HeaderPill>
                <HeaderPill>{lead.termMonths} mo</HeaderPill>
                <HeaderPill>{lead.purpose}</HeaderPill>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-1.5 rounded-md border border-primary bg-primary px-2.5 py-1 shadow-xs">
                <span className={cx("size-2 shrink-0 rounded-full", STAGE_DOT[lead.stage])} />
                <span className="text-sm font-medium text-secondary">
                    {columnConfig.find((c) => c.id === lead.stage)?.label ?? lead.stage}
                </span>
            </div>
        </div>
    </div>
);

// ─── Activity Log ─────────────────────────────────────────────────────────────

const ActivityLog = ({ entries: initialEntries }: { entries: ActivityEntry[] }) => {
    const [entries, setEntries] = useState(initialEntries);
    const [note, setNote] = useState("");
    const timelineRef = useRef<HTMLDivElement>(null);

    const handleAddNote = () => {
        if (!note.trim()) return;
        const now = new Date();
        const newEntry: ActivityEntry = {
            id: `note-${Date.now()}`,
            type: "comment",
            text: note.trim(),
            author: "Jake Torres",
            date: now.toLocaleDateString("en-GB", { day: "numeric", month: "long" }),
            time: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        };
        setEntries((prev) => [...prev, newEntry]);
        setNote("");
        setTimeout(() => {
            if (timelineRef.current) {
                timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
            }
        }, 0);
    };

    return (
        <PanelCard title="Activity Log" className="h-full" innerClassName="flex flex-1 flex-col justify-between p-2 gap-0 min-h-0">
            {/* Timeline */}
            <div ref={timelineRef} className="scrollbar-hide flex-1 overflow-y-auto px-2 py-2">
                {entries.map((entry, i) => {
                    const isLast = i === entries.length - 1;
                    return (
                        <div key={entry.id} className="flex items-start gap-3">
                            {/* Step icon + connector */}
                            <div className="flex shrink-0 flex-col items-center gap-1 self-stretch pb-1">
                                <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-secondary bg-secondary_subtle">
                                    {entry.type === "comment"
                                        ? <MessageSquare01 className="size-3 text-fg-quaternary" />
                                        : <span className="size-2 rounded-full bg-fg-quaternary" />
                                    }
                                </div>
                                {!isLast && <div className="w-0.5 flex-1 rounded-sm bg-secondary" />}
                            </div>

                            {/* Content */}
                            <div className={cx("flex flex-1 flex-col", !isLast && "pb-6")}>
                                <p className="text-sm font-semibold text-secondary">{entry.text}</p>
                                <div className="mt-0.5 flex items-center gap-1 text-sm text-quaternary">
                                    {entry.source && <><span>{entry.source}</span><span className="size-1 rounded-full bg-fg-quaternary" /></>}
                                    <span>{entry.author}</span>
                                    <span className="size-1 rounded-full bg-fg-quaternary" />
                                    <span>{entry.date}</span>
                                    <span className="size-1 rounded-full bg-fg-quaternary" />
                                    <span>{entry.time}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Notes input */}
            <div className="flex shrink-0 flex-col gap-1.5 px-2 pb-2">
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
                    placeholder="Add your notes"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-primary bg-primary px-3.5 py-3 text-sm text-primary shadow-xs placeholder:text-quaternary focus:border-brand-solid focus:outline-none"
                />
                <button
                    type="button"
                    disabled={!note.trim()}
                    onClick={handleAddNote}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-solid bg-primary px-3.5 py-2.5 text-sm font-semibold text-brand-secondary shadow-xs transition hover:bg-secondary_subtle disabled:cursor-not-allowed disabled:border-secondary disabled:text-disabled"
                >
                    <MessageSquare01 className="size-5" />
                    Add note
                </button>
            </div>
        </PanelCard>
    );
};

// ─── Assignee Picker (single-select, used in lead detail view) ────────────────

const AssigneePicker = ({
    value,
    onChange,
}: {
    value: { name: string; initials: string };
    onChange: (v: { name: string; initials: string }) => void;
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    useEffect(() => {
        if (open) { setSearch(""); setTimeout(() => inputRef.current?.focus(), 0); }
    }, [open]);

    const showToast = useContext(CopyToastCtx);

    const allEntries = ASSIGNEES.map((a, i) => ({
        display: i === 0 ? "Me" : a.name,
        name: a.name,
        initials: a.name.split(" ").map(w => w[0]).join(""),
        avatar: a.avatar,
    }));
    const filtered = allEntries.filter(a => a.display.toLowerCase().includes(search.toLowerCase()));
    const displayName = value.name === ASSIGNEES[0].name ? "Me" : value.name;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-sm text-tertiary">Assigned to</span>
                <div className="flex items-center gap-2">
                    <img
                        src={ASSIGNEES.find(a => a.name === value.name)?.avatar ?? ASSIGNEES[0].avatar}
                        alt={displayName}
                        className="size-5 rounded-full object-cover"
                    />
                    <span className="text-base font-semibold text-secondary">{displayName}</span>
                </div>
            </div>
            <div ref={wrapperRef} className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="flex items-center justify-center rounded-lg border border-primary bg-primary p-2 shadow-xs transition hover:bg-primary_hover"
                >
                    <UserEdit className="size-5 text-fg-quaternary" />
                </button>

                {open && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-[260px] overflow-hidden rounded-xl border border-secondary bg-primary shadow-xl">
                        {/* Search */}
                        <div className="flex items-center gap-2.5 border-b border-secondary px-4 py-3">
                            <SearchLg className="size-5 shrink-0 text-fg-quaternary" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search"
                                className="w-full bg-transparent text-md text-primary placeholder:text-placeholder focus:outline-none"
                            />
                        </div>
                        {/* List */}
                        <div className="max-h-[280px] overflow-y-auto py-1.5">
                            {filtered.map(({ display, name, initials, avatar }) => {
                                const isSelected = value.name === name;
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => { onChange({ name, initials }); setOpen(false); showToast(`Assigned to ${display}`, User01); }}
                                        className={cx(
                                            "flex w-full cursor-pointer items-center gap-3 px-3 py-2",
                                            isSelected ? "bg-active" : "hover:bg-secondary_subtle",
                                        )}
                                    >
                                        <img src={avatar} alt={display} className="size-8 shrink-0 rounded-full object-cover" />
                                        <span className="flex-1 text-left text-md font-medium text-primary">{display}</span>
                                        {isSelected && <CheckCircle className="size-5 shrink-0 text-brand-secondary" />}
                                    </button>
                                );
                            })}
                            {filtered.length === 0 && (
                                <p className="px-3 py-4 text-center text-sm text-tertiary">No results</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Lead Detail View ─────────────────────────────────────────────────────────


const SummaryField = ({ label, value, className }: { label: string; value?: string; className?: string }) => {
    const showToast = useContext(CopyToastCtx);
    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value).catch(() => {});
        showToast();
    };
    return (
        <div className={cx("flex flex-col", className)}>
            <span className="text-sm text-tertiary">{label}</span>
            <span
                onClick={value ? handleCopy : undefined}
                className={cx("text-base font-semibold text-secondary", value && "cursor-pointer transition-colors hover:text-primary")}
            >
                {value ?? "—"}
            </span>
        </div>
    );
};

// Section card for Overview tab — same visual as PanelCard but with 2-col wrap inner layout
const InfoCard = ({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex w-full flex-col rounded-xl border border-secondary bg-secondary_subtle shadow-xs">
        <div className="flex h-11 shrink-0 items-center gap-4 pl-5 pr-3">
            <span className="flex-1 text-sm font-semibold text-primary">{title}</span>
            {badge}
        </div>
        <div className="flex flex-wrap gap-3 rounded-xl border border-secondary bg-primary px-6 py-5">
            {children}
        </div>
    </div>
);

const SummaryFieldAction = ({
    label,
    value,
    icon: Icon,
    href,
    onAction,
}: {
    label: string;
    value?: string;
    icon: React.FC<{ className?: string }>;
    href?: string;
    onAction?: () => void;
}) => {
    const showToast = useContext(CopyToastCtx);
    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value).catch(() => {});
        showToast();
    };
    const btnClass = "flex items-center justify-center rounded-lg border border-primary bg-primary p-2 shadow-xs transition hover:bg-primary_hover";
    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-sm text-tertiary">{label}</span>
                <span
                    onClick={value ? handleCopy : undefined}
                    className={cx("text-base font-semibold text-secondary", value && "cursor-pointer transition-colors hover:text-primary")}
                >
                    {value ?? "—"}
                </span>
            </div>
            {href ? (
                <a href={href} className={btnClass}>
                    <Icon className="size-5 text-fg-quaternary" />
                </a>
            ) : (
                <button type="button" onClick={onAction} className={btnClass}>
                    <Icon className="size-5 text-fg-quaternary" />
                </button>
            )}
        </div>
    );
};

// ─── Decision Tab ─────────────────────────────────────────────────────────────

const DECLINE_REASONS = [
    "Low credit score",
    "CCJ in last 36 months",
    "Insufficient trading history",
    "Turnover below minimum threshold",
    "Unacceptable loan purpose",
    "Director has adverse credit",
    "Company dissolved / struck off risk",
    "Loan amount exceeds policy limit",
    "DSCR below minimum threshold",
];

const calcMonthlyPayment = (amount: number, termMonths: number, annualRate: number) => {
    const r = annualRate / 100 / 12;
    if (r === 0) return amount / termMonths;
    return (amount * r) / (1 - Math.pow(1 + r, -termMonths));
};

const DecisionAccordionItem = ({
    kind,
    open,
    decided,
    onToggle,
    children,
}: {
    kind: "approve" | "decline";
    open: boolean;
    decided?: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) => {
    const config = {
        approve: { label: decided ? "Approved" : "Approve", icon: CheckCircle, color: "text-[#079455]" },
        decline: { label: decided ? "Declined" : "Decline", icon: XCircle,     color: "text-[#d92d20]" },
    }[kind];
    const Icon = config.icon;
    const Chevron = (open || decided) ? ChevronUp : ChevronDown;

    return (
        <div className="flex w-full flex-col rounded-xl border border-secondary bg-secondary_subtle shadow-xs">
            <button
                type="button"
                onClick={decided ? undefined : onToggle}
                className={cx("flex w-full items-center justify-between px-3 py-3 transition", !decided && "hover:bg-secondary_subtle")}
            >
                <div className="flex items-center gap-2">
                    <Icon className={cx("size-5 shrink-0", config.color)} />
                    <span className={cx("text-sm font-semibold", config.color)}>{config.label}</span>
                </div>
                <Chevron className="size-5 text-fg-quaternary" />
            </button>
            {(open || decided) && (
                <div className="flex flex-wrap gap-3 rounded-xl border border-secondary bg-primary px-5 py-5">
                    {children}
                </div>
            )}
        </div>
    );
};

const DecisionTab = ({ lead, onDecision, existingDecision }: { lead: Lead; onDecision: (d: "approved" | "declined") => void; existingDecision?: "approved" | "declined" }) => {
    const [open, setOpen] = useState<"approve" | "decline" | null>(existingDecision === "approved" ? "approve" : existingDecision === "declined" ? "decline" : null);
    const toggle = (item: "approve" | "decline") =>
        setOpen((prev) => (prev === item ? null : item));

    const [loanAmount, setLoanAmount]   = useState(String(lead.loanAmount));
    const [termMonths, setTermMonths]   = useState(String(lead.termMonths));
    const [rate, setRate]               = useState("6");
    const [conditions, setConditions]   = useState("");
    const [securities, setSecurities]   = useState("");
    const [checked, setChecked]         = useState<Record<string, boolean>>({});

    const monthly = calcMonthlyPayment(
        parseFloat(loanAmount) || 0,
        parseInt(termMonths) || 1,
        parseFloat(rate) || 0,
    );

    const inputClass = "w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs placeholder:text-quaternary focus:border-brand-solid focus:outline-none";
    const disabledInputClass = "w-full rounded-lg border border-primary bg-secondary_subtle px-3 py-2 text-sm text-quaternary shadow-xs";
    const labelClass = "mb-1.5 block text-sm font-medium text-secondary";

    return (
        <div className="flex w-full flex-col gap-3">
            {/* Approve */}
            <DecisionAccordionItem kind="approve" open={open === "approve"} decided={existingDecision === "approved"} onToggle={() => toggle("approve")}>
                <div className="flex w-full flex-wrap gap-3">
                    <div className="flex min-w-[200px] flex-1 flex-col">
                        <label className={labelClass}>Loan amount</label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary">£</span>
                            <input
                                type="number"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(e.target.value)}
                                className={cx(inputClass, "pl-7")}
                            />
                        </div>
                    </div>
                    <div className="flex min-w-[200px] flex-1 flex-col">
                        <label className={labelClass}>Term in months</label>
                        <input
                            type="number"
                            value={termMonths}
                            onChange={(e) => setTermMonths(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className="flex min-w-[200px] flex-1 flex-col">
                        <label className={labelClass}>Rate in %</label>
                        <input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className="flex min-w-[200px] flex-1 flex-col">
                        <label className={labelClass}>Monthly payments</label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-quaternary">£</span>
                            <input
                                type="text"
                                readOnly
                                value={monthly.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
                                className={cx(disabledInputClass, "pl-7")}
                            />
                        </div>
                    </div>
                    <div className="w-full flex-col">
                        <label className={labelClass}>Conditions Precedent</label>
                        <textarea
                            value={conditions}
                            onChange={(e) => setConditions(e.target.value)}
                            placeholder="e.g. Personal guarantee from the director"
                            rows={5}
                            className={cx(inputClass, "resize-y")}
                        />
                    </div>
                    <div className="w-full flex-col">
                        <label className={labelClass}>Securities</label>
                        <textarea
                            value={securities}
                            onChange={(e) => setSecurities(e.target.value)}
                            placeholder="e.g. Debenture over company assets"
                            rows={5}
                            className={cx(inputClass, "resize-y")}
                        />
                    </div>
                    <div className="flex w-full justify-end pt-1">
                        {existingDecision === "approved" ? (
                            <div className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary_subtle px-4 py-2.5 text-sm font-semibold text-[#079455] shadow-xs">
                                <CheckCircle className="size-4" />
                                Loan Approved
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={!!existingDecision}
                                onClick={() => onDecision("approved")}
                                className="rounded-lg bg-[#079455] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#067a48] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Approve this loan
                            </button>
                        )}
                    </div>
                </div>
            </DecisionAccordionItem>

            {/* Decline */}
            <DecisionAccordionItem kind="decline" open={open === "decline"} decided={existingDecision === "declined"} onToggle={() => toggle("decline")}>
                <div className="flex w-full flex-wrap gap-x-6 gap-y-3">
                    {DECLINE_REASONS.map((reason) => (
                        <label key={reason} className="flex w-[calc(50%-12px)] cursor-pointer items-center gap-2.5">
                            <input
                                type="checkbox"
                                checked={!!checked[reason]}
                                onChange={(e) => setChecked((prev) => ({ ...prev, [reason]: e.target.checked }))}
                                className="size-4 shrink-0 rounded border border-primary accent-[#d92d20]"
                            />
                            <span className="text-sm font-medium text-secondary">{reason}</span>
                        </label>
                    ))}
                    <div className="flex w-full justify-end pt-1">
                        {existingDecision === "declined" ? (
                            <div className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary_subtle px-4 py-2.5 text-sm font-semibold text-[#d92d20] shadow-xs">
                                <XCircle className="size-4" />
                                Loan Declined
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={!!existingDecision}
                                onClick={() => onDecision("declined")}
                                className="rounded-lg bg-[#d92d20] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#b42318] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Decline this loan
                            </button>
                        )}
                    </div>
                </div>
            </DecisionAccordionItem>

        </div>
    );
};

type DetailTab = "overview" | "documents" | "analysis" | "export" | "decision";


const LeadDetailView = ({ lead, onDecision }: { lead: Lead & { stage: LeadStage }; onDecision: (d: "approved" | "declined") => void }) => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<DetailTab>("overview");
    const [assignee, setAssignee] = useState(lead.assignee);
    const pdfIframeRef = useRef<HTMLIFrameElement>(null);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("Copied to your clipboard");
    const [toastIcon, setToastIcon] = useState<React.FC<{ className?: string }>>(() => CheckDone01);
    const [documents, setDocuments] = useState<{ name: string; size: string; uploadedAt: Date }[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ filename: string; onConfirm: () => void } | null>(null);
    const [activePdfKey, setActivePdfKey] = useState<string | null>(null);

    useEffect(() => {
        if (!activePdfKey) return;
        const handler = (e: MouseEvent) => {
            const container = document.querySelector(`[data-pdf-key="${CSS.escape(activePdfKey)}"]`);
            if (!container?.contains(e.target as Node)) setActivePdfKey(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [activePdfKey]);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const showToast = useCallback((message?: string, icon?: React.FC<{ className?: string }>) => {
        if (message) setToastMessage(message);
        setToastIcon(() => icon ?? CheckDone01);
        setToastVisible(true);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
    }, []);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");
        setDocuments((prev) => [
            ...prev,
            ...pdfs.map((f) => ({
                name: f.name,
                size: f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                uploadedAt: new Date(),
            })),
        ]);
    };

    const handleDecision = (d: "approved" | "declined") => {
        onDecision(d);
        showToast(d === "approved" ? "Loan approved — moved to Decision Made" : "Loan declined — moved to Decision Made");
    };

    const tabs: { id: DetailTab; label: string }[] = [
        { id: "overview",  label: "Overview" },
        { id: "documents", label: "Documents" },
        { id: "analysis",  label: "Data Analysis" },
        { id: "export",    label: "Credit Report" },
        { id: "decision",  label: "Decision" },
    ];

    return (
        <CopyToastCtx.Provider value={showToast}>
        <div className="flex h-full flex-col">
            <CopyToast visible={toastVisible} message={toastMessage} icon={toastIcon} />
            {/* Header */}
            <div className="shrink-0 px-4 pt-4">
                <LeadDetailHeader lead={lead} onBack={() => navigate(-1)} />
            </div>

            {/* Body: 3 panels */}
            <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">

                {/* Left — Quick Summary */}
                <div className="flex min-w-[220px] flex-[1] flex-col overflow-y-auto scrollbar-hide">
                    <PanelCard title="Quick Summary" innerClassName="flex flex-col gap-3 px-5 py-4">
                        <SummaryField label="Company name"   value={lead.company} />
                        <SummaryField label="Company Number" value={lead.companyNumber} />
                        <SummaryField label="Address"        value={lead.address} />
                        <SummaryField label="Incorporated"   value={lead.incorporated} />

                        <div className="h-[1.5px] bg-[var(--color-border-secondary)]" />

                        <SummaryField label="Loan Amount"    value={formatAmount(lead.loanAmount)} />
                        <SummaryField label="Loan Term"      value={`${lead.termMonths} months`} />
                        <SummaryField label="Loan Purpose"   value={lead.purpose} />

                        <div className="h-[1.5px] bg-[var(--color-border-secondary)]" />

                        <SummaryField label="Applicant"      value={lead.applicantName} />
                        <SummaryFieldAction label="Email"     value={lead.email}      icon={Mail05}     href={lead.email ? `mailto:${lead.email}` : undefined} />
                        <SummaryFieldAction label="Telephone" value={lead.telephone}  icon={PhoneCall01} href={lead.telephone ? `tel:${lead.telephone}` : undefined} />

                        <div className="h-[1.5px] bg-[var(--color-border-secondary)]" />

                        <AssigneePicker value={assignee} onChange={setAssignee} />
                    </PanelCard>
                </div>

                {/* Center — Tabbed content */}
                <div className="flex flex-[3] flex-col overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex h-11 shrink-0 items-end gap-3 border-b border-secondary">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={cx(
                                    "flex h-8 shrink-0 items-center whitespace-nowrap px-1 text-sm font-semibold transition",
                                    tab === t.id
                                        ? "border-b-2 border-brand-solid text-brand-secondary"
                                        : "text-quaternary hover:text-tertiary",
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable sections */}
                    <div className={cx("flex flex-1 flex-col gap-4 py-4", tab === "export" ? "min-h-0 overflow-hidden" : "scrollbar-hide overflow-y-auto")}>
                        {tab === "overview" && (
                            <>
                                <InfoCard title="Company details">
                                    <SummaryField label="Name"                     value={lead.company}        className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Companies House Number"   value={lead.companyNumber}  className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Registered Address"       value={lead.address}        className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Incorporated"             value={lead.incorporated}   className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Status"                   value="Active"              className="w-[calc(50%-6px)]" />
                                </InfoCard>

                                <InfoCard
                                    title="Directors"
                                    badge={
                                        <div className="flex w-[22px] items-center justify-center rounded-md border border-secondary px-1.5 py-0.5">
                                            <span className="text-center text-xs font-medium text-secondary">1</span>
                                        </div>
                                    }
                                >
                                    <SummaryField label="Name"       value={lead.applicantName} className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Email"      value={lead.email}         className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Telephone"  value={lead.telephone}     className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Role"       value="Director"           className="w-[calc(50%-6px)]" />
                                </InfoCard>

                                <InfoCard title="Financials">
                                    <SummaryField label="Loan Amount"  value={formatAmount(lead.loanAmount)}   className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Loan Term"    value={`${lead.termMonths} months`}     className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Loan Purpose" value={lead.purpose}                    className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Submitted"    value={`${lead.timeAgo} ago`}           className="w-[calc(50%-6px)]" />
                                </InfoCard>

                                <InfoCard title="Documents">
                                    <SummaryField label="Status" value="No documents uploaded" className="w-full" />
                                </InfoCard>
                            </>
                        )}
                        {tab === "analysis" && (
                            <>
                                <InfoCard
                                    title="Provenir"
                                    badge={
                                        <span className="rounded-sm border border-primary bg-primary px-1.5 py-0.5 text-xs font-medium text-secondary shadow-xs">
                                            10-15-2024
                                        </span>
                                    }
                                >
                                    <pre className="w-full overflow-x-auto rounded-lg bg-primary p-4 text-xs leading-relaxed" style={{ fontFamily: "'Roboto Mono', 'Fira Mono', monospace", color: "#4a4340" }}>
                                        <code>
                                            <span style={{ color: "#067647" }}>{"// Provenir Decision Engine — Response"}</span>{"\n"}
                                            {"{"}{"\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"request_id"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"PRV-2024-1015-00482"'}</span>{",\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"status"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"COMPLETED"'}</span>{",\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"decision"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"REFER"'}</span>{",\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"score"}</span>{": "}<span style={{ color: "#4a4340" }}>{"612"}</span>{",\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"risk_band"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"C"'}</span>{",\n"}
                                            {"\n"}
                                            {"  "}<span style={{ color: "#067647" }}>{"// Policy rule outcomes"}</span>{"\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"policy_rules"}</span>{": ["}{"\n"}
                                            {"    {"}{"\n"}
                                            {"      "}<span style={{ color: "#175cd3" }}>{"rule_id"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"R-014"'}</span>{",\n"}
                                            {"      "}<span style={{ color: "#175cd3" }}>{"description"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"Minimum trading period check"'}</span>{",\n"}
                                            {"      "}<span style={{ color: "#175cd3" }}>{"outcome"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"PASS"'}</span>{"\n"}
                                            {"    },"}{"\n"}
                                            {"    {"}{"\n"}
                                            {"      "}<span style={{ color: "#175cd3" }}>{"rule_id"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"R-027"'}</span>{",\n"}
                                            {"      "}<span style={{ color: "#175cd3" }}>{"description"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"CCJ check — last 36 months"'}</span>{",\n"}
                                            {"      "}<span style={{ color: "#175cd3" }}>{"outcome"}</span>{": "}<span style={{ color: "#c11574" }}>{'"REFER"'}</span>{"\n"}
                                            {"    }"}{"\n"}
                                            {"  ],"}{"\n"}
                                            {"\n"}
                                            {"  "}<span style={{ color: "#067647" }}>{"// Affordability"}</span>{"\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"affordability"}</span>{": {"}{"\n"}
                                            {"    "}<span style={{ color: "#175cd3" }}>{"monthly_repayment"}</span>{": "}<span style={{ color: "#4a4340" }}>{"3916.67"}</span>{",\n"}
                                            {"    "}<span style={{ color: "#175cd3" }}>{"dscr"}</span>{": "}<span style={{ color: "#4a4340" }}>{"1.42"}</span>{",\n"}
                                            {"    "}<span style={{ color: "#175cd3" }}>{"dscr_pass"}</span>{": "}<span style={{ color: "#4a4340" }}>{"true"}</span>{"\n"}
                                            {"  }"}{"\n"}
                                            {"}"}
                                        </code>
                                    </pre>
                                </InfoCard>

                                <InfoCard
                                    title="Experian"
                                    badge={
                                        <span className="rounded-sm border border-primary bg-primary px-1.5 py-0.5 text-xs font-medium text-secondary shadow-xs">
                                            10-15-2024
                                        </span>
                                    }
                                >
                                    <pre className="w-full overflow-x-auto rounded-lg bg-primary p-4 text-xs leading-relaxed" style={{ fontFamily: "'Roboto Mono', 'Fira Mono', monospace", color: "#4a4340" }}>
                                        <code>
                                            <span style={{ color: "#067647" }}>{"// Experian Commercial Credit Report — Summary"}</span>{"\n"}
                                            {"{"}{"\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"report_reference"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"EXP-COM-20241015-9184"'}</span>{",\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"company_number"}</span>{": "}<span style={{ color: "#4a4340" }}>{`"${lead.companyNumber}"`}</span>{",\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"commercial_delphi_score"}</span>{": "}<span style={{ color: "#4a4340" }}>{"58"}</span>{",\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"score_band"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"4 — Above Average Risk"'}</span>{",\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"credit_limit_recommended"}</span>{": "}<span style={{ color: "#4a4340" }}>{"95000"}</span>{",\n"}
                                            {"\n"}
                                            {"  "}<span style={{ color: "#067647" }}>{"// County Court Judgements"}</span>{"\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"ccjs"}</span>{": ["}{"\n"}
                                            {"    {"}{"\n"}
                                            {"      "}<span style={{ color: "#175cd3" }}>{"date"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"2022-08-11"'}</span>{",\n"}
                                            {"      "}<span style={{ color: "#175cd3" }}>{"amount"}</span>{": "}<span style={{ color: "#4a4340" }}>{"4200"}</span>{",\n"}
                                            {"      "}<span style={{ color: "#175cd3" }}>{"status"}</span>{": "}<span style={{ color: "#c11574" }}>{'"UNSATISFIED"'}</span>{"\n"}
                                            {"    }"}{"\n"}
                                            {"  ],"}{"\n"}
                                            {"\n"}
                                            {"  "}<span style={{ color: "#067647" }}>{"// Filed accounts (FY 2022/23)"}</span>{"\n"}
                                            {"  "}<span style={{ color: "#175cd3" }}>{"filed_accounts"}</span>{": {"}{"\n"}
                                            {"    "}<span style={{ color: "#175cd3" }}>{"year_end"}</span>{": "}<span style={{ color: "#4a4340" }}>{'"2023-03-31"'}</span>{",\n"}
                                            {"    "}<span style={{ color: "#175cd3" }}>{"turnover"}</span>{": "}<span style={{ color: "#4a4340" }}>{"842000"}</span>{",\n"}
                                            {"    "}<span style={{ color: "#175cd3" }}>{"net_profit"}</span>{": "}<span style={{ color: "#4a4340" }}>{"124500"}</span>{",\n"}
                                            {"    "}<span style={{ color: "#175cd3" }}>{"total_assets"}</span>{": "}<span style={{ color: "#4a4340" }}>{"391200"}</span>{"\n"}
                                            {"  }"}{"\n"}
                                            {"}"}
                                        </code>
                                    </pre>
                                </InfoCard>
                            </>
                        )}
                        {tab === "export" && (
                            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-secondary bg-secondary_subtle shadow-xs">
                                <div className="flex h-11 shrink-0 items-center gap-4 pl-5 pr-3">
                                    <span className="flex-1 text-sm font-semibold text-primary">Credit Report</span>
                                    <span className="rounded-sm border border-primary bg-primary px-1.5 py-0.5 text-xs font-medium text-secondary shadow-xs">
                                        lovey_credit_report.PDF
                                    </span>
                                </div>
                                <div className="relative flex min-h-0 flex-1 flex-col rounded-xl border border-secondary bg-primary">
                                    <iframe
                                        ref={pdfIframeRef}
                                        src="/Credit Report.pdf"
                                        className="min-h-0 flex-1 w-full rounded-xl"
                                        style={{ colorScheme: "light" }}
                                        title="Credit Report"
                                    />
                                    <div className="flex justify-end gap-2 px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => pdfIframeRef.current?.contentWindow?.print()}
                                            className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary shadow-xs transition hover:bg-primary_hover"
                                        >
                                            <Printer className="size-4 text-fg-quaternary" />
                                            Print
                                        </button>
                                        <a
                                            href="/Credit Report.pdf"
                                            download="Credit Report.pdf"
                                            className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary shadow-xs transition hover:bg-primary_hover"
                                        >
                                            <Download01 className="size-4 text-fg-quaternary" />
                                            Download
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                        {tab === "documents" && (() => {
                            const UPLOAD_PLACEHOLDER_PDF = "/Bank Statement.pdf";
                            const fmtUploadTime = (d: Date) => {
                                const secs = Math.floor((Date.now() - d.getTime()) / 1000);
                                if (secs < 60) return "just now";
                                const mins = Math.floor(secs / 60);
                                if (mins < 60) return `${mins}min`;
                                const hrs = Math.floor(mins / 60);
                                if (hrs < 24) return `${hrs}h`;
                                return `${Math.floor(hrs / 24)}d`;
                            };
                            const staticDocs = [
                                { label: "Accounts", filename: `${lead.company} — Accounts.pdf`, src: "/Accounts.pdf", timestamp: lead.timeAgo },
                                { label: "Bank Statement", filename: `${lead.company} — Bank Statement.pdf`, src: "/Bank Statement.pdf", timestamp: lead.timeAgo },
                            ];
                            const uploadedDocs = [...documents].map((d, i) => ({ label: d.name, filename: d.name, src: UPLOAD_PLACEHOLDER_PDF, originalIndex: i, timestamp: fmtUploadTime(d.uploadedAt) })).reverse();
                            const DocCard = ({ label, filename, src, timestamp, onDelete, isActive, onActivate }: { label: string; filename: string; src: string; timestamp: string; onDelete?: () => void; isActive?: boolean; onActivate?: () => void }) => (
                                <div className="flex min-h-0 flex-col rounded-xl border border-secondary bg-secondary_subtle shadow-xs">
                                    <div className="flex h-11 shrink-0 items-center gap-4 pl-5 pr-3">
                                        <div className="flex flex-1 items-center gap-1.5 min-w-0">
                                            <span className="text-sm font-semibold text-primary shrink-0">{label}</span>
                                            <span className="text-fg-quaternary shrink-0">·</span>
                                            <span className="text-sm text-tertiary shrink-0">{timestamp}</span>
                                        </div>
                                        <span className="shrink-0 rounded-sm border border-primary bg-primary px-1.5 py-0.5 text-xs font-medium text-secondary shadow-xs">
                                            {filename}
                                        </span>
                                    </div>
                                    <div data-pdf-key={label} className="flex flex-col rounded-xl border border-secondary bg-primary" style={{ height: 480 }}>
                                        <div className="relative min-h-0 flex-1">
                                            <iframe
                                                src={src}
                                                className="h-full w-full rounded-t-xl"
                                                style={{ colorScheme: "light" }}
                                                title={label}
                                            />
                                            {!isActive && (
                                                <div
                                                    className="absolute inset-0 z-10 cursor-pointer rounded-t-xl"
                                                    onClick={onActivate}
                                                />
                                            )}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2 px-4 py-3">
                                            {onDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteConfirm({ filename, onConfirm: onDelete })}
                                                    className="group flex shrink-0 items-center justify-center rounded-lg border border-primary bg-primary p-2.5 shadow-xs transition hover:bg-error-primary"
                                                >
                                                    <Trash01 className="size-5 text-fg-secondary group-hover:text-fg-error-primary" />
                                                </button>
                                            )}
                                            <div className="flex flex-1 justify-end gap-2">
                                                <a
                                                    href={src}
                                                    download={filename}
                                                    className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary shadow-xs transition hover:bg-primary_hover"
                                                >
                                                    <Download01 className="size-4 text-fg-quaternary" />
                                                    Download
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const iframe = document.querySelector<HTMLIFrameElement>(`iframe[title="${label}"]`);
                                                        iframe?.contentWindow?.print();
                                                    }}
                                                    className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 py-2 text-sm font-semibold text-secondary shadow-xs transition hover:bg-primary_hover"
                                                >
                                                    <Printer className="size-4 text-fg-quaternary" />
                                                    Print
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                            return (
                                <div className="flex flex-col gap-4">
                                    {/* Upload zone */}
                                    <div
                                        className={cx(
                                            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-secondary bg-primary px-6 py-8 text-center transition hover:bg-primary_hover",
                                            dragOver && "bg-primary_hover",
                                        )}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                                        onClick={() => uploadInputRef.current?.click()}
                                    >
                                        <input
                                            ref={uploadInputRef}
                                            type="file"
                                            accept=".pdf"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => handleFiles(e.target.files)}
                                        />
                                        <div className="flex size-10 items-center justify-center rounded-lg border border-secondary bg-primary shadow-xs">
                                            <UploadCloud02 className="size-5 text-fg-quaternary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-brand-secondary">Click to upload <span className="font-normal text-tertiary">or drag and drop</span></p>
                                            <p className="mt-0.5 text-xs text-tertiary">PDF (2MB max)</p>
                                        </div>
                                    </div>
                                    {/* Uploaded files — newest first */}
                                    {uploadedDocs.map((doc) => (
                                        <DocCard
                                            key={doc.label}
                                            {...doc}
                                            isActive={activePdfKey === doc.label}
                                            onActivate={() => setActivePdfKey(doc.label)}
                                            onDelete={() => setDocuments((prev) => prev.filter((_, i) => i !== doc.originalIndex))}
                                        />
                                    ))}
                                    {/* Static documents */}
                                    {staticDocs.map((d) => (
                                        <DocCard key={d.label} label={d.label} filename={d.filename} src={d.src} timestamp={d.timestamp} isActive={activePdfKey === d.label} onActivate={() => setActivePdfKey(d.label)} />
                                    ))}
                                </div>
                            );
                        })()}
                        {tab === "decision" && (
                            <DecisionTab lead={lead} onDecision={handleDecision} existingDecision={lead.decision} />
                        )}
                    </div>
                </div>

                {/* Right — Activity Log */}
                <div className="flex min-w-[220px] flex-[1] flex-col overflow-hidden">
                    <ActivityLog entries={MOCK_ACTIVITY} />
                </div>
            </div>
        </div>

        {/* Delete confirmation modal */}
        {deleteConfirm && (
            <div
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={() => setDeleteConfirm(null)}
            >
                <div
                    className="relative w-full max-w-[480px] overflow-hidden rounded-2xl bg-primary shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative flex flex-col gap-4 px-6 pt-6">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition hover:bg-primary_hover hover:text-secondary"
                        >
                            <XClose className="size-5" />
                        </button>

                        {/* Featured icon */}
                        <div className="flex size-12 items-center justify-center rounded-full bg-error-100">
                            <Trash01 className="size-6 text-error-600" />
                        </div>

                        {/* Text */}
                        <div className="flex flex-col gap-1">
                            <p className="text-lg font-semibold text-primary">Deleting file</p>
                            <p className="text-sm text-tertiary">Are you sure you want to delete <span className="font-medium text-secondary">{deleteConfirm.filename}</span>?</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-3 border-t border-secondary px-6 py-6">
                        <button
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            className="flex flex-1 items-center justify-center rounded-lg border border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-secondary shadow-xs transition hover:bg-primary_hover"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => { deleteConfirm.onConfirm(); setDeleteConfirm(null); }}
                            className="flex flex-1 items-center justify-center rounded-lg bg-[#d92d20] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#b42318]"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )}
        </CopyToastCtx.Provider>
    );
};

// ─── Placeholder ──────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
    "/uw-portal/approved": "Approved",
    "/uw-portal/reports": "Reports",
    "/uw-portal/settings": "Settings",
    "/uw-portal/support": "Support",
};

const PlaceholderPage = ({ path }: { path: string }) => (
    <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
            <p className="font-display text-display-xs font-semibold text-primary">{PAGE_LABELS[path] ?? "Page"}</p>
            <p className="mt-1 text-sm text-tertiary">This section is coming soon.</p>
        </div>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const UWPortal = () => {
    const { pathname } = useLocation();
    const [leadsData, setLeadsData] = useState<Record<LeadStage, Lead[]>>(initialLeadsData);
    const stageLeads = columnConfig.flatMap((col) =>
        leadsData[col.id].map((lead) => ({ ...lead, stage: col.id as LeadStage })),
    );

    const handleDecision = (leadId: string, decision: "approved" | "declined") => {
        setLeadsData((prev) => {
            // Find which stage the lead is currently in
            const currentStage = (Object.keys(prev) as LeadStage[]).find((s) =>
                prev[s].some((l) => l.id === leadId),
            );
            if (!currentStage) return prev;
            const lead = prev[currentStage].find((l) => l.id === leadId)!;
            const updatedLead = { ...lead, decision };
            const newData = { ...prev };
            // Remove from current stage
            newData[currentStage] = prev[currentStage].filter((l) => l.id !== leadId);
            // Add to "done" (Decision Made), avoiding duplicates
            const alreadyInDone = prev.done.some((l) => l.id === leadId);
            newData.done = alreadyInDone
                ? prev.done.map((l) => (l.id === leadId ? updatedLead : l))
                : [...prev.done, updatedLead];
            return newData;
        });
    };

    const leadIdMatch = pathname.match(/^\/uw-portal\/lead\/(.+)$/);
    const selectedLeadId = leadIdMatch?.[1] ?? null;
    const selectedLead = selectedLeadId ? stageLeads.find((l) => l.id === selectedLeadId) ?? null : null;
    const isAppsPage = !selectedLeadId && (pathname === "/uw-portal" || pathname === "/uw-portal/" || pathname === "/uw-portal/borrowers");
    const searchRef = useRef<HTMLInputElement>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [view, setView] = useState<"board" | "table">("table");

    const handleRefresh = () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 700);
    };

    const kanbanDrag = useDragScroll();
    const tableDrag = useDragScroll();

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange]       = useState<DateRange | null>(() => makeRange(7));
    const [dateRangeLabel, setDateRangeLabel] = useState("7 days");
    const [amountRange, setAmountRange]   = useState<AmountRange | null>(null);
    const [sort, setSort]                 = useState(FILTER_DEFAULTS.sort);
    const [purpose, setPurpose]           = useState<string[]>([]);
    const [assignees, setAssignees]       = useState<string[]>([]);

    const activeCount = [
        dateRangeLabel !== "7 days",
        amountRange !== null,
        sort !== FILTER_DEFAULTS.sort,
        purpose.length > 0,
        assignees.length > 0,
    ].filter(Boolean).length;

    const onReset = () => {
        setDateRange(makeRange(7));
        setDateRangeLabel("7 days");
        setAmountRange(null);
        setSort(FILTER_DEFAULTS.sort);
        setPurpose([]);
        setAssignees([]);
    };

    const applyFilters = (leads: Lead[]): Lead[] => {
        let result = [...leads];
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(
                (l) => l.company.toLowerCase().includes(q) || l.companyNumber.includes(q),
            );
        }
        if (dateRange) {
            const now = Date.now();
            result = result.filter((l) => {
                const leadTime = now - parseTimeAgoMinutes(l.timeAgo) * 60000;
                return leadTime >= dateRange.start.getTime() && leadTime <= dateRange.end.getTime();
            });
        }
        if (amountRange) {
            if (amountRange.min !== null) result = result.filter((l) => l.loanAmount >= amountRange.min!);
            if (amountRange.max !== null) result = result.filter((l) => l.loanAmount <= amountRange.max!);
        }
        if (purpose.length > 0) {
            result = result.filter((l) => purpose.includes(l.purpose));
        }
        if (assignees.length > 0) {
            result = result.filter((l) => assignees.includes(l.assignee.name));
        }
        if (sort === "Oldest First") result.reverse();
        if (sort === "Amount: High → Low") result.sort((a, b) => b.loanAmount - a.loanAmount);
        if (sort === "Amount: Low → High") result.sort((a, b) => a.loanAmount - b.loanAmount);
        return result;
    };

    const filteredLeads = Object.fromEntries(
        columnConfig.map((col) => [col.id, applyFilters(leadsData[col.id] ?? [])]),
    ) as Record<LeadStage, Lead[]>;

    const totalLeads = Object.values(filteredLeads).flat().length;
    const pipeline   = totalPipeline(Object.values(filteredLeads).flat());

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isEditable = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
            if (e.key === "/" && !isEditable && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                e.stopImmediatePropagation();
                // Blur current element first so React Aria releases focus,
                // then focus the search input after the browser's task queue clears.
                (document.activeElement as HTMLElement | null)?.blur();
                setTimeout(() => searchRef.current?.focus(), 0);
            }
        };
        document.addEventListener("keydown", onKeyDown, { capture: true });
        return () => document.removeEventListener("keydown", onKeyDown, { capture: true });
    }, []);

    return (
        <>
        {/* Sidebar — always visible so it appears on the small-screen fallback too */}
        <UWPortalSidebar
            activeUrl={pathname}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
        />

        {/* Small screen fallback */}
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-secondary pl-[68px] pr-8 text-center md:hidden">
            <img src="/lovey-logo-purple.svg" alt="Lovey" className="size-10" />
            <p className="text-lg font-semibold text-primary">Please use a bigger screen</p>
            <p className="text-sm text-tertiary">The Lovey underwriting portal is designed for desktop use only.</p>
        </div>

        <div className="hidden h-screen overflow-hidden bg-secondary md:flex md:pl-[68px]">

            {selectedLead ? (
                <div className="flex flex-1 flex-col overflow-hidden">
                    <LeadDetailView lead={selectedLead} onDecision={(d) => handleDecision(selectedLead.id, d)} />
                </div>
            ) : isAppsPage ? (
            <div
                {...(view === "table" ? tableDrag.dragProps : {})}
                ref={view === "table" ? tableDrag.ref : undefined}
                className={cx(
                    "flex flex-1 flex-col transition-opacity duration-300",
                    view === "table" ? "scrollbar-hide overflow-x-auto overflow-y-auto" : "overflow-hidden",
                    isRefreshing && "opacity-40 pointer-events-none",
                )}
            >
                {view === "table" ? (
                    <div className="flex min-w-[1200px] flex-col">
                        <div className="shrink-0 px-5 pt-5 pb-4">
                            <ApplicationHeader
                                totalLeads={totalLeads} pipeline={pipeline}
                                searchRef={searchRef} searchQuery={searchQuery} onSearchChange={setSearchQuery}
                                filters={{ dateRange, setDateRange, dateRangeLabel, setDateRangeLabel, amountRange, setAmountRange, sort, setSort, purpose, setPurpose, assignees, setAssignees, activeCount, onReset }}
                                view={view} onViewChange={setView}
                            />
                        </div>
                        <TableView leads={columnConfig.flatMap((col) => filteredLeads[col.id].map((lead) => ({ ...lead, stage: col.id as LeadStage })))} isRefreshing={isRefreshing} />
                    </div>
                ) : (
                    <>
                        <div className="shrink-0 px-5 pt-5 pb-4">
                            <ApplicationHeader
                                totalLeads={totalLeads} pipeline={pipeline}
                                searchRef={searchRef} searchQuery={searchQuery} onSearchChange={setSearchQuery}
                                filters={{ dateRange, setDateRange, dateRangeLabel, setDateRangeLabel, amountRange, setAmountRange, sort, setSort, purpose, setPurpose, assignees, setAssignees, activeCount, onReset }}
                                view={view} onViewChange={setView}
                            />
                        </div>
                        <div ref={kanbanDrag.ref} {...kanbanDrag.dragProps} className="scrollbar-hide flex-1 overflow-x-auto overflow-y-hidden">
                            <div className="flex h-full gap-4 pl-5 pt-2">
                                {columnConfig.map((col) => (
                                    <KanbanColumn key={col.id} {...col} leads={filteredLeads[col.id]} isRefreshing={isRefreshing} />
                                ))}
                                <div className="w-4 shrink-0" />
                            </div>
                        </div>
                    </>
                )}
            </div>
            ) : (
                <div className={cx("transition-opacity duration-300", isRefreshing && "opacity-40 pointer-events-none")}>
                    <PlaceholderPage path={pathname} />
                </div>
            )}
        </div>
        </>
    );
};
