import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router";
import {
    AlertTriangle,
    AlignTopArrow02,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Flag01,
    BankNote01,
    CheckDone01,
    ChevronDown,
    Clipboard,
    FaceIdSquare,
    File02,
    FileHeart01,
    FilePlus01,
    Folder,
    Home05,
    Mail01,
    Share05,
    PieChart02,
    RefreshCcw01,
    RefreshCcw03,
    Rows03,
    Target04,
    Trophy01,
    Check,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ChevronSelectorVertical,
    ChevronUp,
    Download01,
    Edit01,
    Edit05,
    ClockRewind,
    LifeBuoy01,
    Mail05,
    MessageSquare01,
    PhoneCall01,
    Printer,
    SearchLg,
    Settings01,
    Table,
    Trash01,
    TrendUp01,
    UploadCloud02,
    Users01,
    UsersX,
    XClose,
    User01,
    UserEdit,
    XCircle,
    LogOut01,
    InfoCircle,
    EyeOff,
    Eye,
    MarkerPin02,
    Stars01,
} from "@untitledui/icons";
import { CalendarDate } from "@internationalized/date";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { DateField } from "@/components/application/date-picker/date-field";
import { Input } from "@/components/base/input/input";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import { Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTip, Line, ComposedChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { NotFound } from "@/pages/not-found";
import { NoAccess } from "@/pages/no-access";
import { FeatureRequest } from "@/pages/feature-request";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateRange { start: Date; end: Date }
interface AmountRange { min: number | null; max: number | null }

type LeadStage = "new_application" | "awaiting_accounts" | "auto_uw_error" | "ready_to_review" | "awaiting_customer" | "accepted" | "declined";

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

interface SidebarNavItemConfig {
    label: string;
    href: string;
    icon: React.FC<{ className?: string }>;
    disabled?: boolean;
    badge?: number;
}

interface SidebarNavSection {
    heading?: string;
    items: SidebarNavItemConfig[];
}

const navSections: SidebarNavSection[] = [
    {
        items: [
            { label: "Home",  href: "/portal", icon: Home05 },
            { label: "Forms", href: "#", icon: File02, disabled: true },
        ],
    },
    {
        heading: "Underwriters",
        items: [
            { label: "Applications", href: "/portal/applications", icon: Rows03                   },
            { label: "Reports",      href: "/portal/reports", icon: Clipboard, disabled: true   },
            { label: "Data browser", href: "#",               icon: PieChart02, disabled: true  },
        ],
    },
    {
        heading: "Account Managers",
        items: [
            { label: "Leads", href: "/portal/leads", icon: FilePlus01, badge: 2 },
            { label: "Tasks", href: "/portal/tasks", icon: CheckDone01 },
            { label: "Deals", href: "#", icon: FileHeart01, disabled: true },
        ],
    },
    {
        heading: "Atlas",
        items: [
            { label: "Brokers",        href: "#", icon: Users01,      disabled: true },
            { label: "Underwriters",   href: "#", icon: FaceIdSquare, disabled: true },
            { label: "Archived users", href: "#", icon: UsersX,       disabled: true },
        ],
    },
];

const PestControlIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" className={className}>
        <path d="M365.5-153Q315-186 283-240l-61 35q-14 8-30 3t-24-19q-8-14-4-30t18-24l69-40q-3-11-5-22.5t-4-22.5h-82q-17 0-28.5-11.5T120-400q0-17 11.5-28.5T160-440h82q2-12 4-23.5t5-22.5l-69-40q-14-8-18-24t4-30q8-14 24.5-18.5T223-595l59 35q8-14 18.5-27.5T322-612q-2-7-2-14v-14q0-24 7-46t19-41l-38-38q-11-11-11.5-28t11.5-29q11-12 27.5-11.5T364-822l42 40q17-9 35.5-13.5T480-800q20 0 39 5t36 14l41-41q12-12 28-11.5t28 12.5q11 12 11.5 28T652-765l-38 38q12 19 18.5 41t6.5 46v13.5q0 6.5-2 13.5 11 11 21.5 25t18.5 28l61-35q14-8 30-3.5t24 18.5q8 14 3.5 30.5T777-525l-69 39q3 11 5.5 22.5T718-440h82q17 0 28.5 11.5T840-400q0 17-11.5 28.5T800-360h-82q-2 12-4 23.5t-5 22.5l69 40q14 8 18 24.5t-4 30.5q-8 14-24 18t-30-4l-61-35q-32 54-82.5 87T480-120q-64 0-114.5-33ZM404-666q17-7 36.5-10.5T480-680q20 0 38.5 3t35.5 10q-8-23-28-38t-46-15q-26 0-47 15.5T404-666Zm76 466q73 0 116.5-61T640-400q0-70-40.5-135T480-600q-78 0-119 64.5T320-400q0 78 43.5 139T480-200Zm-28.5-91.5Q440-303 440-320v-160q0-17 11.5-28.5T480-520q17 0 28.5 11.5T520-480v160q0 17-11.5 28.5T480-280q-17 0-28.5-11.5Z"/>
    </svg>
);

const footerNavItems: SidebarNavItemConfig[] = [
    { label: "Help",     href: "/portal/support",  icon: LifeBuoy01, disabled: true },
    { label: "Report a bug", href: "/portal/bug",      icon: PestControlIcon },
    { label: "Settings", href: "/portal/settings", icon: Settings01, disabled: true },
    { label: "Log out",  href: "#",                icon: LogOut01   },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SIDEBAR_COLLAPSED = 68;
const SIDEBAR_EXPANDED  = 296;

const SidebarItem = ({
    item,
    activeUrl,
    expanded,
    isLogout = false,
}: {
    item: SidebarNavItemConfig;
    activeUrl: string;
    expanded: boolean;
    isLogout?: boolean;
}) => {
    const Icon = item.icon;
    const isActive =
        !item.disabled &&
        item.href !== "#" &&
        (activeUrl === item.href || (item.href !== "/portal" && activeUrl.startsWith(item.href + "/")));

    if (expanded) {
        return (
            <li className="flex w-full">
                <Link
                    to={item.disabled ? "#" : item.href}
                    onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                    className={cx(
                        "flex w-full items-center gap-0.5 rounded-[6px] transition-colors duration-100",
                        item.disabled
                            ? "pointer-events-none opacity-30"
                            : isLogout
                                ? "text-fg-quaternary hover:bg-error-primary hover:text-fg-error-primary"
                                : "text-fg-quaternary hover:bg-active",
                        isActive && "bg-active text-fg-secondary",
                    )}
                >
                    <div className="relative flex size-10 shrink-0 items-center justify-center rounded-[6px]">
                        <Icon className="size-5" />
                        {item.badge !== undefined && (
                            <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-solid text-[10px] font-semibold leading-none text-white">
                                {item.badge}
                            </span>
                        )}
                    </div>
                    <span className="animate-in fade-in duration-150 truncate text-sm font-semibold">{item.label}</span>
                </Link>
            </li>
        );
    }

    return (
        <li className="flex">
            <Link
                to={item.disabled ? "#" : item.href}
                aria-label={item.label}
                title={item.label}
                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                className={cx(
                    "relative flex size-10 items-center justify-center rounded-[6px] transition-colors duration-100",
                    item.disabled
                        ? "pointer-events-none opacity-30"
                        : isLogout
                            ? "text-fg-quaternary hover:bg-error-primary hover:text-fg-error-primary"
                            : "text-fg-quaternary hover:bg-active",
                    isActive && "bg-active text-fg-secondary",
                )}
            >
                <Icon className="size-5" />
                {item.badge !== undefined && (
                    <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-solid text-[10px] font-semibold leading-none text-white">
                        {item.badge}
                    </span>
                )}
            </Link>
        </li>
    );
};

const LoveyPortalSidebar = ({
    activeUrl,
    onRefresh,
    isRefreshing,
}: {
    activeUrl: string;
    onRefresh: () => void;
    isRefreshing: boolean;
}) => {
    const [expanded, setExpanded] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = useCallback(() => {
        hoverTimer.current = setTimeout(() => setExpanded(true), 600);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimer.current) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }
        setExpanded(false);
    }, []);

    useEffect(() => () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
    }, []);

    return (
        <>
            <div
                className="fixed bottom-2 left-2 top-2 z-50 overflow-hidden"
                style={{ width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED, transition: "width 200ms ease-in-out" }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className={cx(
                    "flex h-full flex-col justify-between overflow-hidden rounded-xl border border-secondary bg-primary transition-shadow duration-200",
                    expanded ? "shadow-xl" : "shadow-xs",
                )}>

                    {/* ── Top: logo + nav ── */}
                    <div className="flex min-h-0 flex-col gap-6 pt-5">

                        {/* Logo */}
                        <div className="flex shrink-0 items-center pl-4">
                            <button
                                type="button"
                                onClick={onRefresh}
                                className="flex cursor-pointer items-center gap-2 focus:outline-none"
                            >
                                <img
                                    src="/lovey-icon.svg"
                                    alt="Lovey"
                                    className={cx("size-8 shrink-0", isRefreshing && "spin-once")}
                                />
                                {expanded && (
                                    <span className="animate-in fade-in duration-150 whitespace-nowrap text-lg font-semibold text-fg-brand-primary">
                                        Lovey
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Nav sections */}
                        <nav className={cx("flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-2", expanded ? "px-3" : "px-3")}>
                            {navSections.map((section, si) => (
                                <div key={si}>
                                    {section.heading ? (
                                        expanded ? (
                                            <div className="flex h-7 items-center px-2.5">
                                                <span className="animate-in fade-in duration-150 text-xs font-bold uppercase tracking-wide text-fg-quaternary">
                                                    {section.heading}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex h-7 items-center">
                                                <div className="mx-auto w-6 border-t border-secondary" />
                                            </div>
                                        )
                                    ) : si > 0 ? (
                                        <div className="my-1" />
                                    ) : null}
                                    <ul className="flex flex-col gap-0.5">
                                        {section.items.map((item) => (
                                            <SidebarItem
                                                key={item.label}
                                                item={item}
                                                activeUrl={activeUrl}
                                                expanded={expanded}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* ── Bottom: footer nav + avatar ── */}
                    <div className="flex flex-col gap-4 pb-5 px-3">
                        <ul className="flex flex-col gap-0.5 w-full">
                            {footerNavItems.map((item) => (
                                <SidebarItem
                                    key={item.label}
                                    item={item}
                                    activeUrl={activeUrl}
                                    expanded={expanded}
                                    isLogout={item.label === "Log out"}
                                />
                            ))}
                        </ul>

                        {expanded ? (
                            <div className="flex items-center gap-2 ml-1">
                                <img
                                    src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"
                                    alt="Alex Buck"
                                    className="size-10 shrink-0 rounded-full object-cover"
                                />
                                <div className="animate-in fade-in duration-150 flex flex-col overflow-hidden">
                                    <span className="truncate text-sm font-semibold text-fg-primary">Alex Buck</span>
                                    <span className="truncate text-xs text-fg-tertiary">alex.buck@lovey.com</span>
                                </div>
                            </div>
                        ) : (
                            <img
                                src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"
                                alt="Alex Buck"
                                className="size-10 shrink-0 rounded-full object-cover ml-1"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed-width spacer — main content uses hardcoded pl-[68px] so this is just defensive */}
            <div className="shrink-0" style={{ width: SIDEBAR_COLLAPSED + 8 }} />
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
    new_application: [
        { id: "1", company: "Stack3d Lab", companyNumber: "14823901", email: "hello@stack3dlab.com", address: "12 Shoreditch High St, London E1 6JE", incorporated: "14 Mar 2021", applicantName: "Alex Morgan", telephone: "+44 20 7946 0012", loanAmount: 120000, termMonths: 36, purpose: "Equipment or Assets", timeAgo: "2h", assignee: { name: "Jake Torres", initials: "JT" } },
        { id: "2", company: "Warpspeed", companyNumber: "13047562", email: "finance@warpspeed.io", address: "7 Kings Road, Bristol BS1 4EJ", incorporated: "02 Sep 2019", applicantName: "Jamie Lee", telephone: "+44 117 906 0032", loanAmount: 5000, termMonths: 12, purpose: "Payroll", timeAgo: "5h", assignee: { name: "Sarah Chen", initials: "SC" }, flagged: true },
        { id: "3", company: "NovaMed Clinic", companyNumber: "09381274", email: "ops@novamed.co.uk", address: "88 Harley Street, London W1G 7HJ", incorporated: "22 Jun 2016", applicantName: "Dr. Priya Shah", telephone: "+44 20 7946 0088", loanAmount: 350000, termMonths: 48, purpose: "New Products", timeAgo: "1h", assignee: { name: "Marcus Webb", initials: "MW" } },
        { id: "13", company: "Riviera Studios", companyNumber: "16204758", email: "hello@rivierastudios.co.uk", address: "Studio 12, 80 Bermondsey St, London SE1 3UD", incorporated: "07 May 2023", applicantName: "Chloe Dupont", telephone: "+44 20 7946 0130", loanAmount: 55000, termMonths: 18, purpose: "Working Capital", timeAgo: "14d", assignee: { name: "Lisa Park", initials: "LP" } },
        { id: "14", company: "ForgePoint Capital", companyNumber: "10837264", email: "ops@forgepointcap.com", address: "Level 3, 100 Cheapside, London EC2V 6DT", incorporated: "19 Feb 2018", applicantName: "Daniel Osei", telephone: "+44 20 7946 0141", loanAmount: 480000, termMonths: 60, purpose: "Invoice Finance", timeAgo: "45d", assignee: { name: "Jake Torres", initials: "JT" }, flagged: true },
    ],
    awaiting_accounts: [
        { id: "4", company: "Warpspeed", companyNumber: "13047562", email: "finance@warpspeed.io", address: "7 Kings Road, Bristol BS1 4EJ", incorporated: "02 Sep 2019", applicantName: "Jamie Lee", telephone: "+44 117 906 0032", loanAmount: 80000, termMonths: 12, purpose: "Invoice Finance", timeAgo: "5h", assignee: { name: "Sarah Chen", initials: "SC" } },
        { id: "5", company: "Brick & Mortar Co.", companyNumber: "07265183", email: "accounts@brickmortar.com", address: "45 Union Street, Manchester M1 3GH", incorporated: "11 Jan 2015", applicantName: "Tom Briggs", telephone: "+44 161 496 0045", loanAmount: 45000, termMonths: 24, purpose: "Working Capital", timeAgo: "3h", assignee: { name: "Lisa Park", initials: "LP" } },
    ],
    auto_uw_error: [
        { id: "15", company: "Quantum Forge", companyNumber: "12947503", email: "bd@quantumforge.io", address: "Forge House, 99 Innovation Blvd, Leeds LS2 7EY", incorporated: "03 Dec 2020", applicantName: "Ryan Foster", telephone: "+44 113 320 0012", loanAmount: 95000, termMonths: 24, purpose: "New Products", timeAgo: "22d", assignee: { name: "Marcus Webb", initials: "MW" } },
    ],
    ready_to_review: [
        { id: "6", company: "ContrastAI", companyNumber: "15109347", email: "cfo@contrastai.com", address: "Suite 4, 22 Cambridge Science Park, Cambridge CB4 0FX", incorporated: "30 Nov 2022", applicantName: "Nina Patel", telephone: "+44 1223 490 006", loanAmount: 200000, termMonths: 24, purpose: "Invoice Finance", timeAgo: "12min", assignee: { name: "Jake Torres", initials: "JT" } },
        { id: "7", company: "Stack3d Lab", companyNumber: "14823901", email: "hello@stack3dlab.com", address: "12 Shoreditch High St, London E1 6JE", incorporated: "14 Mar 2021", applicantName: "Alex Morgan", telephone: "+44 20 7946 0012", loanAmount: 120000, termMonths: 36, purpose: "Equipment or Assets", timeAgo: "4h", assignee: { name: "Marcus Webb", initials: "MW" } },
    ],
    awaiting_customer: [
        { id: "8", company: "SkyTech Innovations", companyNumber: "11748302", email: "finance@skytech.co.uk", address: "Unit 9 Innova Park, Enfield EN3 7NJ", incorporated: "05 Apr 2018", applicantName: "Chris Walton", telephone: "+44 20 8090 0009", loanAmount: 65000, termMonths: 6, purpose: "New Products", timeAgo: "30min", assignee: { name: "Sarah Chen", initials: "SC" } },
        { id: "9", company: "GreenWave Solutions", companyNumber: "10293847", email: "hello@greenwave.io", address: "Clarence House, 2 Clarence St, Glasgow G3 8AX", incorporated: "19 Jul 2017", applicantName: "Fiona Grant", telephone: "+44 141 229 0019", loanAmount: 95000, termMonths: 18, purpose: "Other", timeAgo: "2h", assignee: { name: "Lisa Park", initials: "LP" } },
    ],
    accepted: [
        { id: "10", company: "Apex Security Ltd", companyNumber: "08374651", email: "biz@apexsecurity.co.uk", address: "Apex House, 1 Security Way, Reading RG1 3AP", incorporated: "08 Aug 2013", applicantName: "Mark Dawson", telephone: "+44 118 909 0010", loanAmount: 180000, termMonths: 60, purpose: "Equipment or Assets", timeAgo: "2d", assignee: { name: "Jake Torres", initials: "JT" } },
        { id: "11", company: "Blue Fin Restaurant", companyNumber: "06582930", email: "owner@bluefin.co.uk", address: "31 Harbour Walk, Brighton BN1 1NE", incorporated: "27 Feb 2010", applicantName: "Sophie Turner", telephone: "+44 1273 490 011", loanAmount: 75000, termMonths: 12, purpose: "Working Capital", timeAgo: "1d", assignee: { name: "Sarah Chen", initials: "SC" } },
    ],
    declined: [
        { id: "12", company: "Quantum Forge", companyNumber: "12947503", email: "finance@quantumforge.io", address: "Forge House, 99 Innovation Blvd, Leeds LS2 7EY", incorporated: "03 Dec 2020", applicantName: "Ryan Foster", telephone: "+44 113 320 0012", loanAmount: 420000, termMonths: 48, purpose: "New Products", timeAgo: "3d", assignee: { name: "Marcus Webb", initials: "MW" } },
    ],
};

// ─── Column config ─────────────────────────────────────────────────────────────

const columnConfig: Array<{ id: LeadStage; label: string }> = [
    { id: "new_application",   label: "New Application" },
    { id: "awaiting_accounts", label: "Awaiting Accounts" },
    { id: "auto_uw_error",     label: "Auto-underwriting Error" },
    { id: "ready_to_review",   label: "Ready to Review" },
    { id: "awaiting_customer", label: "Awaiting Customer" },
    { id: "accepted",          label: "Accepted" },
    { id: "declined",          label: "Declined" },
];

// ─── Stage config ──────────────────────────────────────────────────────────────

const STAGE_DOT: Record<LeadStage, string> = {
    new_application:   "bg-fg-quaternary",
    awaiting_accounts: "bg-blue-500",
    auto_uw_error:     "bg-rose-500",
    ready_to_review:   "bg-violet-500",
    awaiting_customer: "bg-amber-400",
    accepted:          "bg-green-500",
    declined:          "bg-red-500",
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
    <div onClick={() => navigate(`/portal/lead/${lead.id}`)} className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-4 transition-colors hover:bg-secondary_subtle">
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
    const isActive = value !== null;

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => { setDraft(value); setAnchor(null); setOpen(o => !o); }}
                className={cx(
                    "relative inline-flex cursor-pointer items-center rounded-lg border py-2.5 pl-3.5 pr-8 text-sm font-semibold transition duration-100 focus:outline-none",
                    open
                        ? "border-primary bg-active text-secondary"
                        : isActive
                        ? "border-brand-600 bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover"
                        : "border-primary bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover",
                )}
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

    const isActive = value !== null;

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    setMinVal(value?.min ? String(value.min) : "");
                    setMaxVal(value?.max ? String(value.max) : "");
                    setOpen(o => !o);
                }}
                className={cx(
                    "relative inline-flex cursor-pointer items-center rounded-lg border py-2.5 pl-3.5 pr-8 text-sm font-semibold transition duration-100 focus:outline-none",
                    open
                        ? "border-primary bg-active text-secondary"
                        : isActive
                        ? "border-brand-600 bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover"
                        : "border-primary bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover",
                )}
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
                                className="h-11 w-full rounded-lg bg-primary pl-8 pr-3.5 text-md text-primary shadow-xs border border-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand" />
                        </div>
                        <span className="shrink-0 text-fg-quaternary">–</span>
                        <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-md text-secondary">£</span>
                            <input type="number" value={maxVal} onChange={e => setMaxVal(e.target.value)} placeholder="To"
                                className="h-11 w-full rounded-lg bg-primary pl-8 pr-3.5 text-md text-primary shadow-xs border border-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand" />
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

    const isActive = value.length > 0;

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={cx(
                    "relative inline-flex cursor-pointer items-center rounded-lg border py-2.5 pl-3.5 pr-8 text-sm font-semibold transition duration-100 focus:outline-none",
                    open
                        ? "border-primary bg-active text-secondary"
                        : isActive
                        ? "border-brand-600 bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover"
                        : "border-primary bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover",
                )}
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
    const isActive = value.length > 0;

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={cx(
                    "relative inline-flex cursor-pointer items-center rounded-lg border py-2.5 pl-3.5 pr-8 text-sm font-semibold transition duration-100 focus:outline-none",
                    open
                        ? "border-primary bg-active text-secondary"
                        : isActive
                        ? "border-brand-600 bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover"
                        : "border-primary bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover",
                )}
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
    hideEmpty,
    onToggleHideEmpty,
}: {
    totalLeads: number;
    pipeline: number;
    searchRef: React.RefObject<HTMLInputElement | null>;
    searchQuery: string;
    onSearchChange: (v: string) => void;
    filters: HeaderFilters;
    view: "board" | "table";
    onViewChange: (v: "board" | "table") => void;
    hideEmpty?: boolean;
    onToggleHideEmpty?: () => void;
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

                <div className="flex items-center gap-3">
                    {/* Hide empty columns toggle — board view only */}
                    {view === "board" && onToggleHideEmpty && (
                        <button
                            type="button"
                            onClick={onToggleHideEmpty}
                            className="flex items-center gap-1.5 text-sm font-medium text-secondary transition-colors hover:text-primary"
                        >
                            {hideEmpty ? "Show empty columns" : "Hide empty columns"}
                            {hideEmpty ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                        </button>
                    )}
                    <div className={cx("relative", filters.activeCount === 0 && "invisible pointer-events-none")}>
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
                </div>
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
    const stageOrder: Record<LeadStage, number> = { new_application: 0, awaiting_accounts: 1, auto_uw_error: 2, ready_to_review: 3, awaiting_customer: 4, accepted: 5, declined: 6 };
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
                                <tr key={lead.id} onClick={() => navigate(`/portal/lead/${lead.id}`)} className="group cursor-pointer">
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

type ActivityLogCategory = "all" | "notes" | "calls" | "emails" | "automated" | "playbook";

interface ActivityLogEntry {
    id: string;
    type: "event" | "comment";
    category: Exclude<ActivityLogCategory, "all">;
    text: string;
    author: string;
    source?: string;
    date: string;
    time: string;
}

const ACTIVITY_LOG_FILTER_OPTIONS: ({ value: ActivityLogCategory; label: string } | "divider")[] = [
    { value: "all",       label: "All Activity" },
    "divider",
    { value: "notes",     label: "Notes" },
    { value: "calls",     label: "Calls" },
    { value: "emails",    label: "Emails" },
    { value: "automated", label: "Automated Updates" },
    { value: "playbook",  label: "Playbook" },
];
const ACTIVITY_LOG_FILTER_LABELS: Record<ActivityLogCategory, string> = {
    all:       "All Activity",
    notes:     "Notes",
    calls:     "Calls",
    emails:    "Emails",
    automated: "Automated Updates",
    playbook:  "Playbook",
};

const MOCK_ACTIVITY: ActivityLogEntry[] = [
    { id: "a1", type: "event",   category: "automated", text: "Application submitted",       author: "System",      source: "Website form", date: "20 March", time: "11:23" },
    { id: "a2", type: "event",   category: "automated", text: "Assigned to Jake Torres",     author: "Sarah Chen",                          date: "20 March", time: "11:59" },
    { id: "a3", type: "comment", category: "notes",     text: "Requested latest bank statements. Applicant confirmed they will send over by end of day.", author: "Jake Torres", date: "20 March", time: "12:03" },
    { id: "a4", type: "event",   category: "automated", text: "Moved to New",                author: "Jake Torres",                         date: "21 March", time: "09:14" },
    { id: "a5", type: "comment", category: "notes",     text: "Initial eligibility check passed. Awaiting supporting docs before progressing.", author: "Jake Torres", date: "21 March", time: "09:22" },
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

const ActivityLog = ({ entries: initialEntries }: { entries: ActivityLogEntry[] }) => {
    const [entries, setEntries] = useState(initialEntries);
    const [note, setNote] = useState("");
    const [filter, setFilter] = useState<ActivityLogCategory>("all");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const timelineRef = useRef<HTMLDivElement>(null);

    const filteredEntries = filter === "all" ? entries : entries.filter(e => e.category === filter);

    const handleAddNote = () => {
        if (!note.trim()) return;
        const now = new Date();
        const newEntry: ActivityLogEntry = {
            id: `note-${Date.now()}`,
            type: "comment",
            category: "notes",
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
        <div className="flex h-full w-full flex-col rounded-xl border border-secondary bg-secondary_subtle shadow-xs">
            {/* Dropdown heading */}
            <div className="relative shrink-0">
                <button
                    type="button"
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex h-11 w-full items-center justify-between pb-2 pl-5 pr-3 pt-3"
                >
                    <span className="text-sm font-semibold text-primary">{ACTIVITY_LOG_FILTER_LABELS[filter]}</span>
                    <ChevronDown className={cx("size-5 text-fg-quaternary transition-transform duration-150", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                        <div className="absolute top-full left-3 z-20 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-secondary bg-primary shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="py-1">
                                {ACTIVITY_LOG_FILTER_OPTIONS.map((opt, i) =>
                                    opt === "divider" ? (
                                        <div key={i} className="my-1 border-t border-secondary" />
                                    ) : (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => { setFilter(opt.value); setDropdownOpen(false); }}
                                            className={cx(
                                                "mx-1.5 flex w-[calc(100%-12px)] items-center rounded-md px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                                                filter === opt.value ? "bg-secondary_subtle text-primary" : "text-secondary hover:bg-secondary_subtle",
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Inner card */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-secondary bg-primary p-2 gap-0 min-h-0">
                {/* AI Summary */}
                <div className="mb-2 flex items-start gap-3 rounded-lg bg-[#e7e1f4] px-2 py-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#bdafda] bg-[#e7e1f4]">
                        <Stars01 className="size-3 text-[#594483]" />
                    </div>
                    <p className="pt-0.5 text-sm leading-5 text-[#362951]">
                        Applicant is engaged and responsive. Bank statements requested on 20 March are still outstanding. Initial eligibility passed — recommended next step is to chase documents and progress to underwriting review.
                    </p>
                </div>

                {/* Timeline */}
                <div ref={timelineRef} className="scrollbar-hide flex-1 overflow-y-auto px-2 py-2">
                    {filteredEntries.map((entry, i) => {
                        const isLast = i === filteredEntries.length - 1;
                        return (
                            <div key={entry.id} className="flex items-start gap-3">
                                <div className="flex shrink-0 flex-col items-center gap-1 self-stretch pb-1">
                                    <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-secondary bg-secondary_subtle">
                                        {entry.type === "comment"
                                            ? <MessageSquare01 className="size-3 text-fg-quaternary" />
                                            : <span className="size-2 rounded-full bg-fg-quaternary" />
                                        }
                                    </div>
                                    {!isLast && <div className="w-0.5 flex-1 rounded-sm bg-secondary" />}
                                </div>
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
                        className="w-full resize-none rounded-lg border border-primary bg-primary px-3.5 py-3 text-sm text-primary shadow-xs placeholder:text-quaternary focus:ring-2 focus:ring-inset focus:ring-brand focus:outline-none"
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
            </div>
        </div>
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

const StatusPicker = ({ value, onChange }: { value: LeadStage; onChange: (v: LeadStage) => void }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = columnConfig.find((c) => c.id === value);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm text-tertiary">Status</span>
            <div ref={ref} className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-semibold text-secondary shadow-xs transition hover:bg-primary_hover"
                >
                    <span>{current?.label ?? value}</span>
                    <ChevronDown className="size-4 text-fg-quaternary" />
                </button>
                {open && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-primary bg-primary shadow-lg">
                        {columnConfig.map((col) => (
                            <button
                                key={col.id}
                                type="button"
                                onClick={() => { onChange(col.id); setOpen(false); }}
                                className={cx(
                                    "flex w-full items-center px-3 py-2 text-sm transition hover:bg-primary_hover",
                                    col.id === value ? "font-semibold text-primary" : "text-secondary",
                                )}
                            >
                                {col.label}
                            </button>
                        ))}
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
const InfoCard = ({ title, badge, children, raw }: { title: string; badge?: React.ReactNode; children: React.ReactNode; raw?: boolean }) => (
    <div className="flex w-full flex-col rounded-xl border border-secondary bg-secondary_subtle shadow-xs">
        <div className="flex h-11 shrink-0 items-center gap-4 pl-5 pr-3">
            <span className="flex-1 text-sm font-semibold text-primary">{title}</span>
            {badge}
        </div>
        {raw ? children : (
            <div className="flex flex-wrap gap-3 rounded-xl border border-secondary bg-primary px-6 py-5">
                {children}
            </div>
        )}
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
                <a href={href} target="_blank" rel="noopener noreferrer" className={btnClass}>
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

    const inputClass = "w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs placeholder:text-quaternary focus:ring-2 focus:ring-inset focus:ring-brand focus:outline-none";
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


// ─── WiserFundingChart ────────────────────────────────────────────────────────

// Each axis has its own domain — Z-Score 0–600, PoD 0–40% (inverted), LGD 0–100% (inverted)
// Pre-normalise to [0,1] per axis so the polygon area correctly reflects "larger = better"
const RADAR_AXES = [
    { key: "Z-Score", cap: 600,  invert: false, scaleLabel: "0 – 600",  unit: ""  },
    { key: "PoD",     cap: 40,   invert: true,  scaleLabel: "0 – 40%",  unit: "%" },
    { key: "LGD",     cap: 100,  invert: true,  scaleLabel: "0 – 100%", unit: "%" },
] as const;

const RADAR_COMPANY  = { "Z-Score": 550, "PoD": 2.5, "LGD": 48 } as const;
const RADAR_INDUSTRY = { "Z-Score": 480, "PoD": 2.6, "LGD": 39 } as const;

type RadarAxisKey = (typeof RADAR_AXES)[number]["key"];

function normalise(value: number, cap: number, invert: boolean) {
    const n = Math.min(Math.max(value / cap, 0), 1);
    return invert ? 1 - n : n;
}

interface RadarTickProps {
    x?: number; y?: number;
    cx?: number; cy?: number;
    payload?: { value: string };
}

const RADAR_RAW_LABELS: Record<RadarAxisKey, (v: number) => string> = {
    "Z-Score": v => String(v),
    "PoD":     v => `${v}%`,
    "LGD":     v => `${v}%`,
};

const RADAR_FULL_LABELS: Record<RadarAxisKey, string> = {
    "Z-Score": "SME Z-Score",
    "PoD":     "Probability of Default",
    "LGD":     "Loss Given Default",
};


const WiserFundingChart = () => {
    const radarData = RADAR_AXES.map(ax => ({
        axis: ax.key,
        company:  normalise(RADAR_COMPANY[ax.key],  ax.cap, ax.invert),
        industry: normalise(RADAR_INDUSTRY[ax.key], ax.cap, ax.invert),
    }));

    const AxisTick = ({ x = 0, y = 0, cx = 0, cy = 0, payload }: RadarTickProps) => {
        const key = (payload?.value ?? "") as RadarAxisKey;
        const dx = x - cx;
        const dy = y - cy;
        const anchor = Math.abs(dx) < 8 ? "middle" : dx < 0 ? "end" : "start";
        const isTop = dy < -8;
        const textY = isTop ? y - 6 : dy > 8 ? y + 14 : y + 4;
        return (
            <text x={x} y={textY} textAnchor={anchor} fontSize={12} fontWeight={500} fill="#2d2926">{key}</text>
        );
    };

    const TooltipContent = ({ active, payload }: { active?: boolean; payload?: { name: string; payload: { axis: RadarAxisKey } }[] }) => {
        if (!active || !payload?.length) return null;
        const axis = payload[0].payload.axis;
        const fmt = RADAR_RAW_LABELS[axis];
        const label = RADAR_FULL_LABELS[axis];
        const ax = RADAR_AXES.find(a => a.key === axis)!;
        return (
            <div style={{ background: "white", border: "1px solid #f0e8e2", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                <p style={{ color: "#776c65", fontWeight: 600, marginBottom: 6 }}>{label}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#594483" }} />
                        <span style={{ color: "#776c65" }}>Company</span>
                        <span style={{ marginLeft: "auto", fontWeight: 600, color: "#1b1413", paddingLeft: 16 }}>{fmt(RADAR_COMPANY[axis])}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#a18fc6" }} />
                        <span style={{ color: "#776c65" }}>Industry avg.</span>
                        <span style={{ marginLeft: "auto", fontWeight: 600, color: "#1b1413", paddingLeft: 16 }}>{fmt(RADAR_INDUSTRY[axis])}</span>
                    </div>
                    <p style={{ color: "#9e9490", marginTop: 2 }}>{ax.invert ? "lower = better" : "higher = better"} · {ax.scaleLabel}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-[425px] overflow-visible">
            {/* Chart — 2/3 width */}
            <div className="flex-[2] min-w-0 flex flex-col overflow-visible">
                <ResponsiveContainer width="100%" height={425}>
                    <RadarChart data={radarData} outerRadius="75%" margin={{ top: 28, right: 20, bottom: 0, left: 48 }}>
                        <PolarGrid gridType="polygon" stroke="#f0e8e2" />
                        <PolarAngleAxis dataKey="axis" tick={AxisTick as never} />
                        <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} tickCount={5} />
                        <Radar name="Company"       dataKey="company"  stroke="#594483" strokeWidth={2}   fill="#594483" fillOpacity={0.22} isAnimationActive={false} />
                        <Radar name="Industry avg." dataKey="industry" stroke="#a18fc6" strokeWidth={1.5} strokeDasharray="4 3" fill="#a18fc6" fillOpacity={0}    isAnimationActive={false} />
                        <RechartsTip content={TooltipContent as never} />
                    </RadarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-1 pb-4 -mt-6">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polygon points="6,1 11,11 1,11" fill="#bdafda" /></svg>
                    <span className="text-xs text-tertiary">The bigger the area the better</span>
                </div>
            </div>

            {/* Info panel — 1/3 width */}
            <div className="flex flex-[1] flex-col justify-center gap-5 py-6 pr-6 pl-5">
                {RADAR_AXES.map(ax => (
                    <div key={ax.key} className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-primary">{RADAR_FULL_LABELS[ax.key]}</span>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block h-[2px] w-4 rounded bg-[#594483]" />
                                <span className="text-base font-semibold text-primary">{RADAR_RAW_LABELS[ax.key](RADAR_COMPANY[ax.key])}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block h-[2px] w-4 rounded" style={{ backgroundImage: "repeating-linear-gradient(90deg,#a18fc6 0,#a18fc6 4px,transparent 4px,transparent 7px)" }} />
                                <span className="text-base font-semibold text-[#a18fc6]">{RADAR_RAW_LABELS[ax.key](RADAR_INDUSTRY[ax.key])}</span>
                            </div>
                        </div>
                        <span className="text-xs text-tertiary">{ax.scaleLabel}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── CreditLineChart ───────────────────────────────────────────────────────────

interface CreditLineEntry { month: string; balance: number; limit: number }
interface CreditAccount {
    type: string;
    lastUpdated: string;
    limitLabel: string;
    utilisation: number;
    data: CreditLineEntry[];
}

const CreditLineChart = ({ account }: { account: CreditAccount }) => {
    const id = useId();
    const formatY = (v: number) => {
        if (v === 0) return "£0";
        if (v >= 1000) return `£${v / 1000}k`;
        return `£${v}`;
    };
    const utilisationColor = account.utilisation >= 80 ? "text-error-primary" : account.utilisation >= 50 ? "text-warning-primary" : "text-secondary";

    return (
        <div className="flex flex-col gap-0 pb-4">
            {/* Chart */}
            <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={account.data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a08cca" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#a08cca" stopOpacity={0.03} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f0e8e2" strokeWidth={1} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#776c65" }} axisLine={false} tickLine={false} dy={6} />
                    <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: "#776c65" }} axisLine={false} tickLine={false} width={52} tickCount={4} />
                    <Area type="monotone" dataKey="balance" stroke="#594483" strokeWidth={2} fill={`url(#area-${id})`} dot={false} activeDot={{ r: 4, fill: "#594483" }} />
                    <Line type="monotone" dataKey="limit" stroke="#a08cca" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={false} />
                    <RechartsTip
                        contentStyle={{ background: "white", border: "1px solid #f0e8e2", borderRadius: 8, fontSize: 12, padding: "6px 10px" }}
                        formatter={(v, name) => [`£${Number(v).toLocaleString()}`, name === "balance" ? "Balance" : "Credit Limit"]}
                        labelStyle={{ color: "#776c65", fontWeight: 600 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
            {/* Metadata row */}
            <div className="flex gap-3 pt-4 pl-[52px] pr-1">
                {[
                    { label: "Type",         value: account.type,         cls: "text-secondary" },
                    { label: "Last updated", value: account.lastUpdated,  cls: "text-secondary" },
                    { label: "Limit",        value: account.limitLabel,   cls: "text-secondary" },
                    { label: "Utilisation",  value: `${account.utilisation}%`, cls: utilisationColor },
                ].map(({ label, value, cls }) => (
                    <div key={label} className="flex flex-1 flex-col">
                        <span className="text-sm text-tertiary">{label}</span>
                        <span className={cx("text-base font-semibold", cls)}>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Overview tab static mock data ────────────────────────────────────────────


const CREDIT_ACCOUNTS: CreditAccount[] = [
    {
        type: "Credit Card", lastUpdated: "2026.05.24.", limitLabel: "£10,000", utilisation: 92,
        data: [
            { month: "Jan", balance: 3500, limit: 8000 },
            { month: "Feb", balance: 3800, limit: 8000 },
            { month: "Mar", balance: 5100, limit: 8000 },
            { month: "Apr", balance: 4700, limit: 8000 },
            { month: "May", balance: 5200, limit: 8000 },
            { month: "Jun", balance: 5800, limit: 10000 },
            { month: "Jul", balance: 6500, limit: 10000 },
            { month: "Aug", balance: 7900, limit: 10000 },
            { month: "Sep", balance: 7400, limit: 10000 },
            { month: "Oct", balance: 7800, limit: 10000 },
            { month: "Nov", balance: 8700, limit: 10000 },
            { month: "Dec", balance: 9200, limit: 10000 },
        ],
    },
    {
        type: "Personal Loan", lastUpdated: "2026.05.24.", limitLabel: "£15,000", utilisation: 61,
        data: [
            { month: "Jan", balance: 14200, limit: 15000 },
            { month: "Feb", balance: 13900, limit: 15000 },
            { month: "Mar", balance: 13600, limit: 15000 },
            { month: "Apr", balance: 13300, limit: 15000 },
            { month: "May", balance: 13000, limit: 15000 },
            { month: "Jun", balance: 12600, limit: 15000 },
            { month: "Jul", balance: 12200, limit: 15000 },
            { month: "Aug", balance: 11800, limit: 15000 },
            { month: "Sep", balance: 11400, limit: 15000 },
            { month: "Oct", balance: 11000, limit: 15000 },
            { month: "Nov", balance: 10600, limit: 15000 },
            { month: "Dec", balance: 9200, limit: 15000 },
        ],
    },
    {
        type: "Overdraft", lastUpdated: "2026.03.10.", limitLabel: "£2,500", utilisation: 38,
        data: [
            { month: "Jan", balance: 400,  limit: 2500 },
            { month: "Feb", balance: 600,  limit: 2500 },
            { month: "Mar", balance: 950,  limit: 2500 },
            { month: "Apr", balance: 700,  limit: 2500 },
            { month: "May", balance: 500,  limit: 2500 },
            { month: "Jun", balance: 350,  limit: 2500 },
            { month: "Jul", balance: 800,  limit: 2500 },
            { month: "Aug", balance: 1100, limit: 2500 },
            { month: "Sep", balance: 900,  limit: 2500 },
            { month: "Oct", balance: 750,  limit: 2500 },
            { month: "Nov", balance: 600,  limit: 2500 },
            { month: "Dec", balance: 950,  limit: 2500 },
        ],
    },
];

const RULE_OUTCOMES = [
    { rule: "Provenir Underwriting Report", message: "", muted: false },
    { rule: "DirectorCardsUtilization", message: "Director has used more than 75% of credit limit or invalid data", muted: true },
    { rule: "DirectorMissedPaymentsL6m", message: "Director has missed payments in 6 months or invalid data", muted: true },
    { rule: "Other Made up Report name", message: "", muted: false },
    { rule: "ProblemCode", message: "Magna magna proident velit pariatur duis officia. Pariatur ipsum adipisicing ex non sit.", muted: true },
];

const SCORE_CARD_ROWS = [
    { characteristic: "Net Worth", attribute: "249092", partialScore: "3.33" },
    { characteristic: "Company Age (months)", attribute: "37", partialScore: "3.35" },
    { characteristic: "High Risk Industry", attribute: "0.0", partialScore: "0" },
    { characteristic: "Total Worst Historical Status", attribute: "0.0", partialScore: "0" },
    { characteristic: "Number of CCJs", attribute: "0", partialScore: "0" },
    { characteristic: "Worts Status in the last 6 monhts", attribute: "1", partialScore: "0" },
    { characteristic: "SME Z-score", attribute: "379", partialScore: "2.5" },
    { characteristic: "Probability of Default in a year", attribute: "0.0115", partialScore: "1.33" },
    { characteristic: "HMRC Arrears", attribute: "0", partialScore: "0" },
    { characteristic: "Current Ratio", attribute: "3.4429236522244", partialScore: "3.33" },
    { characteristic: "Total Director Equity", attribute: "3175504.0", partialScore: "1.66" },
    { characteristic: "Directorships Failed", attribute: "0", partialScore: "0" },
];

const CAIS_COLS = ["0", "1", "2", "3", "4", "5", "6", "U", "Def"] as const;
type CaisCol = typeof CAIS_COLS[number];

const CAIS_ROWS: { date: string; values: Partial<Record<CaisCol, number>> }[] = [
    { date: "04/26", values: { "0": 1, "1": 1, "6": 1 } },
    { date: "03/26", values: { "0": 1, "1": 1, "6": 1 } },
    { date: "02/26", values: { "0": 2, "2": 1, "Def": 1 } },
    { date: "01/26", values: { "0": 3, "2": 1, "Def": 2 } },
    { date: "12/25", values: { "0": 3, "4": 1 } },
    { date: "11/25", values: { "0": 3, "4": 1, "U": 1 } },
    { date: "10/25", values: { "0": 3, "1": 4, "U": 2 } },
    { date: "09/25", values: { "0": 6, "3": 6, "U": 6, "Def": 6 } },
];

const caisColType = (col: CaisCol): "success" | "warning" | "gray" | "error" =>
    col === "0" ? "success" : col === "U" ? "gray" : col === "Def" ? "error" : "warning";

const CAIS_BG: Record<"success" | "warning" | "gray" | "error", string[]> = {
    success: ["", "bg-utility-success-50", "bg-utility-success-100", "bg-utility-success-200", "bg-utility-success-300", "bg-utility-success-400", "bg-utility-success-600"],
    warning: ["", "bg-utility-warning-50", "bg-utility-warning-100", "bg-utility-warning-200", "bg-utility-warning-300", "bg-utility-warning-400", "bg-utility-warning-600"],
    gray:    ["", "bg-utility-gray-50",    "bg-utility-gray-100",    "bg-utility-gray-200",    "bg-utility-gray-300",    "bg-utility-gray-400",    "bg-utility-gray-600"],
    error:   ["", "bg-utility-error-50",   "bg-utility-error-100",   "bg-utility-error-200",   "bg-utility-error-300",   "bg-utility-error-400",   "bg-utility-error-600"],
};

const CAIS_TEXT: Record<"success" | "warning" | "gray" | "error", string> = {
    success: "text-success-primary",
    warning: "text-warning-primary",
    gray: "text-tertiary",
    error: "text-error-primary",
};

const PSC_CONTACTS = [
    {
        name: "Mr. Alex Buck",
        isApplicant: true,
        email: "alexb@businesscompany.com",
        phone: "07723179931",
        dob: "24-05-1995",
        shareholdings: "25%",
        aml: "Pending",
        linkedCompanies: "2 Current – 3 Past",
        currentCompanies: [
            { name: "Page and Wick LTD",   dates: "2023.03.23. – now" },
            { name: "Wicker Rick Limited", dates: "2022.02.12. – now" },
        ],
        pastCompanies: [
            { name: "BigBiz Limited",         dates: "2019.01.01. – 2022.05.01." },
            { name: "Big Business LTD",       dates: "2018.07.15. – 2021.11.01." },
            { name: "Moneymaker.com limited", dates: "2003.01.01 – 2003.12.04."  },
        ],
    },
    {
        name: "Ms. Jamie Lee",
        isApplicant: false,
        email: "jamielees@examplemail.com",
        phone: "07894561234",
        dob: "15-11-1988",
        shareholdings: "25",
        aml: "Passed",
        linkedCompanies: "2 Current – 0 Past",
        currentCompanies: [
            { name: "Page and Wick LTD",   dates: "2023.03.23. – now" },
            { name: "Wicker Rick Limited", dates: "2022.02.12. – now" },
        ],
        pastCompanies: [],
    },
    {
        name: "Dr. Samira Khan",
        isApplicant: false,
        email: "s.khan@samplemail.net",
        phone: "07987654321",
        dob: "30-07-1990",
        shareholdings: "50%",
        aml: "Pending",
        linkedCompanies: "1 Current – 0 Past",
        currentCompanies: [
            { name: "Page and Wick LTD", dates: "2023.03.23. – now" },
        ],
        pastCompanies: [],
    },
];

// ──────────────────────────────────────────────────────────────────────────────

const LeadDetailView = ({ lead, onDecision }: { lead: Lead & { stage: LeadStage }; onDecision: (d: "approved" | "declined") => void }) => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<DetailTab>("overview");
    const [assignee, setAssignee] = useState(lead.assignee);
    const [stage, setStage] = useState<LeadStage>(lead.stage);
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
                        <SummaryField label="Incorporated"   value={lead.incorporated} />
                        <SummaryFieldAction label="Business Address" value={lead.address} icon={MarkerPin02} href={lead.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}` : undefined} />

                        <div className="h-[1.5px] bg-[var(--color-border-secondary)]" />

                        <StatusPicker value={stage} onChange={setStage} />

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
                                {/* ── Status badges ── */}
                                <div className="flex flex-wrap gap-3">
                                    <Badge type="pill-color" color="error"   size="sm">PSC Utilisation</Badge>
                                    <Badge type="pill-color" color="success" size="sm">Liquidity</Badge>
                                    <Badge type="pill-color" color="success" size="sm">Payments</Badge>
                                    <Badge type="pill-color" color="success" size="sm">Net Worth</Badge>
                                    <Badge type="pill-color" color="success" size="sm">PSC Public Gazette</Badge>
                                </div>

                                {/* ── Rule Outcomes ── */}
                                <InfoCard
                                    title="Rule Outcomes"
                                    badge={
                                        <div className="flex w-[22px] items-center justify-center rounded-md border border-secondary px-1.5 py-0.5">
                                            <span className="text-center text-xs font-medium text-secondary">3</span>
                                        </div>
                                    }
                                    raw
                                >
                                    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                                        <div className="flex">
                                            <div className="flex shrink-0 flex-col">
                                                <div className="flex h-11 items-center border-b border-secondary bg-primary pl-5 pr-6">
                                                    <span className="text-xs font-semibold text-quaternary">Rule</span>
                                                </div>
                                                {RULE_OUTCOMES.map(({ rule, muted }) => (
                                                    <div key={rule} className="flex h-14 items-center border-b border-secondary pl-5 pr-6 last:border-b-0">
                                                        <span className={cx("whitespace-nowrap text-sm font-medium", muted ? "text-tertiary" : "text-secondary")}>{rule}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <div className="flex h-11 items-center border-b border-secondary bg-primary px-6">
                                                    <span className="text-xs font-semibold text-quaternary">Message</span>
                                                </div>
                                                {RULE_OUTCOMES.map(({ rule, message }) => (
                                                    <div key={rule} className="flex h-14 items-center border-b border-secondary px-6 last:border-b-0">
                                                        {message && <span className="text-sm font-medium text-secondary">{message}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </InfoCard>

                                {/* ── Score card ── */}
                                <InfoCard title="Score card" raw>
                                    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                                        <div className="flex items-center gap-2 bg-utility-success-50 px-5 py-2">
                                            <span className="whitespace-nowrap text-[48px] font-bold leading-[60px] tracking-[-0.96px] text-success-primary">15.9</span>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-secondary">Combined Score</span>
                                                <span className="text-sm font-medium text-quaternary">(lower is better)</span>
                                            </div>
                                        </div>
                                        <div className="flex border-t border-secondary">
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <div className="flex h-11 items-center border-b border-secondary bg-primary pl-5 pr-6">
                                                    <span className="whitespace-nowrap text-xs font-semibold text-quaternary">Characteristic</span>
                                                </div>
                                                {SCORE_CARD_ROWS.map(({ characteristic }) => (
                                                    <div key={characteristic} className="flex h-12 items-center border-b border-secondary pl-5 pr-6 last:border-b-0">
                                                        <span className="whitespace-nowrap text-sm font-medium text-tertiary">{characteristic}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <div className="flex h-11 items-center border-b border-secondary bg-primary px-6">
                                                    <span className="whitespace-nowrap text-xs font-semibold text-quaternary">Attribute</span>
                                                </div>
                                                {SCORE_CARD_ROWS.map(({ characteristic, attribute }) => (
                                                    <div key={characteristic} className="flex h-12 items-center border-b border-secondary px-6 last:border-b-0">
                                                        <span className="text-sm text-tertiary">{attribute}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex shrink-0 flex-col">
                                                <div className="flex h-11 items-center justify-end border-b border-secondary bg-primary px-6">
                                                    <span className="whitespace-nowrap text-xs font-semibold text-quaternary">Partial Score</span>
                                                </div>
                                                {SCORE_CARD_ROWS.map(({ characteristic, partialScore }) => (
                                                    <div key={characteristic} className="flex h-12 items-center justify-end border-b border-secondary px-6 last:border-b-0">
                                                        <span className="text-sm font-semibold text-success-primary">{partialScore}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </InfoCard>

                                {/* ── Wiser Funding Scores ── */}
                                <InfoCard
                                    title="Wiser Funding Scores"
                                    badge={
                                        <div className="flex items-center gap-2 rounded-sm border border-secondary px-1.5 py-0.5 shadow-xs">
                                            <div className="flex items-center gap-1">
                                                <div className="h-[4px] w-[12px] rounded-full bg-[#594483]" />
                                                <span className="text-xs text-tertiary">Company</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="flex gap-[2px]">
                                                    {[0,1,2].map(i => <span key={i} className="size-[4px] shrink-0 rounded-full bg-[#a18fc6]" />)}
                                                </div>
                                                <span className="text-xs text-tertiary">Industry Average</span>
                                            </div>
                                        </div>
                                    }
                                    raw
                                >
                                    <div className="overflow-visible rounded-xl border border-secondary bg-primary">
                                        <WiserFundingChart />
                                    </div>
                                </InfoCard>

                                {/* ── PSC Credit Utilisation ── */}
                                <InfoCard
                                    title="PSC Credit Utilisation"
                                    badge={
                                        <div className="flex items-center gap-2 rounded-sm border border-secondary px-1.5 py-0.5 shadow-xs">
                                            <div className="flex items-center gap-1">
                                                <div className="h-[4px] w-[12px] rounded-full bg-[#594483]" />
                                                <span className="text-xs text-tertiary">Balance</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="flex gap-[2px]">
                                                    {[0,1,2].map(i => <span key={i} className="size-[4px] shrink-0 rounded-full bg-[#a08cca]" />)}
                                                </div>
                                                <span className="text-xs text-tertiary">Credit Limit</span>
                                            </div>
                                        </div>
                                    }
                                    raw
                                >
                                    <div className="overflow-hidden rounded-xl border border-secondary bg-primary py-4">
                                        {CREDIT_ACCOUNTS.map((account, i) => (
                                            <div key={i} className={cx("px-5 pt-8", i < CREDIT_ACCOUNTS.length - 1 && "border-b border-secondary pb-6")}>
                                                <CreditLineChart account={account} />
                                            </div>
                                        ))}
                                    </div>
                                </InfoCard>

                                {/* ── PSC Information ── */}
                                <InfoCard
                                    title="PSC Information"
                                    badge={
                                        <div className="flex w-[22px] items-center justify-center rounded-md border border-secondary px-1.5 py-0.5">
                                            <span className="text-center text-xs font-medium text-secondary">3</span>
                                        </div>
                                    }
                                    raw
                                >
                                    <div className="flex flex-col rounded-xl border border-secondary bg-primary px-5">
                                        {PSC_CONTACTS.map((contact, i) => (
                                            <div key={contact.name} className={cx("flex flex-col gap-3 py-5", i > 0 && "border-t border-secondary")}>
                                                {/* Contact Name + Email */}
                                                <div className="flex flex-wrap gap-3">
                                                    <div className="flex flex-col w-[calc(50%-6px)]">
                                                        <span className="text-sm text-tertiary">Contact Name</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-semibold text-secondary">{contact.name}</span>
                                                            {contact.isApplicant && <Badge type="pill-color" color="brand" size="sm">Applicant</Badge>}
                                                        </div>
                                                    </div>
                                                    <SummaryField label="Email"                       value={contact.email}         className="w-[calc(50%-6px)]" />
                                                    <SummaryField label="Phone"                       value={contact.phone}         className="w-[calc(50%-6px)]" />
                                                    <SummaryField label="Date of Birth"               value={contact.dob}           className="w-[calc(50%-6px)]" />
                                                    <SummaryField label="Shareholdings"               value={contact.shareholdings} className="w-[calc(50%-6px)]" />
                                                    <SummaryField label="Anti Money Laundering Check" value={contact.aml}           className="w-[calc(50%-6px)]" />
                                                </div>
                                                {/* Linked Companies */}
                                                <SummaryField label="Linked Companies" value={contact.linkedCompanies} />
                                                {/* Current Companies */}
                                                {contact.currentCompanies.length > 0 && (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm text-tertiary">Current Companies</span>
                                                        {contact.currentCompanies.map(c => (
                                                            <div key={c.name} className="flex items-baseline justify-between">
                                                                <span className="text-base font-semibold text-secondary">{c.name}</span>
                                                                <span className="text-sm text-tertiary">{c.dates}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Past Companies */}
                                                {contact.pastCompanies.length > 0 && (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm text-tertiary">Past Companies</span>
                                                        {contact.pastCompanies.map(c => (
                                                            <div key={c.name} className="flex items-baseline justify-between">
                                                                <span className="text-base font-semibold text-secondary">{c.name}</span>
                                                                <span className="text-sm text-tertiary">{c.dates}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </InfoCard>

                                {/* ── Company Payments CAIS summary ── */}
                                <InfoCard title="Company Payments - CAIS summary" raw>
                                    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
                                        <div className="flex">
                                            {/* Date column */}
                                            <div className="flex shrink-0 flex-col">
                                                <div className="flex h-11 items-center border-b border-secondary bg-primary pl-5 pr-6" />
                                                {CAIS_ROWS.map(({ date }) => (
                                                    <div key={date} className="flex h-12 items-center border-b border-secondary pl-5 pr-6 last:border-b-0">
                                                        <span className="whitespace-nowrap text-sm text-quaternary">{date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Value columns */}
                                            {CAIS_COLS.map((col) => {
                                                const type = caisColType(col);
                                                return (
                                                    <div key={col} className="flex flex-1 flex-col">
                                                        <div className="flex h-11 items-center justify-center border-b border-secondary bg-primary px-4">
                                                            <span className="text-xs text-quaternary">{col}</span>
                                                        </div>
                                                        {CAIS_ROWS.map(({ date, values }) => {
                                                            const v = values[col];
                                                            const bg = v ? (CAIS_BG[type][v] ?? CAIS_BG[type][6]) : "";
                                                            const text = v ? (v >= 6 ? "text-white" : CAIS_TEXT[type]) : "";
                                                            return (
                                                                <div key={date} className={cx("flex h-12 items-center justify-center border-b border-secondary px-4 last:border-b-0", bg)}>
                                                                    {v != null && <span className={cx("text-sm font-semibold", text)}>{v}</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </InfoCard>

                                {/* ── Company details ── */}
                                <InfoCard title="Company details">
                                    <SummaryField label="Name"                     value={lead.company}        className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Companies House Number"   value={lead.companyNumber}  className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Registered Address"       value={lead.address}        className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Incorporated"             value={lead.incorporated}   className="w-[calc(50%-6px)]" />
                                    <SummaryField label="Status"                   value="Active"              className="w-[calc(50%-6px)]" />
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

// ─── Leads Page ──────────────────────────────────────────────────────────────

type LeadStrength = "Strong" | "Weak";

interface LeadRow {
    id: string;
    name: string;
    company?: string;
    applied: string;
    businessType: string;
    strength: LeadStrength;
    callStatus: string;
    assignee: string;
    phone: string;
    priority?: boolean;
}

const LEADS_DATA: LeadRow[] = [
    { id: "ld1",  name: "Luna Blake",    company: "Veridian Dynamics", applied: "2 mins ago",      businessType: "Limited",     strength: "Strong", callStatus: "Never Called",      assignee: "Alex Buck", phone: "+44 20 7946 0001", priority: true },
    { id: "ld2",  name: "Grayson King",  company: undefined,           applied: "43 mins ago",     businessType: "Sole Trader", strength: "Weak",   callStatus: "Voicemail",         assignee: "Alex Buck", phone: "+44 20 7946 0002", priority: true },
    { id: "ld3",  name: "Owen Hayes",    company: "Infinite Tech",     applied: "today 12:34",     businessType: "Limited",     strength: "Strong", callStatus: "Called Today",      assignee: "Alex Buck", phone: "+44 20 7946 0003" },
    { id: "ld4",  name: "Asher Bell",    company: "Zenith Dynamics",   applied: "yesterday 16:32", businessType: "Sole Trader", strength: "Weak",   callStatus: "Never Called",      assignee: "Alex Buck", phone: "+44 20 7946 0004" },
    { id: "ld5",  name: "Scarlett Reed", company: undefined,           applied: "yesterday 12:29", businessType: "Limited",     strength: "Weak",   callStatus: "Called Yesterday",  assignee: "Alex Buck", phone: "+44 20 7946 0005" },
    { id: "ld6",  name: "Hazel Quinn",   company: "Innovate",          applied: "22 April 11:23",  businessType: "Sole Trader", strength: "Weak",   callStatus: "Called Yesterday",  assignee: "Alex Buck", phone: "+44 20 7946 0006" },
    { id: "ld7",  name: "Elijah Stone",  company: "Solarlux",          applied: "22 April 10:23",  businessType: "Sole Trader", strength: "Weak",   callStatus: "Called 4 days ago", assignee: "Alex Buck", phone: "+44 20 7946 0007" },
    { id: "ld8",  name: "Maya Torres",   company: "BrightPath Ltd",    applied: "21 April 09:15",  businessType: "Limited",     strength: "Strong", callStatus: "Called Yesterday",  assignee: "Alex Buck", phone: "+44 20 7946 0008" },
    { id: "ld9",  name: "Felix Grant",   company: undefined,           applied: "20 April 14:40",  businessType: "Sole Trader", strength: "Weak",   callStatus: "Called 3 days ago", assignee: "Alex Buck", phone: "+44 20 7946 0009" },
    { id: "ld10", name: "Isla Marsh",    company: "NovaTech",          applied: "19 April 10:00",  businessType: "Limited",     strength: "Strong", callStatus: "Never Called",      assignee: "Alex Buck", phone: "+44 20 7946 0010" },
    { id: "ld11", name: "Reuben Park",   company: "Pinnacle Co",       applied: "18 April 16:22",  businessType: "Sole Trader", strength: "Weak",   callStatus: "Voicemail",         assignee: "Alex Buck", phone: "+44 20 7946 0011" },
    { id: "ld12", name: "Nadia Fox",     company: undefined,           applied: "17 April 11:05",  businessType: "Limited",     strength: "Strong", callStatus: "Called Today",      assignee: "Alex Buck", phone: "+44 20 7946 0012" },
];

const callStatusColor = (status: string): "error" | "warning" | "success" | "gray" => {
    if (status === "Never Called")      return "error";
    if (status === "Voicemail")         return "warning";
    if (status.startsWith("Called"))    return status === "Called Today" || status === "Called Yesterday" ? "success" : "gray";
    return "gray";
};

const LeadsStrengthBadge = ({ strength }: { strength: LeadStrength }) => (
    <Badge type="pill-color" color={strength === "Strong" ? "success" : "gray-blue"} size="sm">
        {strength}
    </Badge>
);

const CallStatusBadge = ({ status }: { status: string }) => (
    <BadgeWithDot type="modern" color={callStatusColor(status)} size="sm">
        {status}
    </BadgeWithDot>
);

const LeadsSimpleFilter = ({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const display = value === options[0] ? label : value;
    const isActive = value !== options[0];

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={cx(
                    "relative inline-flex cursor-pointer items-center gap-1 rounded-lg border py-2 pl-3 pr-8 text-sm font-semibold transition duration-100 focus:outline-none",
                    open
                        ? "border-primary bg-active text-secondary"
                        : isActive
                        ? "border-brand-600 bg-primary text-secondary hover:bg-primary_hover hover:text-secondary_hover"
                        : "border-primary bg-primary text-secondary hover:bg-primary_hover",
                )}
            >
                {display}
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-quaternary" />
            </button>
            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-secondary bg-primary shadow-xl">
                    <div className="py-1.5">
                        {options.map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => { onChange(opt); setOpen(false); }}
                                className={cx(
                                    "flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-sm font-medium text-primary",
                                    opt === value ? "bg-active" : "hover:bg-secondary_subtle",
                                )}
                            >
                                {opt}
                                {opt === value && <CheckCircle className="ml-auto size-4 shrink-0 text-brand-secondary" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Lead Detail Overlay ─────────────────────────────────────────────────────

type ActivityType = "automated" | "notes" | "playbook";
const STATIC_ADDRESSES = [
    { id: "1",  address: "3 Charnwood Way, Wellesbourne, Warwick CV35 8EN" },
    { id: "2",  address: "42 Victoria Street, London SW1H 0NW" },
    { id: "3",  address: "15 Oxford Road, Manchester M1 5QA" },
    { id: "4",  address: "7 Castle Street, Edinburgh EH2 3AH" },
    { id: "5",  address: "28 Queen Street, Cardiff CF10 2BU" },
    { id: "6",  address: "91 High Street, Birmingham B4 7SL" },
    { id: "7",  address: "54 Park Lane, Leeds LS3 1AB" },
    { id: "8",  address: "12 Bridge Street, Bristol BS1 2EL" },
    { id: "9",  address: "66 Church Road, Liverpool L1 3BQ" },
    { id: "10", address: "8 Market Square, Nottingham NG1 2ET" },
    { id: "11", address: "23 Station Road, Sheffield S1 2GU" },
    { id: "12", address: "39 King Street, Glasgow G1 5QT" },
];

type ActivityEntry = { icon: typeof PhoneCall01 | null; title: string; meta: string; date: string; type: ActivityType };

const LEAD_ACTIVITIES: Record<string, ActivityEntry[]> = {
    ld1: [
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "Today • 09:00",         type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "Today • 09:12",         type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Connected",        meta: "",          date: "Today • 09:45 • 142s",  type: "automated" },
        { icon: Mail01,          title: "Outbound email",                  meta: "Alex Buck", date: "Today • 10:30",         type: "automated" },
        { icon: MessageSquare01, title: "Followed up — awaiting callback", meta: "Alex Buck", date: "Today • 10:31",         type: "notes"     },
    ],
    ld2: [
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "Today • 08:00",         type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "Today • 08:15",         type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Voicemail",        meta: "",          date: "Today • 08:45",         type: "automated" },
        { icon: MessageSquare01, title: "Left voicemail, expects callback",meta: "Alex Buck", date: "Today • 08:46",         type: "notes"     },
    ],
    ld3: [
        { icon: null,            title: "Application submitted",           meta: "System",    date: "Today • 12:34",         type: "automated" },
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "Today • 12:35",         type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Connected",        meta: "",          date: "Today • 13:10 • 87s",   type: "automated" },
        { icon: MessageSquare01, title: "Interested — send proposal",      meta: "Alex Buck", date: "Today • 13:15",         type: "notes"     },
        { icon: Mail01,          title: "Outbound email — intro",          meta: "Alex Buck", date: "Today • 13:30",         type: "automated" },
    ],
    ld4: [
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "Yesterday • 16:32",     type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "Yesterday • 16:45",     type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "Yesterday • 17:00",     type: "automated" },
    ],
    ld5: [
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "Yesterday • 12:29",     type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Connected",        meta: "",          date: "Yesterday • 14:00 • 220s", type: "automated" },
        { icon: MessageSquare01, title: "Customer wants quote by Friday",  meta: "Alex Buck", date: "Yesterday • 14:05",     type: "notes"     },
        { icon: Mail01,          title: "Outbound email — follow-up",      meta: "Alex Buck", date: "Yesterday • 14:20",     type: "automated" },
    ],
    ld6: [
        { icon: null,            title: "Lead re-assigned from queue",     meta: "System",    date: "22 Apr • 09:00",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "22 Apr • 10:30",        type: "automated" },
        { icon: Mail01,          title: "Outbound email — intro",          meta: "Alex Buck", date: "22 Apr • 11:00",        type: "automated" },
        { icon: MessageSquare01, title: "Strong lead — prioritise",        meta: "Alex Buck", date: "22 Apr • 11:05",        type: "notes"     },
    ],
    ld7: [
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "22 Apr • 10:23",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "22 Apr • 11:00",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "22 Apr • 11:30",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Voicemail",        meta: "",          date: "22 Apr • 12:00",        type: "automated" },
        { icon: MessageSquare01, title: "Sent intro email, awaiting reply",meta: "Alex Buck", date: "22 Apr • 12:05",        type: "notes"     },
    ],
    ld8: [
        { icon: null,            title: "Application submitted",           meta: "System",    date: "21 Apr • 09:15",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Connected",        meta: "",          date: "21 Apr • 10:00 • 310s", type: "automated" },
        { icon: MessageSquare01, title: "Very keen — book follow-up call", meta: "Alex Buck", date: "21 Apr • 10:10",        type: "notes"     },
        { icon: Mail01,          title: "Outbound email",                  meta: "Alex Buck", date: "21 Apr • 10:30",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Connected",        meta: "",          date: "21 Apr • 15:00 • 195s", type: "automated" },
        { icon: MessageSquare01, title: "Confirmed interest, needs docs",  meta: "Alex Buck", date: "21 Apr • 15:10",        type: "notes"     },
    ],
    ld9: [
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "20 Apr • 14:40",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "20 Apr • 15:00",        type: "automated" },
        { icon: Mail01,          title: "Outbound email — intro",          meta: "Alex Buck", date: "20 Apr • 15:15",        type: "automated" },
    ],
    ld10: [
        { icon: null,            title: "Application submitted",           meta: "System",    date: "19 Apr • 10:00",        type: "automated" },
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "19 Apr • 10:01",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "19 Apr • 10:30",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: No Answer",        meta: "",          date: "19 Apr • 11:00",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Connected",        meta: "",          date: "19 Apr • 14:00 • 65s",  type: "automated" },
        { icon: MessageSquare01, title: "Not a good time — call Monday",   meta: "Alex Buck", date: "19 Apr • 14:05",        type: "notes"     },
    ],
    ld11: [
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "18 Apr • 16:22",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Voicemail",        meta: "",          date: "18 Apr • 16:35",        type: "automated" },
        { icon: Mail01,          title: "Outbound email — follow-up",      meta: "Alex Buck", date: "18 Apr • 16:50",        type: "automated" },
    ],
    ld12: [
        { icon: null,            title: "Application submitted",           meta: "System",    date: "17 Apr • 11:05",        type: "automated" },
        { icon: null,            title: "Assigned to Alex Buck",           meta: "System",    date: "17 Apr • 11:06",        type: "automated" },
        { icon: PhoneCall01,     title: "Outbound call: Connected",        meta: "",          date: "17 Apr • 11:30 • 178s", type: "automated" },
        { icon: MessageSquare01, title: "Requested callback next week",    meta: "Alex Buck", date: "17 Apr • 11:40",        type: "notes"     },
        { icon: Mail01,          title: "Outbound email",                  meta: "Alex Buck", date: "17 Apr • 12:00",        type: "automated" },
    ],
};

const LEAD_CONTACT_DETAILS: Record<string, { firstName: string; lastName: string; email: string; dob: string; jobTitle: string }> = {
    ld1:  { firstName: "Luna",     lastName: "Blake",   email: "luna.blake@veridian.co.uk",   dob: "15/03/1988", jobTitle: "Director"       },
    ld2:  { firstName: "Grayson",  lastName: "King",    email: "g.king@outlook.com",          dob: "22/07/1981", jobTitle: "Sole Trader"    },
    ld3:  { firstName: "Owen",     lastName: "Hayes",   email: "owen.hayes@infinitetech.com", dob: "04/11/1990", jobTitle: "CTO"            },
    ld4:  { firstName: "Asher",    lastName: "Bell",    email: "asher.bell@zenith.co.uk",     dob: "30/01/1975", jobTitle: "Owner"          },
    ld5:  { firstName: "Scarlett", lastName: "Reed",    email: "scarlett.reed@gmail.com",     dob: "18/06/1993", jobTitle: "Managing Director" },
    ld6:  { firstName: "Hazel",    lastName: "Quinn",   email: "hazel.quinn@innovate.io",     dob: "09/09/1985", jobTitle: "CEO"            },
    ld7:  { firstName: "Elijah",   lastName: "Stone",   email: "elijah@solarlux.co.uk",       dob: "27/02/1979", jobTitle: "Director"       },
    ld8:  { firstName: "Maya",     lastName: "Torres",  email: "m.torres@brightpath.co.uk",   dob: "11/04/1994", jobTitle: "Finance Manager" },
    ld9:  { firstName: "Felix",    lastName: "Grant",   email: "felix.grant@gmail.com",       dob: "03/12/1987", jobTitle: "Owner"          },
    ld10: { firstName: "Isla",     lastName: "Marsh",   email: "isla.marsh@novatech.com",     dob: "20/05/1991", jobTitle: "CTO"            },
    ld11: { firstName: "Reuben",   lastName: "Park",    email: "r.park@pinnacle.co.uk",       dob: "14/08/1983", jobTitle: "Director"       },
    ld12: { firstName: "Nadia",    lastName: "Fox",     email: "nadia.fox@mail.com",          dob: "07/10/1996", jobTitle: "Managing Director" },
};

const INDUSTRY_OPTIONS = [
    "Technology", "Healthcare", "Retail", "Manufacturing", "Finance",
    "Professional Services", "Hospitality", "Construction", "Energy",
    "Education", "Media & Entertainment", "Transport & Logistics", "Other",
] as const;

const LEAD_COMPANY_DETAILS: Record<string, {
    streetAddress?: string; city?: string; postalCode?: string; industry?: string;
    annualTurnover?: string; incorporationDate?: string; companyNumber?: string; overdraftLimit?: string;
}> = {
    ld1:  { streetAddress: "12 Shoreditch High St",  city: "London",     postalCode: "E1 6JE",  industry: "Technology",             annualTurnover: "420000", incorporationDate: "14/03/2021", companyNumber: "14823901", overdraftLimit: "0"     },
    ld3:  { streetAddress: "45 Innovation Way",       city: "Manchester", postalCode: "M1 5GH",  industry: "Technology",             annualTurnover: "680000", incorporationDate: "09/07/2018", companyNumber: "11930472", overdraftLimit: "10000" },
    ld4:  { streetAddress: "7 Commerce Park",         city: "Birmingham", postalCode: "B1 1AA",  industry: "Retail",                 annualTurnover: "290000", incorporationDate: "22/04/2012", companyNumber: "08194736", overdraftLimit: "5000"  },
    ld6:  { streetAddress: "30 Tech Quarter",         city: "Bristol",    postalCode: "BS1 4QT", industry: "Professional Services",  annualTurnover: "510000", incorporationDate: "03/11/2016", companyNumber: "10284756", overdraftLimit: "0"     },
    ld7:  { streetAddress: "8 Solar Park",            city: "Edinburgh",  postalCode: "EH1 2AB", industry: "Energy",                 annualTurnover: "340000", incorporationDate: "17/06/2015", companyNumber: "09273645", overdraftLimit: "20000" },
    ld8:  { streetAddress: "22 Canary Wharf",         city: "London",     postalCode: "E14 5HX", industry: "Healthcare",             annualTurnover: "780000", incorporationDate: "01/09/2019", companyNumber: "12748391", overdraftLimit: "15000" },
    ld10: { streetAddress: "100 Science Park",        city: "Cambridge",  postalCode: "CB4 0DL", industry: "Technology",             annualTurnover: "920000", incorporationDate: "28/02/2020", companyNumber: "13904827", overdraftLimit: "0"     },
    ld11: { streetAddress: "15 Business Centre",      city: "Leeds",      postalCode: "LS1 5DT", industry: "Finance",                annualTurnover: "450000", incorporationDate: "14/05/2013", companyNumber: "07836492", overdraftLimit: "25000" },
};

type ActivityFilter = "all" | ActivityType;
const ACTIVITY_FILTER_OPTIONS: ({ value: ActivityFilter; label: string } | "divider")[] = [
    { value: "all",       label: "All activity" },
    "divider",
    { value: "notes",     label: "Notes" },
    { value: "automated", label: "Automated updates" },
    { value: "playbook",  label: "Playbook" },
];
const ACTIVITY_FILTER_LABELS: Record<ActivityFilter, string> = {
    all:       "All activity",
    notes:     "Notes",
    automated: "Automated updates",
    playbook:  "Playbook",
};

type OverlayTab = "contact" | "company" | "playbook" | "contacts" | "application" | "tasks";

const OVERLAY_TABS: { key: OverlayTab; label: string }[] = [
    { key: "contact",     label: "Contact Details" },
    { key: "company",     label: "Company Details" },
    { key: "playbook",    label: "Playbook" },
    { key: "contacts",    label: "Associated Contacts" },
    { key: "application", label: "Application" },
    { key: "tasks",       label: "Completed Tasks" },
];

const PlaybookEmptyIllustration = () => (
    <div className="flex flex-col items-center gap-2">
        <img src="/empty_playbook.png" alt="" className="size-[140px] object-contain" />
        <p className="text-sm text-quaternary">No playbook notes yet</p>
    </div>
);

const PlaybookSelect = ({ label, hint, options, placeholder = "Select an option" }: {
    label: string;
    hint?: string;
    options: string[];
    placeholder?: string;
}) => {
    const [value, setValue] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">{label}</label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="flex w-full items-center gap-2 rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm shadow-xs outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                >
                    <span className={cx("flex-1 text-left", value ? "text-primary" : "text-placeholder")}>{value ?? placeholder}</span>
                    <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-150", open && "rotate-180")} />
                </button>
                {open && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-secondary bg-primary shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="py-1">
                                {options.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => { setValue(opt); setOpen(false); }}
                                        className={cx(
                                            "mx-1.5 flex w-[calc(100%-12px)] items-center rounded-md px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                                            value === opt ? "bg-secondary_subtle text-primary" : "text-secondary hover:bg-secondary_subtle",
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
            {hint && <p className="text-xs text-tertiary">{hint}</p>}
        </div>
    );
};

const OverlayField = ({ label, value, placeholder, className, animKey, exiting }: { label: string; value?: string; placeholder?: string; className?: string; animKey?: number; exiting?: boolean }) => (
    <div className={cx("flex flex-col gap-1.5", className)}>
        <label className="text-sm font-medium text-secondary">{label}</label>
        <div className="w-full rounded-lg border border-secondary bg-primary px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
            <input
                key={animKey}
                type="text"
                defaultValue={value}
                placeholder={placeholder}
                className={cx(
                    "w-full bg-transparent text-sm text-primary placeholder:text-placeholder outline-none",
                    animKey !== undefined && (exiting ? "opacity-0 duration-[120ms] transition-opacity ease-in" : "animate-in fade-in duration-200 ease-out"),
                )}
            />
        </div>
    </div>
);

const ASSIGNEE_OPTIONS: { value: string; label: string; avatar: string }[] = [
    { value: "olivia", label: "Olivia Rhye", avatar: "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80" },
    { value: "liam",   label: "Liam Chen",   avatar: "https://www.untitledui.com/images/avatars/phoenix-baker?fm=webp&q=80" },
    { value: "emma",   label: "Emma Patel",  avatar: "https://www.untitledui.com/images/avatars/demi-wilkinson?fm=webp&q=80" },
];

const OverlayFieldWithAction = ({
    label,
    value,
    placeholder,
    className,
    actionIcon: ActionIcon,
    href,
    external,
    animKey,
    exiting,
}: {
    label: string;
    value?: string;
    placeholder?: string;
    className?: string;
    actionIcon: React.ComponentType<{ className?: string }>;
    href?: string;
    external?: boolean;
    animKey?: number;
    exiting?: boolean;
}) => (
    <div className={cx("flex items-end gap-2", className)}>
        <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">{label}</label>
            <div className="w-full rounded-lg border border-secondary bg-primary px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
                <input
                    key={animKey}
                    type="text"
                    defaultValue={value}
                    placeholder={placeholder}
                    className={cx(
                        "w-full bg-transparent text-sm text-primary placeholder:text-placeholder outline-none",
                        animKey !== undefined && (exiting ? "opacity-0 duration-[120ms] transition-opacity ease-in" : "animate-in fade-in duration-200 ease-out"),
                    )}
                />
            </div>
        </div>
        {href ? (
            <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="flex shrink-0 items-center justify-center rounded-lg border border-secondary bg-primary p-[10px] shadow-xs hover:bg-secondary_subtle transition-colors"
            >
                <ActionIcon className="size-5 text-fg-secondary" />
            </a>
        ) : (
            <button
                type="button"
                disabled
                className="flex shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-secondary bg-primary p-[10px] shadow-xs opacity-40"
            >
                <ActionIcon className="size-5 text-fg-secondary" />
            </button>
        )}
    </div>
);

type OverlayTask = { id: number; originalId?: string; desc: string; priority: string | null; due: string | null; assignee: string | null; completed: boolean };

const LeadTasksContext = createContext<Record<string, OverlayTask[]>>({});

function useDropdownKeyNav(
    count: number,
    open: boolean,
    onSelect: (index: number) => void,
    onClose: () => void,
) {
    const [activeIndex, setActiveIndex] = useState(-1);
    useEffect(() => { if (!open) setActiveIndex(-1); }, [open]);
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, count - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === "Enter" && activeIndex >= 0) { e.preventDefault(); onSelect(activeIndex); }
        else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    return { activeIndex, handleKeyDown };
}

const PRIORITY_OPTIONS = [
    { label: "Low",    dot: "bg-[#7cd4fd]" },
    { label: "Medium", dot: "bg-[#fdb022]" },
    { label: "High",   dot: "bg-[#f97066]" },
] as const;

const FLAG_OPTIONS = [
    "Possible fraud",
    "Not a business",
    "Liquidated",
    "Requested no calls",
    "Send auto-decline mail",
    "Pause outreach for 3 months",
    "Pause outreach for 6 months",
] as const;

const TaskCardView = ({
    task,
    onComplete,
    onEdit,
    onReschedule,
    rescheduleRef,
}: {
    task: OverlayTask;
    onComplete: () => void;
    onEdit: () => void;
    onReschedule: () => void;
    rescheduleRef?: React.RefObject<HTMLDivElement | null>;
}) => {
    const assigneeLabel = task.assignee === "me"
        ? "Me"
        : ASSIGNEE_OPTIONS.find(o => o.value === task.assignee)?.label ?? null;
    const priorityOpt = PRIORITY_OPTIONS.find(p => p.label === task.priority);
    const meta: { label: string; dot?: string }[] = [
        ...(priorityOpt ? [{ label: priorityOpt.label, dot: priorityOpt.dot }] : []),
        ...(task.due ? [{ label: task.due }] : []),
        ...(assigneeLabel ? [{ label: assigneeLabel }] : []),
    ];
    return (
        <div className="flex items-center gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center">
                <CheckDone01 className="size-7 text-fg-brand-primary" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <p className={cx("text-sm font-medium text-primary", task.completed && "line-through")}>{task.desc}</p>
                {meta.length > 0 && (
                    <div className="mt-0.5 flex items-center gap-1 text-sm text-tertiary">
                        {meta.map((item, i) => (
                            <span key={i} className="flex items-center gap-1">
                                {i > 0 && <span className="size-1 rounded-full bg-fg-quaternary shrink-0" />}
                                {item.dot && <span className={cx("size-1.5 rounded-full shrink-0", item.dot)} />}
                                {item.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <Button color="secondary" size="sm" iconLeading={Edit05} className="shrink-0" onClick={onEdit} />
            <div ref={rescheduleRef} className="shrink-0">
                <Button color="secondary" size="sm" iconLeading={ClockRewind} onClick={onReschedule} />
            </div>
            <Button
                color="primary"
                size="sm"
                iconLeading={<Check className="pointer-events-none size-5 shrink-0 text-fg-white" />}
                className="shrink-0"
                onClick={onComplete}
            />
        </div>
    );
};

const AnimatedTaskCard = ({
    task,
    onComplete,
    onRemove: _onRemove,
    onUpdate,
}: {
    task: OverlayTask;
    onComplete: () => void;
    onRemove: () => void;
    onUpdate: (updates: Partial<OverlayTask>) => void;
}) => {
    const [phase, setPhase] = useState<"entering" | "idle" | "exiting" | "collapsing">("entering");
    const [mode, setMode] = useState<"view" | "editing" | "rescheduling">("view");

    // Edit form state
    const [editDesc, setEditDesc] = useState(task.desc);
    const [editPriority, setEditPriority] = useState<string | null>(task.priority);
    const [editDue, setEditDue] = useState<string | null>(task.due);
    const [editAssignee, setEditAssignee] = useState<string | null>(task.assignee);
    const [editPickerDate, setEditPickerDate] = useState<Date | null>(null);
    const [editPriorityOpen, setEditPriorityOpen] = useState(false);
    const [editDueOpen, setEditDueOpen] = useState(false);
    const [editAssigneeOpen, setEditAssigneeOpen] = useState(false);
    const [editShowDatePicker, setEditShowDatePicker] = useState(false);

    // Edit animation phase
    const [editPhase, setEditPhase] = useState<"entering" | "idle">("entering");

    // Reschedule state
    const [reschedulePickerDate, setReschedulePickerDate] = useState<Date | null>(null);
    const rescheduleRef = useRef<HTMLDivElement>(null);
    const [reschedulePickerPos, setReschedulePickerPos] = useState<{ top: number; left: number } | null>(null);

    const ASSIGNEE_ALL = ["me", ...ASSIGNEE_OPTIONS.map(o => o.value)] as const;

    const { activeIndex: editPriorityActiveIdx, handleKeyDown: editPriorityKeyDown } = useDropdownKeyNav(
        PRIORITY_OPTIONS.length, editPriorityOpen,
        (i) => { setEditPriority(PRIORITY_OPTIONS[i].label); setEditPriorityOpen(false); },
        () => setEditPriorityOpen(false),
    );
    const { activeIndex: editDueActiveIdx, handleKeyDown: editDueKeyDown } = useDropdownKeyNav(
        DUE_OPTIONS.length, editDueOpen,
        (i) => {
            if (DUE_OPTIONS[i] === "Custom") { setEditDueOpen(false); setEditShowDatePicker(true); }
            else { setEditDue(DUE_OPTIONS[i]); setEditDueOpen(false); }
        },
        () => setEditDueOpen(false),
    );
    const { activeIndex: editAssigneeActiveIdx, handleKeyDown: editAssigneeKeyDown } = useDropdownKeyNav(
        ASSIGNEE_ALL.length, editAssigneeOpen,
        (i) => { setEditAssignee(ASSIGNEE_ALL[i]); setEditAssigneeOpen(false); },
        () => setEditAssigneeOpen(false),
    );

    useEffect(() => {
        const id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase("idle")));
        return () => cancelAnimationFrame(id);
    }, []);


    const handleComplete = () => {
        setPhase("exiting");
        setTimeout(() => setPhase("collapsing"), 160);
        setTimeout(onComplete, 420);
    };

    const handleStartEdit = () => {
        setEditDesc(task.desc);
        setEditPriority(task.priority);
        setEditDue(task.due);
        setEditAssignee(task.assignee);
        setEditPickerDate(null);
        setEditPhase("entering");
        setMode("editing");
        requestAnimationFrame(() => requestAnimationFrame(() => setEditPhase("idle")));
    };

    const handleStartReschedule = () => {
        const rect = rescheduleRef.current?.getBoundingClientRect();
        setReschedulePickerPos({
            top: (rect?.bottom ?? window.innerHeight / 2 - 200) + 4,
            left: Math.max(4, (rect?.right ?? window.innerWidth / 2 + 144) - 288),
        });
        setMode("rescheduling");
    };

    const handleCancelEdit = () => {
        setMode("view");
    };

    const handleSaveEdit = () => {
        onUpdate({ desc: editDesc.trim() || task.desc, priority: editPriority, due: editDue, assignee: editAssignee });
        setMode("view");
    };

    const expanded = phase === "idle" || phase === "exiting";

    const viewVisible = mode !== "editing";
    const editVisible = mode === "editing" && editPhase === "idle";

    return (
        <div style={{
            display: "grid",
            gridTemplateRows: expanded ? "1fr" : "0fr",
            opacity: phase === "entering" ? 0 : 1,
            transition: "grid-template-rows 300ms ease-out, opacity 300ms ease-out",
        }}>
            <div style={{ overflow: phase === "entering" || phase === "collapsing" ? "hidden" : "visible", minHeight: 0 }}>
                <div style={{
                    transform: phase === "exiting" || phase === "collapsing" ? "translateX(-110%)" : "translateX(0)",
                    opacity: phase === "exiting" || phase === "collapsing" ? 0 : 1,
                    transition: "transform 160ms ease-in, opacity 140ms ease-in",
                }}>
                    {/* Single persistent bordered container */}
                    <div className={cx(
                        "rounded-xl border border-secondary bg-primary shadow-xs",
                        task.completed && "opacity-40",
                    )}>
                        {/* View row — always in DOM, animated in/out */}
                        <div style={{
                            display: "grid",
                            gridTemplateRows: viewVisible ? "1fr" : "0fr",
                            transition: "grid-template-rows 300ms ease-out",
                        }}>
                            <div style={{ overflow: "hidden", minHeight: 0 }}>
                                <div style={{ opacity: viewVisible ? 1 : 0, transition: "opacity 200ms ease-out" }}>
                                    <TaskCardView
                                        task={task}
                                        onComplete={handleComplete}
                                        onEdit={handleStartEdit}
                                        onReschedule={handleStartReschedule}
                                        rescheduleRef={rescheduleRef}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Edit form — always in DOM, animated in/out */}
                        <div style={{
                            display: "grid",
                            gridTemplateRows: editVisible ? "1fr" : "0fr",
                            transition: "grid-template-rows 300ms ease-out",
                        }}>
                            <div style={{ overflow: editVisible ? "visible" : "hidden", minHeight: 0 }}>
                                <div style={{ opacity: editVisible ? 1 : 0, transition: "opacity 200ms ease-out" }}
                                    className="p-4 flex flex-col gap-3">
                                    <textarea
                                        value={editDesc}
                                        onChange={e => setEditDesc(e.target.value)}
                                        placeholder="Task description"
                                        rows={2}
                                        className="w-full resize-none rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder shadow-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        {/* Priority */}
                                        <div className="relative flex flex-col gap-1.5">
                                            <label className="text-base font-medium text-secondary">Priority</label>
                                            <button
                                                type="button"
                                                onClick={() => setEditPriorityOpen(o => !o)}
                                                onKeyDown={editPriorityKeyDown}
                                                className="flex w-full items-center justify-between rounded-md border border-primary bg-primary px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                            >
                                                {editPriority ? (
                                                    <span className="flex items-center gap-1.5 text-sm text-primary">
                                                        <span className={cx("size-1.5 rounded-full shrink-0", PRIORITY_OPTIONS.find(p => p.label === editPriority)?.dot)} />
                                                        {editPriority}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-placeholder">Select one</span>
                                                )}
                                                <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform duration-150", editPriorityOpen && "rotate-180")} />
                                            </button>
                                            {editPriorityOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setEditPriorityOpen(false)} />
                                                    <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-secondary bg-primary shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                                                        <div className="py-1">
                                                            {PRIORITY_OPTIONS.map((opt, i) => (
                                                                <div key={opt.label} className="px-1.5 py-px">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => { setEditPriority(opt.label); setEditPriorityOpen(false); }}
                                                                        className={cx(
                                                                            "flex w-full items-center gap-1 rounded-md pl-1.5 pr-2.5 py-2 text-left text-sm font-semibold transition-colors text-secondary",
                                                                            (editPriority === opt.label || i === editPriorityActiveIdx) ? "bg-primary_hover" : "hover:bg-primary_hover",
                                                                        )}
                                                                    >
                                                                        <span className={cx("size-2 rounded-full shrink-0", opt.dot)} />
                                                                        {opt.label}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Due */}
                                        <div className="relative flex flex-col gap-1.5">
                                            <label className="text-base font-medium text-secondary">Due</label>
                                            <button
                                                type="button"
                                                onClick={() => { setEditDueOpen(o => !o); setEditShowDatePicker(false); }}
                                                onKeyDown={editDueKeyDown}
                                                className="flex w-full items-center justify-between rounded-md border border-primary bg-primary px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                            >
                                                <span className={cx("text-sm", editDue ? "text-primary" : "text-placeholder")}>{editDue ?? "Select one"}</span>
                                                <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform duration-150", (editDueOpen || editShowDatePicker) && "rotate-180")} />
                                            </button>
                                            {editDueOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setEditDueOpen(false)} />
                                                    <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-secondary bg-primary shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                                                        <div className="py-1">
                                                            {DUE_OPTIONS.map((opt, i) => (
                                                                <button
                                                                    key={opt}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (opt === "Custom") { setEditDueOpen(false); setEditShowDatePicker(true); }
                                                                        else { setEditDue(opt); setEditDueOpen(false); }
                                                                    }}
                                                                    className={cx(
                                                                        "mx-1.5 flex w-[calc(100%-12px)] items-center rounded-md px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                                                                        (editDue === opt || i === editDueActiveIdx) ? "bg-secondary_subtle text-primary" : "text-secondary hover:bg-secondary_subtle",
                                                                    )}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {editShowDatePicker && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setEditShowDatePicker(false)} />
                                                    <TaskDatePicker
                                                        value={editPickerDate}
                                                        onConfirm={(date) => {
                                                            setEditPickerDate(date);
                                                            setEditDue(formatDueDate(date));
                                                            setEditShowDatePicker(false);
                                                        }}
                                                        onCancel={() => setEditShowDatePicker(false)}
                                                        className="absolute top-full left-0 z-20 mt-1 shadow-xl slide-in-from-top-1"
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {/* Assignee */}
                                        <div className="relative flex flex-col gap-1.5">
                                            <label className="text-base font-medium text-secondary">Assignee</label>
                                            <button
                                                type="button"
                                                onClick={() => setEditAssigneeOpen(o => !o)}
                                                onKeyDown={editAssigneeKeyDown}
                                                className="flex w-full items-center justify-between rounded-md border border-primary bg-primary px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                            >
                                                {editAssignee === "me" ? (
                                                    <span className="text-sm text-primary">Me</span>
                                                ) : editAssignee ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <img src={ASSIGNEE_OPTIONS.find(o => o.value === editAssignee)?.avatar} className="size-5 rounded-full object-cover" alt="" />
                                                        <span className="text-sm text-primary">{ASSIGNEE_OPTIONS.find(o => o.value === editAssignee)?.label}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-placeholder">Select one</span>
                                                )}
                                                <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform duration-150", editAssigneeOpen && "rotate-180")} />
                                            </button>
                                            {editAssigneeOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setEditAssigneeOpen(false)} />
                                                    <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-secondary bg-primary shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                                                        <div className="py-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setEditAssignee("me"); setEditAssigneeOpen(false); }}
                                                                className={cx(
                                                                    "mx-1.5 flex w-[calc(100%-12px)] items-center rounded-md px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                                                                    (editAssignee === "me" || editAssigneeActiveIdx === 0) ? "bg-secondary_subtle text-primary" : "text-secondary hover:bg-secondary_subtle",
                                                                )}
                                                            >
                                                                Me
                                                            </button>
                                                            <div className="my-1 border-t border-secondary" />
                                                            {ASSIGNEE_OPTIONS.map((opt, i) => (
                                                                <button
                                                                    key={opt.value}
                                                                    type="button"
                                                                    onClick={() => { setEditAssignee(opt.value); setEditAssigneeOpen(false); }}
                                                                    className={cx(
                                                                        "mx-1.5 flex w-[calc(100%-12px)] items-center gap-1.5 rounded-md px-1 py-1.5 text-left text-sm font-semibold transition-colors",
                                                                        (editAssignee === opt.value || editAssigneeActiveIdx === i + 1) ? "bg-secondary_subtle" : "hover:bg-secondary_subtle",
                                                                    )}
                                                                >
                                                                    <img src={opt.avatar} className="size-6 rounded-full object-cover shrink-0" alt="" />
                                                                    <span className="text-secondary">{opt.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button color="secondary" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                                        <Button color="primary" size="sm" isDisabled={!editDesc.trim()} onClick={handleSaveEdit}>Save</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {mode === "rescheduling" && createPortal(
                        <>
                            <div className="fixed inset-0 z-[55]" onClick={() => setMode("view")} />
                            <div style={{ position: "fixed", top: reschedulePickerPos?.top ?? 100, left: reschedulePickerPos?.left ?? 100, zIndex: 56 }}>
                                <TaskDatePicker
                                    value={reschedulePickerDate}
                                    onConfirm={(date) => {
                                        setReschedulePickerDate(date);
                                        onUpdate({ due: formatDueDate(date) });
                                        setMode("view");
                                    }}
                                    onCancel={() => setMode("view")}
                                    className="shadow-xl slide-in-from-top-1"
                                />
                            </div>
                        </>,
                        document.body,
                    )}
                </div>
            </div>
        </div>
    );
};

const DUE_OPTIONS = ["Today", "Tomorrow", "3 days", "Custom"] as const;

const formatDueDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const TaskDatePicker = ({
    value,
    onConfirm,
    onCancel,
    className,
}: {
    value: Date | null;
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    className?: string;
}) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [selected, setSelected] = useState<Date | null>(value);
    const [viewMonth, setViewMonth] = useState(value ?? today);

    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date: Date; outOfMonth: boolean }[] = [];
    for (let i = 0; i < startOffset; i++) {
        cells.push({ date: new Date(year, month, i - startOffset + 1), outOfMonth: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        cells.push({ date: new Date(year, month, i), outOfMonth: false });
    }
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        cells.push({ date: new Date(year, month + 1, i), outOfMonth: true });
    }

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
        <div className={cx("w-72 rounded-xl border border-secondary bg-primary animate-in fade-in duration-150", className)}>
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <button
                    type="button"
                    onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                    className="flex size-8 items-center justify-center rounded-md text-secondary hover:bg-secondary_subtle"
                >
                    <ChevronLeft className="size-4" />
                </button>
                <span className="text-sm font-semibold text-primary">{monthLabel}</span>
                <button
                    type="button"
                    onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                    className="flex size-8 items-center justify-center rounded-md text-secondary hover:bg-secondary_subtle"
                >
                    <ChevronRight className="size-4" />
                </button>
            </div>

            <div className="flex items-center gap-2 px-3 pb-2">
                <div className="flex min-h-[34px] flex-1 items-center rounded-md border border-primary px-2.5 py-1.5 text-sm">
                    {selected
                        ? <span className="text-primary">{formatDueDate(selected)}</span>
                        : <span className="text-placeholder">Select a date</span>
                    }
                </div>
                <button
                    type="button"
                    onClick={() => { const t = new Date(); t.setHours(0, 0, 0, 0); setSelected(t); setViewMonth(t); }}
                    className="shrink-0 rounded-md border border-primary px-2.5 py-1.5 text-sm font-semibold text-secondary hover:bg-secondary_subtle"
                >
                    Today
                </button>
            </div>

            <div className="grid grid-cols-7 px-2 pb-1">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                    <div key={d} className="flex h-8 items-center justify-center text-xs font-medium text-tertiary">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 px-2 pb-2">
                {cells.map((cell, i) => {
                    const isToday = isSameDay(cell.date, today);
                    const isSelected = selected ? isSameDay(cell.date, selected) : false;
                    const isPast = cell.date < today;
                    const isDisabled = isPast || cell.outOfMonth;
                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setSelected(new Date(cell.date))}
                            className={cx(
                                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                                isDisabled
                                    ? "text-disabled cursor-not-allowed"
                                    : isSelected
                                        ? "bg-brand-solid text-white"
                                        : isToday
                                            ? "bg-active text-primary"
                                            : "text-secondary hover:bg-secondary_subtle",
                            )}
                        >
                            {cell.date.getDate()}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-secondary px-3 py-2.5">
                <Button color="secondary" size="sm" onClick={onCancel}>Cancel</Button>
                <Button
                    color="primary"
                    size="sm"
                    isDisabled={!selected}
                    onClick={() => selected && onConfirm(selected)}
                >
                    Set due date
                </Button>
            </div>
        </div>
    );
};

const LeadOverlay = ({
    lead,
    leadIndex,
    totalLeads,
    isClosing,
    onClose,
    onPrev,
    onNext,
    initialTasks = [],
    onTasksChange,
    hideNewTask = false,
    relatedTaskRows = [],
    currentTaskId,
    initialRelatedTasks,
    onRelatedTasksChange,
}: {
    lead: LeadRow;
    leadIndex: number;
    totalLeads: number;
    isClosing?: boolean;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    initialTasks?: OverlayTask[];
    onTasksChange?: (tasks: OverlayTask[]) => void;
    hideNewTask?: boolean;
    relatedTaskRows?: { id: string; task: string; priority: string; due: string; assignee: string }[];
    currentTaskId?: string;
    initialRelatedTasks?: OverlayTask[];
    onRelatedTasksChange?: (tasks: OverlayTask[]) => void;
}) => {
    const [activeTab, setActiveTab] = useState<OverlayTab>("contact");
    const [noteText, setNoteText] = useState("");
    const [localNotes, setLocalNotes] = useState<ActivityEntry[]>([]);
    const activityScrollRef = useRef<HTMLDivElement>(null);
    const [taskDesc, setTaskDesc] = useState("");
    const [tasks, setTasks] = useState<OverlayTask[]>(initialTasks);
    const [relatedTasks, setRelatedTasks] = useState<OverlayTask[]>(() =>
        initialRelatedTasks
            ? initialRelatedTasks.map(t => ({ ...t, originalId: t.originalId ?? String(t.id) }))
            : relatedTaskRows.map((t, i) => ({
                id: -(i + 1),
                originalId: t.id,
                desc: t.task,
                priority: t.priority,
                due: t.due,
                assignee: t.assignee,
                completed: false,
            }))
    );
    const nextTaskId = useRef(initialTasks.length > 0 ? Math.max(...initialTasks.map(t => t.id)) + 1 : 0);
    const currentTaskCompleted = currentTaskId
        ? relatedTasks.some(t => t.originalId === currentTaskId && t.completed)
        : false;

    const onRelatedTasksChangeRef = useRef(onRelatedTasksChange);
    useEffect(() => { onRelatedTasksChangeRef.current = onRelatedTasksChange; }, [onRelatedTasksChange]);
    useEffect(() => { onRelatedTasksChangeRef.current?.(relatedTasks); }, [relatedTasks]);

    const updateTasks = (next: OverlayTask[]) => {
        setTasks(next);
        onTasksChange?.(next);
    };
    const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
    const [activityDropdownOpen, setActivityDropdownOpen] = useState(false);
    const [priorityValue, setPriorityValue] = useState<string | null>(null);
    const [priorityOpen, setPriorityOpen] = useState(false);
    const [dueValue, setDueValue] = useState<string | null>(null);
    const [dueOpen, setDueOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerDate, setPickerDate] = useState<Date | null>(null);
    const [assigneeValue, setAssigneeValue] = useState<string | null>(null);
    const [assigneeOpen, setAssigneeOpen] = useState(false);

    const ASSIGNEE_ALL = ["me", ...ASSIGNEE_OPTIONS.map(o => o.value)] as const;

    const { activeIndex: priorityActiveIdx, handleKeyDown: priorityKeyDown } = useDropdownKeyNav(
        PRIORITY_OPTIONS.length, priorityOpen,
        (i) => { setPriorityValue(PRIORITY_OPTIONS[i].label); setPriorityOpen(false); },
        () => setPriorityOpen(false),
    );
    const { activeIndex: dueActiveIdx, handleKeyDown: dueKeyDown } = useDropdownKeyNav(
        DUE_OPTIONS.length, dueOpen,
        (i) => {
            if (DUE_OPTIONS[i] === "Custom") {
                setDueOpen(false);
                setShowDatePicker(true);
            } else {
                setDueValue(DUE_OPTIONS[i]);
                setDueOpen(false);
            }
        },
        () => setDueOpen(false),
    );
    const { activeIndex: assigneeActiveIdx, handleKeyDown: assigneeKeyDown } = useDropdownKeyNav(
        ASSIGNEE_ALL.length, assigneeOpen,
        (i) => { setAssigneeValue(ASSIGNEE_ALL[i]); setAssigneeOpen(false); },
        () => setAssigneeOpen(false),
    );

    const [showFlagOptions, setShowFlagOptions] = useState(false);
    const [checkedFlags, setCheckedFlags] = useState<Set<string>>(new Set());

    useEffect(() => {
        setShowFlagOptions(false);
        setCheckedFlags(new Set());
    }, [lead.id]);

    const toggleFlag = (label: string) => {
        setCheckedFlags(prev => {
            const next = new Set(prev);
            next.has(label) ? next.delete(label) : next.add(label);
            return next;
        });
    };

    const [showTips, setShowTips] = useState(true);
    const [titleAnimKey, setTitleAnimKey] = useState(0);
    const [titleDir, setTitleDir] = useState<"prev" | "next">("next");
    const [titleExiting, setTitleExiting] = useState(false);
    const [contentAnimKey, setContentAnimKey] = useState(0);
    const [contentExiting, setContentExiting] = useState(false);

    const navigateLead = (dir: "prev" | "next") => {
        setTitleDir(dir);
        setTitleExiting(true);
        setContentExiting(true);
        setTimeout(() => {
            dir === "next" ? onNext() : onPrev();
            setTitleExiting(false);
            setContentExiting(false);
            setTitleAnimKey(k => k + 1);
            setContentAnimKey(k => k + 1);
        }, 120);
    };
    const [addressValue, setAddressValue] = useState("");
    const [addressSearchText, setAddressSearchText] = useState("");
    const [addressSearching, setAddressSearching] = useState(false);
    const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);
    const addressSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const addressInputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (addressInputRef.current && !addressInputRef.current.contains(e.target as Node)) {
                setAddressDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleAddressSearchChange = (value: string) => {
        setAddressSearchText(value);
        if (addressSearchTimeout.current) clearTimeout(addressSearchTimeout.current);
        if (value.length > 0) {
            setAddressSearching(true);
            setAddressDropdownOpen(true);
            addressSearchTimeout.current = setTimeout(() => setAddressSearching(false), 1000);
        } else {
            setAddressSearching(false);
            setAddressDropdownOpen(false);
        }
    };

    const handleAddressSelect = (addr: typeof STATIC_ADDRESSES[number]) => {
        setAddressValue(addr.address);
        setAddressSearchText(addr.address);
        setAddressDropdownOpen(false);
        setAddressSearching(false);
    };

    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    useLayoutEffect(() => {
        const idx = OVERLAY_TABS.findIndex(t => t.key === activeTab);
        const el = tabRefs.current[idx];
        if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }, [activeTab]);

    const leadActivities = [...(LEAD_ACTIVITIES[lead.id] ?? []), ...localNotes];
    const filteredActivity = activityFilter === "all"
        ? leadActivities
        : leadActivities.filter(e => e.type === activityFilter);

    useEffect(() => {
        if (activeTab === "playbook") setActivityFilter("playbook");
    }, [activeTab]);

    useEffect(() => {
        const el = activityScrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [filteredActivity.length, activityFilter]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") { onClose(); return; }
            const tag = (e.target as HTMLElement).tagName;
            const isEditing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable;
            if (!isEditing) {
                if (e.key === "ArrowLeft" && leadIndex > 0) navigateLead("prev");
                if (e.key === "ArrowRight" && leadIndex < totalLeads - 1) navigateLead("next");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, leadIndex, totalLeads]); // navigateLead omitted — stable setters inside

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    return (
        <div className={cx("fixed inset-0 z-50", isClosing && "animate-out fade-out duration-150 fill-mode-forwards")}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in ease-out duration-300" onClick={onClose} />

            {/* Positioning layer – 24px top, flush bottom, horizontally centred */}
            <div className="absolute inset-0 flex justify-center pt-6 pointer-events-none">
                <div
                    className="relative flex w-3/4 min-w-[1200px] flex-col rounded-t-2xl bg-primary shadow-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-bottom ease-out duration-300"
                    style={{ height: "calc(100vh - 24px)" }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="shrink-0 p-3">
                        <div className="flex items-center gap-4 rounded-xl border border-secondary bg-secondary_subtle px-4 py-3 shadow-xs">
                            <Button color="secondary" size="md" iconLeading={ArrowLeft} onClick={() => navigateLead("prev")} isDisabled={leadIndex === 0} className="shrink-0" />
                            <div
                                key={titleAnimKey}
                                className={cx(
                                    "flex min-w-0 flex-1 items-center gap-2 transition-[opacity,transform] ease-in",
                                    titleExiting
                                        ? cx("duration-[120ms] opacity-0", titleDir === "next" ? "-translate-x-3" : "translate-x-3")
                                        : cx("duration-200 ease-out animate-in fade-in", titleDir === "next" ? "slide-in-from-right-3" : "slide-in-from-left-3"),
                                )}
                            >
                                <span className="truncate text-lg font-semibold text-primary">{lead.name}</span>
                                {lead.priority && <Badge type="pill-color" color="brand" size="sm">New</Badge>}
                                {lead.company && (
                                    <>
                                        <span className="size-1.5 shrink-0 rounded-full bg-fg-quaternary" />
                                        <span className="truncate text-lg text-tertiary">{lead.company}</span>
                                    </>
                                )}
                            </div>
                            <span className="shrink-0 text-base text-tertiary">{leadIndex + 1}/{totalLeads}</span>
                            <Button color="secondary" size="md" iconLeading={ArrowRight} onClick={() => navigateLead("next")} isDisabled={leadIndex === totalLeads - 1} className="shrink-0" />
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Left panel */}
                        <div className="flex flex-1 flex-col overflow-y-auto min-w-0">
                            {/* New task */}
                            {(!hideNewTask || currentTaskCompleted) && <div className="shrink-0 p-3">
                                <div className="flex flex-col rounded-xl border border-secondary bg-secondary_subtle shadow-xs">
                                    <div className="px-5 pt-3 pb-2">
                                        <p className="text-sm font-semibold text-primary">New task</p>
                                    </div>
                                    <div className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary px-5 pt-5 pb-6">
                                        <textarea
                                            placeholder="Task Description"
                                            value={taskDesc}
                                            onChange={e => setTaskDesc(e.target.value)}
                                            rows={3}
                                            className="w-full resize-none rounded-md border border-primary bg-primary px-3.5 py-3 text-sm text-primary placeholder:text-placeholder shadow-xs outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                        />
                                        <div className="flex gap-3">
                                            {/* Priority */}
                                            <div className="relative flex flex-1 flex-col gap-1.5">
                                                <label className="text-base font-medium text-secondary">Priority</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setPriorityOpen(o => !o)}
                                                    onKeyDown={priorityKeyDown}
                                                    className="flex w-full items-center justify-between rounded-md border border-primary bg-primary px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                                >
                                                    {priorityValue ? (
                                                        <span className="flex items-center gap-1.5 text-sm text-primary">
                                                            <span className={cx("size-1.5 rounded-full shrink-0", PRIORITY_OPTIONS.find(p => p.label === priorityValue)?.dot)} />
                                                            {priorityValue}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-placeholder">Select one</span>
                                                    )}
                                                    <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform duration-150", priorityOpen && "rotate-180")} />
                                                </button>
                                                {priorityOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setPriorityOpen(false)} />
                                                        <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-secondary bg-primary shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03),0px_2px_2px_-1px_rgba(10,13,18,0.04)] animate-in fade-in slide-in-from-top-1 duration-150">
                                                            <div className="py-1">
                                                                {PRIORITY_OPTIONS.map((opt, i) => (
                                                                    <div key={opt.label} className="px-1.5 py-px">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { setPriorityValue(opt.label); setPriorityOpen(false); }}
                                                                            className={cx(
                                                                                "flex w-full items-center gap-1 rounded-md pl-1.5 pr-2.5 py-2 text-left text-sm font-semibold transition-colors text-secondary",
                                                                                (priorityValue === opt.label || i === priorityActiveIdx) ? "bg-primary_hover" : "hover:bg-primary_hover",
                                                                            )}
                                                                        >
                                                                            <span className={cx("size-2 rounded-full shrink-0", opt.dot)} />
                                                                            {opt.label}
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Due */}
                                            <div className="relative flex flex-1 flex-col gap-1.5">
                                                <label className="text-base font-medium text-secondary">Due</label>
                                                <button
                                                    type="button"
                                                    onClick={() => { setDueOpen(o => !o); setShowDatePicker(false); }}
                                                    onKeyDown={dueKeyDown}
                                                    className="flex w-full items-center justify-between rounded-md border border-primary bg-primary px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                                >
                                                    <span className={cx("text-sm", dueValue ? "text-primary" : "text-placeholder")}>{dueValue ?? "Select one"}</span>
                                                    <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform duration-150", (dueOpen || showDatePicker) && "rotate-180")} />
                                                </button>
                                                {dueOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setDueOpen(false)} />
                                                        <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-secondary bg-primary shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                                                            <div className="py-1">
                                                                {DUE_OPTIONS.map((opt, i) => (
                                                                    <button
                                                                        key={opt}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (opt === "Custom") {
                                                                                setDueOpen(false);
                                                                                setShowDatePicker(true);
                                                                            } else {
                                                                                setDueValue(opt);
                                                                                setDueOpen(false);
                                                                            }
                                                                        }}
                                                                        className={cx(
                                                                            "mx-1.5 flex w-[calc(100%-12px)] items-center rounded-md px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                                                                            (dueValue === opt || i === dueActiveIdx) ? "bg-secondary_subtle text-primary" : "text-secondary hover:bg-secondary_subtle",
                                                                        )}
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                                {showDatePicker && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setShowDatePicker(false)} />
                                                        <TaskDatePicker
                                                            value={pickerDate}
                                                            onConfirm={(date) => {
                                                                setPickerDate(date);
                                                                setDueValue(formatDueDate(date));
                                                                setShowDatePicker(false);
                                                            }}
                                                            onCancel={() => setShowDatePicker(false)}
                                                            className="absolute top-full left-0 z-20 mt-1 shadow-xl slide-in-from-top-1"
                                                        />
                                                    </>
                                                )}
                                            </div>

                                            {/* Assignee */}
                                            <div className="relative flex flex-1 flex-col gap-1.5">
                                                <label className="text-base font-medium text-secondary">Assignee</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setAssigneeOpen(o => !o)}
                                                    onKeyDown={assigneeKeyDown}
                                                    className="flex w-full items-center justify-between rounded-md border border-primary bg-primary px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                                >
                                                    {assigneeValue === "me" ? (
                                                        <span className="text-sm text-primary">Me</span>
                                                    ) : assigneeValue ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <img src={ASSIGNEE_OPTIONS.find(o => o.value === assigneeValue)?.avatar} className="size-5 rounded-full object-cover" alt="" />
                                                            <span className="text-sm text-primary">{ASSIGNEE_OPTIONS.find(o => o.value === assigneeValue)?.label}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-placeholder">Select one</span>
                                                    )}
                                                    <ChevronDown className={cx("size-4 text-fg-quaternary transition-transform duration-150", assigneeOpen && "rotate-180")} />
                                                </button>
                                                {assigneeOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setAssigneeOpen(false)} />
                                                        <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-secondary bg-primary shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                                                            <div className="py-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setAssigneeValue("me"); setAssigneeOpen(false); }}
                                                                    className={cx(
                                                                        "mx-1.5 flex w-[calc(100%-12px)] items-center rounded-md px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                                                                        (assigneeValue === "me" || assigneeActiveIdx === 0) ? "bg-secondary_subtle text-primary" : "text-secondary hover:bg-secondary_subtle",
                                                                    )}
                                                                >
                                                                    Me
                                                                </button>
                                                                <div className="my-1 border-t border-secondary" />
                                                                {ASSIGNEE_OPTIONS.map((opt, i) => (
                                                                    <button
                                                                        key={opt.value}
                                                                        type="button"
                                                                        onClick={() => { setAssigneeValue(opt.value); setAssigneeOpen(false); }}
                                                                        className={cx(
                                                                            "mx-1.5 flex w-[calc(100%-12px)] items-center gap-1.5 rounded-md px-1 py-1.5 text-left text-sm font-semibold transition-colors",
                                                                            (assigneeValue === opt.value || assigneeActiveIdx === i + 1) ? "bg-secondary_subtle" : "hover:bg-secondary_subtle",
                                                                        )}
                                                                    >
                                                                        <img src={opt.avatar} className="size-6 rounded-full object-cover shrink-0" alt="" />
                                                                        <span className="text-secondary">{opt.label}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end pl-4 pr-2 py-2">
                                        <Button
                                            color="primary"
                                            size="sm"
                                            isDisabled={!taskDesc.trim() || !priorityValue || !dueValue || !assigneeValue}
                                            onClick={() => {
                                                if (!taskDesc.trim()) return;
                                                updateTasks([...tasks, {
                                                    id: nextTaskId.current++,
                                                    desc: taskDesc.trim(),
                                                    priority: priorityValue,
                                                    due: dueValue,
                                                    assignee: assigneeValue,
                                                    completed: false,
                                                }]);
                                                setTaskDesc("");
                                                setPriorityValue(null);
                                                setDueValue(null);
                                                setPickerDate(null);
                                                setAssigneeValue(null);
                                            }}
                                        >
                                            Create task
                                        </Button>
                                    </div>
                                </div>
                                {tasks.filter(t => !t.completed).length > 0 && (
                                    <div className="flex flex-col gap-2 mt-4 overflow-hidden">
                                        {tasks.filter(t => !t.completed).map(task => (
                                            <AnimatedTaskCard
                                                key={task.id}
                                                task={task}
                                                onComplete={() => updateTasks(tasks.map(t => t.id === task.id ? { ...t, completed: true } : t))}
                                                onRemove={() => updateTasks(tasks.filter(t => t.id !== task.id))}
                                                onUpdate={(updates) => updateTasks(tasks.map(t => t.id === task.id ? { ...t, ...updates } : t))}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>}

                            {/* Tasks view — related tasks + lead summary */}
                            {hideNewTask && (
                                <div className="shrink-0 flex flex-col gap-3 p-3 pb-0">
                                    {/* Related tasks */}
                                    {relatedTasks.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            <p className="px-2 text-sm font-semibold text-primary">Tasks</p>
                                            <div className="flex flex-col gap-2">
                                                {relatedTasks.map(task => (
                                                    <AnimatedTaskCard
                                                        key={task.id}
                                                        task={task}
                                                        onComplete={() => setRelatedTasks(ts => ts.map(t => t.id === task.id ? { ...t, completed: true } : t))}
                                                        onRemove={() => setRelatedTasks(ts => ts.filter(t => t.id !== task.id))}
                                                        onUpdate={updates => setRelatedTasks(ts => ts.map(t => t.id === task.id ? { ...t, ...updates } : t))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Lead quick summary */}
                                    <div className="flex flex-col gap-0.5 rounded-xl bg-secondary_subtle shadow-xs">
                                        <div className="rounded-xl border border-secondary bg-primary px-5 pt-5 pb-6 shadow-xs">
                                            <div className="flex flex-wrap gap-x-3 gap-y-4 px-1">
                                                <div className="flex min-w-0 basis-[calc(50%-6px)] flex-col gap-0.5">
                                                    <span className="text-sm text-tertiary">Contact name</span>
                                                    <span className="text-md font-semibold text-secondary truncate">{lead.name}</span>
                                                </div>
                                                <div className="flex min-w-0 basis-[calc(50%-6px)] flex-col gap-0.5">
                                                    <span className="text-sm text-tertiary">Company name</span>
                                                    <span className="text-md font-semibold text-secondary truncate">{lead.company || "—"}</span>
                                                </div>
                                                <div className="flex min-w-0 basis-[calc(50%-6px)] flex-col gap-0.5">
                                                    <span className="text-sm text-tertiary">Last call</span>
                                                    <span className="text-md font-semibold text-secondary truncate">{lead.callStatus || "—"}</span>
                                                </div>
                                                <div className="flex min-w-0 basis-[calc(50%-6px)] flex-col gap-0.5">
                                                    <span className="text-sm text-tertiary">Assignee</span>
                                                    <span className="text-md font-semibold text-secondary truncate">{lead.assignee || "—"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-3 px-4 py-2">
                                            <a
                                                href="https://hubspot.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Open in HubSpot"
                                                className="flex cursor-pointer items-center justify-center rounded-md border border-secondary bg-primary p-2 shadow-xs transition hover:bg-primary_hover"
                                            >
                                                <Share05 className="size-4 text-fg-quaternary" />
                                            </a>
                                            <a
                                                href="https://onedrive.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Go to folder"
                                                className="flex cursor-pointer items-center justify-center rounded-md border border-secondary bg-primary p-2 shadow-xs transition hover:bg-primary_hover"
                                            >
                                                <Folder className="size-4 text-fg-quaternary" />
                                            </a>
                                            <a
                                                href={`mailto:${lead.name.toLowerCase().replace(/\s+/g, ".")}@example.com`}
                                                title="Send email"
                                                className="flex cursor-pointer items-center justify-center rounded-md border border-secondary bg-primary p-2 shadow-xs transition hover:bg-primary_hover"
                                            >
                                                <Mail05 className="size-4 text-fg-quaternary" />
                                            </a>
                                            <a
                                                href={`tel:${lead.phone}`}
                                                title="Call"
                                                className="flex cursor-pointer items-center justify-center rounded-md border border-secondary bg-primary p-2 shadow-xs transition hover:bg-primary_hover"
                                            >
                                                <PhoneCall01 className="size-4 text-fg-quaternary" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="relative shrink-0 flex border-b border-secondary px-5 pt-4">
                                {OVERLAY_TABS.map(({ key, label }, i) => (
                                    <button
                                        key={key}
                                        ref={el => { tabRefs.current[i] = el; }}
                                        type="button"
                                        onClick={() => setActiveTab(key)}
                                        className={cx(
                                            "mr-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-150",
                                            activeTab === key ? "text-brand-700" : "text-tertiary hover:text-secondary",
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                                <div
                                    className="absolute bottom-0 h-0.5 bg-brand-700"
                                    style={{
                                        left: indicator.left,
                                        width: indicator.width,
                                        transition: "left 200ms ease-in-out, width 200ms ease-in-out",
                                    }}
                                />
                            </div>

                            {/* Tab content */}
                            <div className="px-5 pt-4 pb-5">
                                {activeTab === "contact" ? (
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        <OverlayField label="First name" value={LEAD_CONTACT_DETAILS[lead.id]?.firstName} placeholder="First name" animKey={contentAnimKey} exiting={contentExiting} />
                                        <OverlayField label="Last name" value={LEAD_CONTACT_DETAILS[lead.id]?.lastName} placeholder="Last name" animKey={contentAnimKey} exiting={contentExiting} />
                                        <OverlayFieldWithAction label="Phone number" value={lead.phone} actionIcon={PhoneCall01} href={lead.phone ? `tel:${lead.phone.replace(/\s/g, "")}` : undefined} animKey={contentAnimKey} exiting={contentExiting} />
                                        <OverlayFieldWithAction label="Email address" value={LEAD_CONTACT_DETAILS[lead.id]?.email} placeholder="email@example.com" actionIcon={Mail01} href={LEAD_CONTACT_DETAILS[lead.id]?.email ? `mailto:${LEAD_CONTACT_DETAILS[lead.id].email}` : undefined} animKey={contentAnimKey} exiting={contentExiting} />
                                        <OverlayField label="Date of Birth" value={LEAD_CONTACT_DETAILS[lead.id]?.dob} placeholder="DD/MM/YYYY" animKey={contentAnimKey} exiting={contentExiting} />
                                        <OverlayField label="Job title" value={LEAD_CONTACT_DETAILS[lead.id]?.jobTitle} placeholder="Director, CTO, Owner etc" animKey={contentAnimKey} exiting={contentExiting} />
                                        <div className="col-span-2 flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-secondary">Current address</label>
                                            <div ref={addressInputRef} className="relative">
                                                <div className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
                                                    <SearchLg className="size-4 shrink-0 text-fg-quaternary" />
                                                    <input
                                                        type="text"
                                                        placeholder="Start typing to search"
                                                        value={addressSearchText}
                                                        onChange={e => handleAddressSearchChange(e.target.value)}
                                                        className="flex-1 bg-transparent text-sm text-primary placeholder:text-placeholder outline-none"
                                                    />
                                                </div>
                                                {addressDropdownOpen && (
                                                    <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-secondary bg-primary py-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                                                        {addressSearching ? (
                                                            <div className="px-3.5 py-2 text-sm text-quaternary">Searching for addresses…</div>
                                                        ) : (
                                                            STATIC_ADDRESSES.map(addr => {
                                                                const isSelected = addressValue === addr.address;
                                                                return (
                                                                    <div key={addr.id} className="px-1.5 py-px">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleAddressSelect(addr)}
                                                                            className={cx(
                                                                                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-secondary_subtle",
                                                                                isSelected && "bg-secondary_subtle",
                                                                            )}
                                                                        >
                                                                            <span className="flex-1 text-primary">{addr.address}</span>
                                                                            {isSelected && <Check className="size-4 shrink-0 text-fg-brand-primary" />}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <OverlayField label="Moved in" placeholder="MM/YYYY" />
                                        <PlaybookSelect label="Home Ownership" options={["Yes", "No"]} />
                                    </div>
                                ) : activeTab === "playbook" ? (
                                    <div className="flex flex-col gap-6">
                                        {/* Tip banner – always visible */}
                                        <div className="flex gap-4 rounded-xl border border-brand-200 bg-brand-primary p-4 shadow-xs">
                                            <div className="relative size-5 shrink-0 mt-0.5">
                                                <div className="absolute inset-[-20%] rounded-full border-2 border-brand-600 opacity-30" />
                                                <div className="absolute inset-[-45%] rounded-full border-2 border-brand-600 opacity-10" />
                                                <InfoCircle className="size-5 text-brand-600" />
                                            </div>
                                            <div className="flex flex-1 flex-col gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-sm font-semibold text-primary">Alex, use this playbook to help guide your enquiry call with {lead.name}.</p>
                                                    <p className="text-sm text-secondary">Remember — don't just read out questions and expect the lead to engage with you. If you fail to show value and competency they won't want to work with you.</p>
                                                </div>
                                                <Button
                                                    color="link-color"
                                                    size="sm"
                                                    iconTrailing={showTips ? EyeOff : Eye}
                                                    onClick={() => setShowTips(v => !v)}
                                                >
                                                    {showTips ? "Hide Tips" : "Show Tips"}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Section 1 – Listen & Build Rapport */}
                                        <div className="flex flex-col gap-4">
                                            <h3 className="text-lg font-semibold text-primary">Listen &amp; Build Rapport</h3>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium text-secondary">What does the business do / how do they make money?</label>
                                                <textarea
                                                    placeholder="Describe the business"
                                                    rows={3}
                                                    className="w-full resize-none rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder shadow-xs outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                                />
                                            </div>

                                            {showTips && (
                                                <div className="flex gap-3 rounded-lg border border-brand-200 bg-brand-primary px-3.5 py-3">
                                                    <div className="relative size-4 shrink-0 mt-0.5">
                                                        <div className="absolute inset-[-20%] rounded-full border border-brand-600 opacity-30" />
                                                        <div className="absolute inset-[-45%] rounded-full border border-brand-600 opacity-10" />
                                                        <InfoCircle className="size-4 text-brand-600" />
                                                    </div>
                                                    <p className="text-sm text-secondary">Remember — don't just read out questions. Have a natural conversation and fill this in as you go.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Section 2 – Opportunity Spotting */}
                                        <div className="flex flex-col gap-4">
                                            <h3 className="text-lg font-semibold text-primary">Opportunity Spotting</h3>

                                            <PlaybookSelect
                                                label="What will the loan be used for?"
                                                hint="Updates contact property (Purpose of finance)"
                                                options={["Working capital", "Equipment", "Growth / expansion", "Refinance", "Tax bill", "Other"]}
                                            />

                                            <PlaybookSelect
                                                label="How fast do they need the loan?"
                                                hint="Updates contact property (When do you want the loan?)"
                                                options={["ASAP", "Within a week", "Within a month", "No rush"]}
                                            />

                                            {showTips && (
                                                <div className="flex gap-3 rounded-lg border border-brand-200 bg-brand-primary px-3.5 py-3">
                                                    <div className="relative size-4 shrink-0 mt-0.5">
                                                        <div className="absolute inset-[-20%] rounded-full border border-brand-600 opacity-30" />
                                                        <div className="absolute inset-[-45%] rounded-full border border-brand-600 opacity-10" />
                                                        <InfoCircle className="size-4 text-brand-600" />
                                                    </div>
                                                    <p className="text-sm text-secondary">If they say they need it quickly, reassure them that you can move fast once you have the right information.</p>
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium text-secondary">What is the expected close date of this enquiry?</label>
                                                <input
                                                    type="text"
                                                    placeholder="DD/MM/YYYY"
                                                    className="w-full rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder shadow-xs outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                                />
                                                <p className="text-xs text-tertiary">Updates contact property (Close Date)</p>
                                            </div>

                                            {showTips && (
                                                <div className="flex gap-3 rounded-lg border border-brand-200 bg-brand-primary px-3.5 py-3">
                                                    <div className="relative size-4 shrink-0 mt-0.5">
                                                        <div className="absolute inset-[-20%] rounded-full border border-brand-600 opacity-30" />
                                                        <div className="absolute inset-[-45%] rounded-full border border-brand-600 opacity-10" />
                                                        <InfoCircle className="size-4 text-brand-600" />
                                                    </div>
                                                    <p className="text-sm text-secondary">This can be determined based on when the customer expects to need the funds and how quickly their paperwork is ready.</p>
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium text-secondary">How long will it take to make the money back? (if applicable)</label>
                                                <textarea
                                                    placeholder="Enter ROI timeframe"
                                                    rows={3}
                                                    className="w-full resize-none rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder shadow-xs outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                                />
                                            </div>
                                        </div>

                                        {/* Section 3 – Vet the Lead */}
                                        <div className="flex flex-col gap-4">
                                            <h3 className="text-lg font-semibold text-primary">Vet the Lead</h3>

                                            <PlaybookSelect
                                                label="What industry are they in?"
                                                hint="Updates company property (Industry)"
                                                options={["Retail", "Hospitality", "Construction", "Professional services", "Manufacturing", "Technology", "Other"]}
                                            />

                                            <PlaybookSelect
                                                label="How long have they been trading?"
                                                hint="Updates company property (Year Trading)"
                                                options={["Less than 1 year", "1–2 years", "2–5 years", "5–10 years", "10+ years"]}
                                            />

                                            <PlaybookSelect
                                                label="What does the prospect turnover?"
                                                hint="Updates company property (Annual Turnover)"
                                                options={["Under £100k", "£100k–£250k", "£250k–£500k", "£500k–£1m", "£1m–£5m", "£5m+"]}
                                            />

                                            <PlaybookSelect
                                                label="Is the prospect a homeowner?"
                                                hint="Updates contact property (Are you or any director a UK homeowner?)"
                                                options={["Yes", "No", "Unknown"]}
                                            />

                                            <PlaybookSelect
                                                label="How would the prospect describe their personal credit?"
                                                hint="Updates contact property (Personal credit)"
                                                options={["Excellent", "Good", "Fair", "Poor", "Unknown"]}
                                            />

                                            <PlaybookSelect
                                                label="Are they profitable?"
                                                hint="Updates company property (Profitable?)"
                                                options={["Yes", "No", "Break even", "Unknown"]}
                                            />

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium text-secondary">Loan history</label>
                                                <textarea
                                                    placeholder="Any existing lending, outstanding balances, lenders used etc..."
                                                    rows={3}
                                                    className="w-full resize-none rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder shadow-xs outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-medium text-secondary">What is their overdraft limit?</label>
                                                <textarea
                                                    placeholder="Eg. £5000"
                                                    rows={2}
                                                    className="w-full resize-none rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-placeholder shadow-xs outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                                />
                                                <p className="text-xs text-tertiary">Updates contact property (Overdraft Limit)</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeTab === "contacts" ? (
                                    <div className="flex flex-wrap gap-4">
                                        {[
                                            { name: "Laura Davis",   email: "laura.davies.personal@gmail.com", phone: "+44 7700 900123" },
                                            { name: "Ethan Carter",  email: "ethan.carter123@mail.com",        phone: "+44 7700 900456" },
                                            { name: "Sophie Turner", email: "sophie.turner456@mail.com",       phone: "+44 7700 900789" },
                                            { name: "Liam Johnson",  email: "liam.johnson789@mail.com",        phone: null },
                                            { name: "Olivia King",   email: "olivia.king101@mail.com",         phone: null },
                                        ].map(contact => (
                                            <div key={contact.name} className="flex min-w-0 flex-1 basis-[calc(50%-8px)] items-center gap-3">
                                                <div className="flex min-w-0 flex-1 flex-col">
                                                    <p className="truncate text-sm font-semibold text-primary">{contact.name}</p>
                                                    <p className="truncate text-sm text-tertiary">{contact.email}</p>
                                                </div>
                                                <Button
                                                    color="secondary"
                                                    size="sm"
                                                    iconLeading={Mail05}
                                                    href={`mailto:${contact.email}`}
                                                    className="shrink-0"
                                                />
                                                {contact.phone && (
                                                    <Button
                                                        color="secondary"
                                                        size="sm"
                                                        iconLeading={PhoneCall01}
                                                        href={`tel:${contact.phone.replace(/\s/g, "")}`}
                                                        className="shrink-0"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : activeTab === "company" ? (
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        <OverlayField
                                            label="Street Address"
                                            value={LEAD_COMPANY_DETAILS[lead.id]?.streetAddress}
                                            placeholder="Street address"
                                            animKey={contentAnimKey} exiting={contentExiting}
                                        />
                                        <OverlayField
                                            label="City"
                                            value={LEAD_COMPANY_DETAILS[lead.id]?.city}
                                            placeholder="City"
                                            animKey={contentAnimKey} exiting={contentExiting}
                                        />
                                        <OverlayField
                                            label="Postal Code"
                                            value={LEAD_COMPANY_DETAILS[lead.id]?.postalCode}
                                            placeholder="e.g. EC1V 2NX"
                                            animKey={contentAnimKey} exiting={contentExiting}
                                        />
                                        <PlaybookSelect
                                            label="Industry"
                                            options={[...INDUSTRY_OPTIONS]}
                                            placeholder={LEAD_COMPANY_DETAILS[lead.id]?.industry ?? "Select industry…"}
                                        />
                                        {/* Annual Turnover */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-secondary">Annual Turnover (£)</label>
                                            <div className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
                                                <span className="text-sm text-tertiary">£</span>
                                                <input
                                                    type="number"
                                                    defaultValue={LEAD_COMPANY_DETAILS[lead.id]?.annualTurnover}
                                                    placeholder="e.g. 250000"
                                                    className="w-full bg-transparent text-sm text-primary placeholder:text-placeholder outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                />
                                            </div>
                                        </div>
                                        {/* Incorporation Date */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-secondary">Incorporation Date</label>
                                            <div className="flex items-center rounded-lg border border-secondary bg-primary px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
                                                <input
                                                    type="text"
                                                    defaultValue={LEAD_COMPANY_DETAILS[lead.id]?.incorporationDate}
                                                    placeholder="DD/MM/YYYY"
                                                    className="w-full bg-transparent text-sm text-primary placeholder:text-placeholder outline-none"
                                                />
                                            </div>
                                        </div>
                                        {/* Companies House Number — required */}
                                        <div className="flex flex-col gap-1">
                                            <label className="flex items-center gap-1 text-sm font-medium text-secondary">
                                                Companies House Number
                                                <span className="text-error-primary">*</span>
                                            </label>
                                            <div className="rounded-lg border border-secondary bg-primary px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
                                                <input
                                                    type="text"
                                                    defaultValue={LEAD_COMPANY_DETAILS[lead.id]?.companyNumber}
                                                    placeholder="e.g. 14330514"
                                                    className="w-full bg-transparent text-sm text-primary placeholder:text-placeholder outline-none"
                                                />
                                            </div>
                                            <p className="text-xs text-tertiary">Required to start a deal</p>
                                        </div>
                                        {/* Overdraft Limit */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-secondary">Overdraft Limit (£)</label>
                                            <div className="flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
                                                <span className="text-sm text-tertiary">£</span>
                                                <input
                                                    type="number"
                                                    defaultValue={LEAD_COMPANY_DETAILS[lead.id]?.overdraftLimit ?? "0"}
                                                    placeholder="0"
                                                    className="w-full bg-transparent text-sm text-primary placeholder:text-placeholder outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : activeTab === "tasks" ? (
                                    <div className="flex flex-col gap-2">
                                        {tasks.filter(t => t.completed).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                                                <CheckCircle className="size-8 text-fg-quaternary" />
                                                <p className="text-sm text-tertiary">No completed tasks yet</p>
                                            </div>
                                        ) : (
                                            tasks.filter(t => t.completed).map(task => (
                                                <div key={task.id} className="flex items-center gap-3 rounded-xl border border-secondary bg-primary px-4 py-3 opacity-60 shadow-xs">
                                                    <Check className="size-4 shrink-0 text-fg-brand-primary" />
                                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                        <span className="truncate text-sm text-tertiary line-through">{task.desc}</span>
                                                        <div className="flex items-center gap-2">
                                                            {task.priority && (
                                                                <span className="flex items-center gap-1 text-xs text-quaternary">
                                                                    <span className={cx("size-1.5 rounded-full shrink-0", PRIORITY_OPTIONS.find(p => p.label === task.priority)?.dot)} />
                                                                    {task.priority}
                                                                </span>
                                                            )}
                                                            {task.due && <span className="text-xs text-quaternary">{task.due}</span>}
                                                            {task.assignee && (
                                                                <span className="text-xs text-quaternary">
                                                                    {task.assignee === "me" ? "Me" : ASSIGNEE_OPTIONS.find(o => o.value === task.assignee)?.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateTasks(tasks.map(t => t.id === task.id ? { ...t, completed: false } : t))}
                                                        className="shrink-0 text-fg-quaternary transition-colors hover:text-fg-brand-primary"
                                                        title="Mark as incomplete"
                                                    >
                                                        <RefreshCcw01 className="size-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-16 text-sm text-tertiary">Content coming soon</div>
                                )}
                            </div>
                        </div>

                        {/* Right panel – Activity */}
                        <div className="flex w-1/3 shrink-0 flex-col">
                            {/* Activity log card */}
                            <div className="m-3 mb-0 flex flex-1 flex-col overflow-hidden rounded-xl border border-secondary bg-secondary_subtle shadow-xs">
                                {/* Heading */}
                                <div className="relative shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setActivityDropdownOpen(o => !o)}
                                        className="flex h-11 w-full items-center justify-between pb-2 pl-5 pr-3 pt-3"
                                    >
                                        <span className="text-sm font-semibold text-primary">{ACTIVITY_FILTER_LABELS[activityFilter]}</span>
                                        <ChevronDown className={cx("size-5 text-fg-quaternary transition-transform duration-150", activityDropdownOpen && "rotate-180")} />
                                    </button>

                                    {activityDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setActivityDropdownOpen(false)} />
                                            <div className="absolute top-full left-3 z-20 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-secondary bg-primary shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                                                <div className="py-1">
                                                    {ACTIVITY_FILTER_OPTIONS.map((opt, i) =>
                                                        opt === "divider" ? (
                                                            <div key={i} className="my-1 border-t border-secondary" />
                                                        ) : (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => { setActivityFilter(opt.value); setActivityDropdownOpen(false); }}
                                                                className={cx(
                                                                    "mx-1.5 flex w-[calc(100%-12px)] items-center rounded-md px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                                                                    activityFilter === opt.value ? "bg-secondary_subtle text-primary" : "text-secondary hover:bg-secondary_subtle",
                                                                )}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Inner white card: activity steps + notes */}
                                <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-secondary bg-primary p-2">
                                    {/* Activity steps */}
                                    <div
                                        key={contentAnimKey}
                                        ref={activityScrollRef}
                                        className={cx(
                                            "flex-1 overflow-y-auto px-1 py-1 transition-opacity ease-in",
                                            contentExiting ? "duration-[120ms] opacity-0" : "duration-200 ease-out animate-in fade-in",
                                        )}
                                    >
                                        {filteredActivity.length === 0 && (
                                            <div className="flex h-full items-center justify-center py-8">
                                                <PlaybookEmptyIllustration />
                                            </div>
                                        )}
                                        {filteredActivity.map(({ icon: Icon, title, meta, date }, i) => {
                                            const isLast = i === filteredActivity.length - 1;
                                            return (
                                                <div key={i} className="flex items-start gap-3">
                                                    <div className="flex shrink-0 flex-col items-center gap-1 self-stretch pb-1">
                                                        <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-secondary bg-secondary_subtle">
                                                            {Icon
                                                                ? <Icon className="size-3 text-fg-quaternary" />
                                                                : <span className="size-2 rounded-full bg-fg-quaternary" />
                                                            }
                                                        </div>
                                                        {!isLast && <div className="w-0.5 flex-1 rounded-sm bg-secondary" />}
                                                    </div>
                                                    <div className={cx("flex flex-1 flex-col min-w-0", !isLast && "pb-6")}>
                                                        <p className="text-sm font-semibold text-secondary">{title}</p>
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-sm text-quaternary">
                                                            {meta && (
                                                                <>
                                                                    <span>{meta}</span>
                                                                    <span className="size-1 shrink-0 rounded-full bg-fg-quaternary" />
                                                                </>
                                                            )}
                                                            <span>{date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Notes textarea */}
                                    <div className="flex shrink-0 flex-col gap-1.5 pt-2">
                                        <textarea
                                            placeholder="Add your notes"
                                            value={noteText}
                                            onChange={e => setNoteText(e.target.value)}
                                            rows={4}
                                            className="w-full resize-none rounded-lg border border-primary bg-primary px-3.5 py-3 text-sm text-primary shadow-xs placeholder:text-quaternary outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
                                        />
                                        <Button
                                            color="secondary"
                                            size="md"
                                            iconLeading={MessageSquare01}
                                            className="w-full justify-center"
                                            isDisabled={!noteText.trim()}
                                            onClick={() => {
                                                if (!noteText.trim()) return;
                                                setLocalNotes(prev => [...prev, {
                                                    icon: MessageSquare01,
                                                    title: noteText.trim(),
                                                    meta: "You",
                                                    date: "Just now",
                                                    type: "notes",
                                                }]);
                                                setNoteText("");
                                            }}
                                        >
                                            Add note
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Flag options panel */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateRows: showFlagOptions ? "1fr" : "0fr",
                                    transition: "grid-template-rows 280ms ease-out",
                                }}
                            >
                                <div style={{ overflow: "hidden", minHeight: 0 }}>
                                    <div
                                        className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5"
                                        style={{
                                            opacity: showFlagOptions ? 1 : 0,
                                            transform: showFlagOptions ? "translateY(0)" : "translateY(8px)",
                                            transition: "opacity 220ms ease-out, transform 220ms ease-out",
                                        }}
                                    >
                                        {FLAG_OPTIONS.map(label => {
                                            const checked = checkedFlags.has(label);
                                            return (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    onClick={() => toggleFlag(label)}
                                                    className={cx(
                                                        "flex items-center gap-1.5 rounded-md border py-1 pl-[5px] pr-2 text-xs font-medium transition-colors duration-150",
                                                        checked
                                                            ? "border-error-solid bg-error-solid text-white"
                                                            : "border-primary bg-primary text-secondary hover:border-error-300 hover:bg-error-primary hover:text-error-700",
                                                    )}
                                                >
                                                    <span
                                                        className={cx(
                                                            "flex size-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors duration-150",
                                                            checked ? "border-white bg-transparent" : "border-secondary",
                                                        )}
                                                    >
                                                        {checked && <Check className="size-3 text-white" />}
                                                    </span>
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* CTA row */}
                            <div className="flex shrink-0 items-center gap-2 px-3 py-3">
                                <Button
                                    color={checkedFlags.size > 0 ? "primary-destructive" : "secondary"}
                                    size="sm"
                                    iconLeading={<Flag01 className={cx("size-5 shrink-0", checkedFlags.size > 0 ? "text-white" : "text-utility-error-600")} />}
                                    className={cx("shrink-0", checkedFlags.size === 0 && showFlagOptions && "bg-error-primary border-error-300")}
                                    onClick={() => setShowFlagOptions(v => !v)}
                                />
                                <Button
                                    color="primary"
                                    size="sm"
                                    iconTrailing={ArrowRight}
                                    className="flex-1 justify-center"
                                    isDisabled={checkedFlags.size > 0}
                                >
                                    Start Deal
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Close button – top-right of viewport */}
            <Button color="secondary" size="md" iconLeading={XClose} onClick={onClose} className="fixed top-4 right-4 z-[60] rounded-full shadow-lg" />
        </div>
    );
};

// Reads initial tasks from context then delegates to LeadOverlay
const LeadOverlayWithContext = (props: Omit<React.ComponentProps<typeof LeadOverlay>, "initialTasks" | "onTasksChange"> & {
    onLeadTasksChange?: (leadId: string, tasks: OverlayTask[]) => void;
}) => {
    const { onLeadTasksChange, ...rest } = props;
    const leadTasks = useContext(LeadTasksContext);
    return (
        <LeadOverlay
            {...rest}
            initialTasks={leadTasks[props.lead.id] ?? []}
            onTasksChange={tasks => onLeadTasksChange?.(props.lead.id, tasks)}
        />
    );
};

const LeadsPage = ({ isRefreshing, onLeadTasksChange }: { isRefreshing: boolean; onLeadTasksChange?: (leadId: string, tasks: OverlayTask[]) => void }) => {
    const [search, setSearch]           = useState("");
    const [homeowner, setHomeowner]     = useState("Homeowner: any");
    const [bizType, setBizType]         = useState("All Business Types");
    const [turnover, setTurnover]       = useState("Any turnover");
    const [assignee, setAssignee]       = useState("All assignees");
    const [page, setPage]               = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortCol, setSortCol]         = useState<"name" | "applied" | "businessType" | "strength" | "callStatus" | "assignee">("applied");
    const [sortDir, setSortDir]         = useState<"asc" | "desc">("asc");
    const [openLeadId, setOpenLeadId]   = useState<string | null>(null);
    const [isClosingLead, setIsClosingLead] = useState(false);

    const handleCloseLead = () => {
        setIsClosingLead(true);
        setTimeout(() => { setOpenLeadId(null); setIsClosingLead(false); }, 150);
    };
    const searchRef = useRef<HTMLInputElement>(null);
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const input = searchWrapperRef.current?.querySelector("input");
        if (input) (searchRef as React.MutableRefObject<HTMLInputElement | null>).current = input;
    }, []);

    const handleSort = (col: typeof sortCol) => {
        if (col === sortCol) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("asc"); }
        setPage(1);
    };

    const activeFilterCount = [
        homeowner !== "Homeowner: any",
        bizType !== "All Business Types",
        turnover !== "Any turnover",
        assignee !== "All assignees",
    ].filter(Boolean).length;

    const filtered = LEADS_DATA.filter(l => {
        if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !(l.company ?? "").toLowerCase().includes(search.toLowerCase())) return false;
        if (bizType !== "All Business Types" && l.businessType !== bizType) return false;
        if (assignee !== "All assignees" && l.assignee !== assignee) return false;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        let cmp = 0;
        if (sortCol === "name")         cmp = a.name.localeCompare(b.name);
        else if (sortCol === "businessType") cmp = a.businessType.localeCompare(b.businessType);
        else if (sortCol === "strength")    cmp = a.strength.localeCompare(b.strength);
        else if (sortCol === "callStatus")  cmp = a.callStatus.localeCompare(b.callStatus);
        else if (sortCol === "assignee")    cmp = a.assignee.localeCompare(b.assignee);
        else cmp = 0;
        return sortDir === "asc" ? cmp : -cmp;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
    const pageRows = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const openLeadIdx  = openLeadId ? sorted.findIndex(l => l.id === openLeadId) : -1;
    const openLead     = openLeadIdx >= 0 ? sorted[openLeadIdx] : null;

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

    const thCls = "h-11 cursor-pointer select-none border-b border-secondary px-6 py-3 text-left";
    const SortIcon = ({ col }: { col: typeof sortCol }) =>
        sortCol === col
            ? (sortDir === "asc" ? <ArrowUp className="size-3 text-tertiary" /> : <ArrowDown className="size-3 text-tertiary" />)
            : <ChevronSelectorVertical className="size-3 text-quaternary" />;

    return (
        <>
        <div className={cx("flex flex-1 flex-col overflow-x-auto overflow-y-auto transition-opacity duration-300", isRefreshing && "opacity-40 pointer-events-none")}>
            <div className="flex min-w-[1100px] flex-col">
                {/* Header */}
                <div className="shrink-0 px-5 pt-5 pb-4">
                    <div className="rounded-xl border border-secondary bg-secondary shadow-xs">
                        {/* Title row */}
                        <div className="flex items-center gap-4 px-5 py-4">
                            <h1 className="text-lg font-semibold text-primary">Leads</h1>
                            <Badge type="modern" color="gray" size="sm">{LEADS_DATA.filter(l => l.callStatus === "Called Today" || l.applied.includes("mins ago") || l.applied.includes("today")).length} today</Badge>
                            <Badge type="modern" color="gray" size="sm">{LEADS_DATA.filter(l => l.callStatus === "Called Today").length} called today</Badge>
                            <div ref={searchWrapperRef} className="ml-auto">
                                <Input size="sm" placeholder="Search" icon={SearchLg} shortcut="/" wrapperClassName="w-64" value={search} onChange={setSearch} />
                            </div>
                        </div>
                        {/* Filter row */}
                        <div className="rounded-xl border border-secondary bg-primary">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <LeadsSimpleFilter label="Homeowner: any"    options={["Homeowner: any", "Yes", "No"]}                                   value={homeowner} onChange={setHomeowner} />
                                    <LeadsSimpleFilter label="All Business Types" options={["All Business Types", "Limited", "Sole Trader", "Partnership"]}   value={bizType}   onChange={setBizType}   />
                                    <LeadsSimpleFilter label="Any turnover"       options={["Any turnover", "Under £100k", "£100k–£500k", "£500k–£1M", "£1M+"]} value={turnover}  onChange={setTurnover}  />
                                    <LeadsSimpleFilter label="All assignees"      options={["All assignees", "Alex Buck", "Sarah Chen", "Jake Torres"]}        value={assignee}  onChange={setAssignee}  />
                                </div>
                                <div className={cx("relative", activeFilterCount === 0 && "invisible pointer-events-none")}>
                                    <button
                                        type="button"
                                        onClick={() => { setHomeowner("Homeowner: any"); setBizType("All Business Types"); setTurnover("Any turnover"); setAssignee("All assignees"); }}
                                        className="flex cursor-pointer items-center justify-center rounded-lg border border-primary bg-primary p-2.5 transition duration-100 hover:bg-primary_hover"
                                        title="Reset filters"
                                    >
                                        <ClearFiltersIcon className="size-5 text-fg-quaternary" />
                                    </button>
                                    <span className="pointer-events-none absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-brand-solid text-xs font-semibold text-white">
                                        {activeFilterCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="px-5 pb-5">
                    <div className="rounded-xl border border-secondary bg-secondary shadow-xs">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-10 bg-secondary">
                                <tr>
                                    <th className={thCls} onClick={() => handleSort("name")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Lead name and company</span><SortIcon col="name" /></div>
                                    </th>
                                    <th className={thCls} onClick={() => handleSort("applied")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Applied</span><SortIcon col="applied" /></div>
                                    </th>
                                    <th className={thCls} onClick={() => handleSort("businessType")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Business Type</span><SortIcon col="businessType" /></div>
                                    </th>
                                    <th className={thCls} onClick={() => handleSort("strength")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Strength</span><SortIcon col="strength" /></div>
                                    </th>
                                    <th className={thCls} onClick={() => handleSort("callStatus")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Call</span><SortIcon col="callStatus" /></div>
                                    </th>
                                    <th className={thCls} onClick={() => handleSort("assignee")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Assignee</span><SortIcon col="assignee" /></div>
                                    </th>
                                    <th className="h-11 w-16 border-b border-secondary" />
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="bg-primary px-6 py-10 text-center text-sm text-tertiary">
                                            No leads match your filters.
                                        </td>
                                    </tr>
                                ) : pageRows.map((lead) => (
                                    <tr key={lead.id} className="group cursor-pointer" onClick={() => setOpenLeadId(lead.id)}>
                                        <td className={cx(
                                            "relative h-[72px] border-b border-secondary bg-primary px-6 py-4 text-sm transition-colors duration-100 group-hover:bg-secondary_subtle",
                                        )}>
                                            {lead.priority && (
                                                <div className="absolute left-0 top-0 h-full w-1 rounded-r-sm bg-fg-brand-secondary" />
                                            )}
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-primary">{lead.name}</span>
                                                </div>
                                                {lead.company && <span className="text-sm text-tertiary">{lead.company}</span>}
                                            </div>
                                        </td>
                                        <td className="h-[72px] border-b border-secondary bg-primary px-6 py-4 text-sm text-tertiary transition-colors duration-100 group-hover:bg-secondary_subtle">{lead.applied}</td>
                                        <td className="h-[72px] border-b border-secondary bg-primary px-6 py-4 text-sm text-tertiary transition-colors duration-100 group-hover:bg-secondary_subtle">{lead.businessType}</td>
                                        <td className="h-[72px] border-b border-secondary bg-primary px-6 py-4 transition-colors duration-100 group-hover:bg-secondary_subtle">
                                            <LeadsStrengthBadge strength={lead.strength} />
                                        </td>
                                        <td className="h-[72px] border-b border-secondary bg-primary px-6 py-4 transition-colors duration-100 group-hover:bg-secondary_subtle">
                                            <CallStatusBadge status={lead.callStatus} />
                                        </td>
                                        <td className="h-[72px] border-b border-secondary bg-primary px-6 py-4 text-sm text-tertiary transition-colors duration-100 group-hover:bg-secondary_subtle">{lead.assignee}</td>
                                        <td className="h-[72px] border-b border-secondary bg-primary px-6 py-4 transition-colors duration-100 group-hover:bg-secondary_subtle">
                                            <a
                                                href={`tel:${lead.phone.replace(/\s/g, "")}`}
                                                onClick={e => e.stopPropagation()}
                                                className="flex items-center justify-center rounded-md border border-brand-300 bg-primary p-2 shadow-xs transition-colors duration-100 hover:border-brand-400 hover:bg-brand-50"
                                            >
                                                <PhoneCall01 className="size-4 text-brand-600" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex shrink-0 items-center justify-between border-t border-secondary px-5 pt-5 pb-4">
                            <button
                                type="button"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
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
                                            p === page ? "bg-primary_hover text-secondary" : "text-tertiary hover:bg-primary_hover",
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
                                    onChange={v => { setRowsPerPage(Number(v)); setPage(1); }}
                                    options={["10", "50", "100"]}
                                    selectClassName="py-2"
                                />
                                <button
                                    type="button"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:text-disabled"
                                >
                                    Next <ArrowRight className="size-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {openLead && (
            <LeadOverlayWithContext
                lead={openLead}
                leadIndex={openLeadIdx}
                totalLeads={sorted.length}
                isClosing={isClosingLead}
                onClose={handleCloseLead}
                onPrev={() => openLeadIdx > 0 && setOpenLeadId(sorted[openLeadIdx - 1].id)}
                onNext={() => openLeadIdx < sorted.length - 1 && setOpenLeadId(sorted[openLeadIdx + 1].id)}
                onLeadTasksChange={onLeadTasksChange}
            />
        )}
        </>
    );
};

// ─── Tasks Page ───────────────────────────────────────────────────────────────

type TaskPriority = "High" | "Medium" | "Low";
const initialLeadTasks: Record<string, OverlayTask[]> = {
    "ld1":  [{ id: 1, originalId: "t1",  desc: "Homeowner own book eligible cold call again",   priority: "High",   due: "Yesterday",  assignee: "Alex Buck",   completed: false }],
    "ld2":  [{ id: 1, originalId: "t2",  desc: "Dashboard question",                            priority: "Medium", due: "Today",      assignee: "Sarah Chen",  completed: false }],
    "ld3":  [{ id: 1, originalId: "t3",  desc: "Dashboard upload completed for",                priority: "Low",    due: "Today",      assignee: "Alex Buck",   completed: false }],
    "ld4":  [{ id: 1, originalId: "t4",  desc: "Re-submission",                                 priority: "High",   due: "Yesterday",  assignee: "Jake Torres", completed: false }],
    "ld5":  [{ id: 1, originalId: "t5",  desc: "Check back in with client (6 months passed)",   priority: "Medium", due: "30/05/2026", assignee: "Sarah Chen",  completed: false }],
    "ld6":  [{ id: 1, originalId: "t6",  desc: "Follow up on outstanding documents",            priority: "High",   due: "Yesterday",  assignee: "Alex Buck",   completed: false }],
    "ld7":  [{ id: 1, originalId: "t7",  desc: "Send updated proposal",                         priority: "Low",    due: "Today",      assignee: "Jake Torres", completed: false }],
    "ld8":  [{ id: 1, originalId: "t8",  desc: "Confirm meeting for next week",                 priority: "Medium", due: "02/06/2026", assignee: "Sarah Chen",  completed: false }],
    "ld9":  [{ id: 1, originalId: "t9",  desc: "Chase bank statements",                         priority: "High",   due: "Today",      assignee: "Alex Buck",   completed: false }],
    "ld10": [{ id: 1, originalId: "t10", desc: "Review credit report and update CRM",           priority: "Low",    due: "05/06/2026", assignee: "Jake Torres", completed: false }],
    "ld11": [{ id: 1, originalId: "t11", desc: "Initial eligibility check",                     priority: "Medium", due: "Today",      assignee: "Sarah Chen",  completed: false }],
    "ld12": [{ id: 1, originalId: "t12", desc: "Resend application link",                       priority: "Low",    due: "06/06/2026", assignee: "Alex Buck",   completed: false }],
};

const TaskPriorityBadge = ({ priority }: { priority: TaskPriority }) => (
    <BadgeWithDot
        type="modern"
        size="sm"
        color={priority === "High" ? "error" : priority === "Medium" ? "warning" : "blue"}
    >
        {priority}
    </BadgeWithDot>
);

const TaskContactKindBadge = ({ callStatus }: { callStatus: string }) => (
    <BadgeWithDot
        type="modern"
        size="sm"
        color={
            callStatus === "Called Today" ? "success" :
            callStatus === "Never Called" ? "gray" :
            "gray-blue"
        }
    >
        {callStatus}
    </BadgeWithDot>
);

type FlatTaskRow = { rowId: string; leadId: string; lead: LeadRow; task: OverlayTask };

const TasksPage = ({
    onRefresh,
    isRefreshing,
    allLeads,
    leadTasks,
    onLeadTasksChange,
}: {
    onRefresh: () => void;
    isRefreshing: boolean;
    allLeads: LeadRow[];
    leadTasks: Record<string, OverlayTask[]>;
    onLeadTasksChange: (leadId: string, tasks: OverlayTask[]) => void;
}) => {
    const [search, setSearch]           = useState("");
    const [assignee, setAssignee]       = useState("My team");
    const [dueDate, setDueDate]         = useState("All due dates");
    const [homeowner, setHomeowner]     = useState("Homeowner: any");
    const [bizType, setBizType]         = useState("All business types");
    const [playbook, setPlaybook]           = useState("Playbook: any");
    const [callOutcome, setCallOutcome]     = useState("Call outcome: any");
    const [convYear, setConvYear]           = useState("Conversion year: any");
    const [completion, setCompletion]       = useState("Not Completed");
    const [completedIds, setCompletedIds]     = useState<Set<string>>(new Set());
    const [exitingIds, setExitingIds]         = useState<Set<string>>(new Set());
    const [collapsingIds, setCollapsingIds]   = useState<Set<string>>(new Set());
    const [openLeadId, setOpenLeadId]         = useState<string | null>(null);
    const [openRowTaskId, setOpenRowTaskId]   = useState<string | null>(null);
    const [isClosingTask, setIsClosingTask]   = useState(false);

    const handleCloseTask = () => {
        setIsClosingTask(true);
        setTimeout(() => { setOpenLeadId(null); setOpenRowTaskId(null); setIsClosingTask(false); }, 150);
    };
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    const allTaskRows: FlatTaskRow[] = allLeads.flatMap(lead =>
        (leadTasks[lead.id] ?? []).map(task => ({
            rowId: `${lead.id}:${task.id}`,
            leadId: lead.id,
            lead,
            task,
        }))
    );

    type TaskSortCol = "task" | "priority" | "due" | "contactKind" | "assignee";
    const [sortCol, setSortCol] = useState<TaskSortCol>("due");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const activeFilterCount = [
        assignee    !== "My team",
        dueDate     !== "All due dates",
        homeowner   !== "Homeowner: any",
        bizType     !== "All business types",
        playbook    !== "Playbook: any",
        callOutcome !== "Call outcome: any",
        convYear    !== "Conversion year: any",
        completion  !== "Not Completed",
    ].filter(Boolean).length;

    const resetFilters = () => {
        setAssignee("My team");
        setDueDate("All due dates");
        setHomeowner("Homeowner: any");
        setBizType("All business types");
        setPlaybook("Playbook: any");
        setCallOutcome("Call outcome: any");
        setConvYear("Conversion year: any");
        setCompletion("Not Completed");
    };

    const handleSort = (col: TaskSortCol) => {
        if (col === sortCol) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("asc"); }
        setPage(1);
    };

    const dueSortKey = (due: string) => {
        if (due === "Yesterday") return -1;
        if (due === "Today")     return 0;
        const d = new Date(due.split("/").reverse().join("-"));
        if (isNaN(d.getTime())) return 9999;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return Math.round((d.getTime() - today.getTime()) / 86400000);
    };

    const priorityOrder: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 };

    const filtered = allTaskRows.filter(r => {
        const { rowId, lead, task } = r;
        if (exitingIds.has(rowId) || collapsingIds.has(rowId)) return true;
        if (search && !task.desc.toLowerCase().includes(search.toLowerCase()) &&
            !lead.name.toLowerCase().includes(search.toLowerCase()) &&
            !(lead.company?.toLowerCase().includes(search.toLowerCase()) ?? false)) return false;
        if (dueDate !== "All due dates") {
            if (dueDate === "Today"   && task.due !== "Today")     return false;
            if (dueDate === "Overdue" && task.due !== "Yesterday") return false;
        }
        if (callOutcome !== "Call outcome: any" && lead.callStatus !== callOutcome) return false;
        if (assignee !== "My team" && assignee !== "All assignees" && task.assignee !== assignee) return false;
        if (completion === "Not Completed" && (completedIds.has(rowId) || task.completed)) return false;
        if (completion === "Completed"     && !completedIds.has(rowId) && !task.completed) return false;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        let cmp = 0;
        if (sortCol === "task")        cmp = a.task.desc.localeCompare(b.task.desc);
        else if (sortCol === "priority")    cmp = priorityOrder[a.task.priority as TaskPriority ?? "Low"] - priorityOrder[b.task.priority as TaskPriority ?? "Low"];
        else if (sortCol === "due")         cmp = dueSortKey(a.task.due ?? "") - dueSortKey(b.task.due ?? "");
        else if (sortCol === "contactKind") cmp = a.lead.callStatus.localeCompare(b.lead.callStatus);
        else if (sortCol === "assignee")    cmp = (a.task.assignee ?? "").localeCompare(b.task.assignee ?? "");
        return sortDir === "asc" ? cmp : -cmp;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
    const pageRows   = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const allPageSelected  = pageRows.length > 0 && pageRows.every(r => selected.has(r.rowId));
    const somePageSelected = pageRows.some(r => selected.has(r.rowId)) && !allPageSelected;

    const toggleAll = () => {
        if (allPageSelected) setSelected(s => { const n = new Set(s); pageRows.forEach(r => n.delete(r.rowId)); return n; });
        else setSelected(s => { const n = new Set(s); pageRows.forEach(r => n.add(r.rowId)); return n; });
    };
    const toggleRow = (rowId: string) => setSelected(s => { const n = new Set(s); n.has(rowId) ? n.delete(rowId) : n.add(rowId); return n; });

    const pages: (number | "…")[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
        pages.push(1, 2, 3);
        if (page > 4) pages.push("…");
        if (page > 3 && page < totalPages - 2) pages.push(page);
        if (page < totalPages - 3) pages.push("…");
        pages.push(totalPages - 1, totalPages);
    }

    const thCls = "h-11 cursor-pointer select-none border-b border-secondary px-4 py-3 text-left";
    const SortIcon = ({ col }: { col: TaskSortCol }) =>
        sortCol === col
            ? (sortDir === "asc" ? <ArrowUp className="size-3 text-tertiary" /> : <ArrowDown className="size-3 text-tertiary" />)
            : <ChevronSelectorVertical className="size-3 text-quaternary" />;

    const tdOuter = (id: string) => cx(
        "overflow-hidden bg-primary p-0 transition-colors duration-100 group-hover:bg-secondary_subtle",
        !collapsingIds.has(id) && "border-b border-secondary",
    );
    const tdInner = (_id: string, extra?: string) => cx("flex items-center overflow-hidden px-4", extra);
    const tdInnerStyle = (id: string): React.CSSProperties => ({
        height: collapsingIds.has(id) ? 0 : 72,
        transition: "height 200ms ease-in-out",
    });

    const openLead    = openLeadId ? allLeads.find(l => l.id === openLeadId) ?? null : null;
    const openTaskIdx = openLeadId ? sorted.findIndex(r => r.leadId === openLeadId) : -1;

    const selRows            = allTaskRows.filter(r => selected.has(r.rowId));
    const priorities         = [...new Set(selRows.map(r => r.task.priority).filter(Boolean))];
    const dates              = [...new Set(selRows.map(r => r.task.due).filter(Boolean))];
    const assignees          = [...new Set(selRows.map(r => r.task.assignee ?? r.lead.assignee))];
    const priLabel           = priorities.length === 1 ? `${priorities[0]} priority` : "Various priorities";
    const dateLabel          = dates.length === 1 ? dates[0]! : "Various dates";
    const assignLabel        = assignees.length === 1 ? assignees[0] : "Various assignees";
    const allSelectedCompleted = selRows.length > 0 && selRows.every(r => completedIds.has(r.rowId) || r.task.completed);

    return (
        <>
        <div className={cx("flex flex-1 flex-col overflow-x-auto overflow-y-auto transition-opacity duration-300", isRefreshing && "opacity-40 pointer-events-none")}>
            <div className="flex min-w-[1100px] flex-col">
                {/* Header */}
                <div className="shrink-0 px-5 pt-5 pb-4">
                    <div className="rounded-xl border border-secondary bg-secondary shadow-xs">
                        <div className="flex items-center gap-4 px-5 py-4">
                            <h1 className="text-lg font-semibold text-primary">Tasks</h1>
                            <Badge type="modern" color="gray" size="sm">{allTaskRows.filter(r => r.task.due === "Yesterday").length} overdue</Badge>
                            <Badge type="modern" color="gray" size="sm">{allTaskRows.filter(r => r.task.due === "Today").length} due today</Badge>
                            <div ref={searchWrapperRef} className="ml-auto flex items-center gap-2">
                                <Input size="sm" placeholder="Search" icon={SearchLg} shortcut="/" wrapperClassName="w-64" value={search} onChange={setSearch} />
                                <button
                                    type="button"
                                    onClick={onRefresh}
                                    className="flex cursor-pointer items-center justify-center rounded-md border border-secondary bg-primary p-2.5 shadow-xs transition hover:bg-primary_hover"
                                >
                                    <RefreshCcw03 className={cx("size-5 text-fg-quaternary", isRefreshing && "spin-once")} />
                                </button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-secondary bg-primary">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <LeadsSimpleFilter label="Not Completed"       options={["Not Completed", "Completed", "All tasks"]}                                     value={completion}  onChange={v => { setCompletion(v);  setPage(1); }} />
                                    <LeadsSimpleFilter label="My team"             options={["My team", "Alex Buck", "Sarah Chen", "Jake Torres", "All assignees"]}          value={assignee}    onChange={v => { setAssignee(v);    setPage(1); }} />
                                    <LeadsSimpleFilter label="All due dates"        options={["All due dates", "Today", "Tomorrow", "This week", "Overdue"]}                  value={dueDate}     onChange={v => { setDueDate(v);     setPage(1); }} />
                                    <LeadsSimpleFilter label="Homeowner: any"       options={["Homeowner: any", "Yes", "No"]}                                                 value={homeowner}   onChange={v => { setHomeowner(v);   setPage(1); }} />
                                    <LeadsSimpleFilter label="All business types"   options={["All business types", "Limited", "Sole Trader", "Partnership"]}                 value={bizType}     onChange={v => { setBizType(v);     setPage(1); }} />
                                    <LeadsSimpleFilter label="Playbook: any"        options={["Playbook: any", "Yes", "No"]}                                                  value={playbook}    onChange={v => { setPlaybook(v);    setPage(1); }} />
                                    <LeadsSimpleFilter label="Call outcome: any"    options={["Call outcome: any", "Called Today", "Voicemail", "Never Called", "Called Yesterday"]} value={callOutcome} onChange={v => { setCallOutcome(v); setPage(1); }} />
                                    <LeadsSimpleFilter label="Conversion year: any" options={["Conversion year: any", "2024", "2025", "2026"]}                                value={convYear}    onChange={v => { setConvYear(v);    setPage(1); }} />
                                </div>
                                <div className={cx("relative", activeFilterCount === 0 && "invisible pointer-events-none")}>
                                    <button type="button" onClick={resetFilters} className="flex cursor-pointer items-center justify-center rounded-lg border border-primary bg-primary p-2.5 transition duration-100 hover:bg-primary_hover" title="Reset filters">
                                        <ClearFiltersIcon className="size-5 text-fg-quaternary" />
                                    </button>
                                    <span className="pointer-events-none absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-brand-solid text-xs font-semibold text-white">
                                        {activeFilterCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="px-5 pb-5">
                    <div className="rounded-xl border border-secondary bg-secondary shadow-xs">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-10 bg-secondary">
                                <tr>
                                    <th className="h-11 cursor-pointer select-none border-b border-secondary py-3 pl-5 pr-4 text-left" onClick={() => handleSort("task")}>
                                        <div className="flex items-center gap-3">
                                            <div onClick={e => e.stopPropagation()}>
                                                <Checkbox
                                                    isSelected={allPageSelected}
                                                    isIndeterminate={somePageSelected}
                                                    onChange={toggleAll}
                                                />
                                            </div>
                                            <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Task</span><SortIcon col="task" /></div>
                                        </div>
                                    </th>
                                    <th className={cx(thCls, "w-[117px]")} onClick={() => handleSort("priority")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Priority</span><SortIcon col="priority" /></div>
                                    </th>
                                    <th className={cx(thCls, "w-[125px]")} onClick={() => handleSort("due")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Due</span><SortIcon col="due" /></div>
                                    </th>
                                    <th className="h-11 border-b border-secondary px-4 py-3 text-left">
                                        <span className="text-xs font-semibold text-quaternary">Phone number</span>
                                    </th>
                                    <th className={thCls} onClick={() => handleSort("contactKind")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Contact kind</span><SortIcon col="contactKind" /></div>
                                    </th>
                                    <th className={thCls} onClick={() => handleSort("assignee")}>
                                        <div className="inline-flex items-center gap-1"><span className="text-xs font-semibold text-quaternary">Assignee</span><SortIcon col="assignee" /></div>
                                    </th>
                                    <th className="h-11 border-b border-secondary px-4 py-3 text-center">
                                        <span className="text-xs font-semibold text-quaternary">Playbook</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="bg-primary px-6 py-10 text-center text-sm text-tertiary">
                                            No tasks match your filters.
                                        </td>
                                    </tr>
                                ) : pageRows.map(r => (
                                    <tr key={r.rowId} onClick={() => { setOpenLeadId(r.leadId); setOpenRowTaskId(r.task.originalId ?? String(r.task.id)); }} className={cx("group cursor-pointer", exitingIds.has(r.rowId) && "task-row-exit")}>
                                        <td className={tdOuter(r.rowId)}>
                                            <div className={tdInner(r.rowId, "gap-3 pl-5 pr-4")} style={tdInnerStyle(r.rowId)}>
                                                <div onClick={e => e.stopPropagation()}>
                                                    <Checkbox
                                                        isSelected={selected.has(r.rowId)}
                                                        onChange={() => toggleRow(r.rowId)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={cx("text-sm font-medium", completedIds.has(r.rowId) ? "text-tertiary line-through" : "text-primary")}>{r.task.desc}</span>
                                                    <span className="text-sm text-tertiary">{r.lead.name} • {r.lead.company}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={tdOuter(r.rowId)}>
                                            <div className={tdInner(r.rowId)} style={tdInnerStyle(r.rowId)}>
                                                <TaskPriorityBadge priority={r.task.priority as TaskPriority} />
                                            </div>
                                        </td>
                                        <td className={tdOuter(r.rowId)}>
                                            <div className={tdInner(r.rowId)} style={tdInnerStyle(r.rowId)}>
                                                <span className={cx("text-sm font-medium", r.task.due === "Yesterday" ? "text-error-600" : "text-secondary")}>
                                                    {r.task.due}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={tdOuter(r.rowId)}>
                                            <div className={tdInner(r.rowId, "text-sm text-tertiary")} style={tdInnerStyle(r.rowId)}>{r.lead.phone}</div>
                                        </td>
                                        <td className={tdOuter(r.rowId)}>
                                            <div className={tdInner(r.rowId)} style={tdInnerStyle(r.rowId)}>
                                                <TaskContactKindBadge callStatus={r.lead.callStatus} />
                                            </div>
                                        </td>
                                        <td className={tdOuter(r.rowId)}>
                                            <div className={tdInner(r.rowId, "text-sm text-tertiary")} style={tdInnerStyle(r.rowId)}>{r.task.assignee ?? r.lead.assignee}</div>
                                        </td>
                                        <td className={tdOuter(r.rowId)}>
                                            <div className={tdInner(r.rowId, "justify-center")} style={tdInnerStyle(r.rowId)}>
                                                <div className="flex items-center justify-center rounded-[6px] p-1.5">
                                                    <XClose className="size-4 text-fg-quaternary" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex shrink-0 items-center justify-between border-t border-secondary px-5 pt-5 pb-4">
                            <button type="button" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:text-disabled">
                                <ArrowLeft className="size-5" /> Previous
                            </button>
                            <div className="flex items-center gap-0.5">
                                {pages.map((p, i) => (
                                    <button key={i} type="button" disabled={p === "…"} onClick={() => typeof p === "number" && setPage(p)}
                                        className={cx("flex size-10 items-center justify-center rounded-lg text-sm font-medium transition",
                                            p === page ? "bg-primary_hover text-secondary" : "text-tertiary hover:bg-primary_hover",
                                            p === "…" && "cursor-default",
                                        )}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <FilterSelect value={String(rowsPerPage)} onChange={v => { setRowsPerPage(Number(v)); setPage(1); }} options={["10", "50", "100"]} selectClassName="py-2" />
                                <button type="button" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:text-disabled">
                                    Next <ArrowRight className="size-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {createPortal(
            <div className={cx(
                "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-200",
                selected.size > 0 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none",
            )}>
                <div className="flex min-w-[560px] items-center gap-3 rounded-xl border border-secondary bg-primary px-4 py-4 shadow-lg">
                    <div className="flex size-10 shrink-0 items-center justify-center">
                        <CheckDone01 className="size-7 text-fg-brand-primary" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold text-primary">
                            {selected.size} task{selected.size !== 1 ? "s" : ""} selected
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-tertiary">{priLabel}</span>
                            <span className="size-1 shrink-0 rounded-full bg-fg-quaternary" />
                            <span className="text-sm text-tertiary">{dateLabel}</span>
                            <span className="size-1 shrink-0 rounded-full bg-fg-quaternary" />
                            <span className="text-sm text-tertiary">{assignLabel}</span>
                        </div>
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-2">
                        <button type="button" className="flex cursor-pointer items-center justify-center rounded-md border border-secondary bg-primary p-2.5 shadow-xs transition hover:bg-primary_hover">
                            <UserEdit className="size-5 text-fg-quaternary" />
                        </button>
                        <button type="button" className="flex cursor-pointer items-center justify-center rounded-md border border-secondary bg-primary p-2.5 shadow-xs transition hover:bg-primary_hover">
                            <ClockRewind className="size-5 text-fg-quaternary" />
                        </button>
                        <button
                            type="button"
                            className="flex cursor-pointer items-center justify-center rounded-md bg-brand-solid p-2.5 shadow-xs transition hover:opacity-90"
                            onClick={() => {
                                const rowIds = [...selected];
                                setSelected(new Set());
                                if (allSelectedCompleted) {
                                    setCompletedIds(s => { const n = new Set(s); rowIds.forEach(id => n.delete(id)); return n; });
                                    // Propagate uncomplete to leadTasks
                                    const affectedLeads = new Map<string, string[]>();
                                    rowIds.forEach(rowId => {
                                        const [leadId] = rowId.split(":");
                                        if (!affectedLeads.has(leadId)) affectedLeads.set(leadId, []);
                                        affectedLeads.get(leadId)!.push(rowId);
                                    });
                                    affectedLeads.forEach((_, leadId) => {
                                        const tasks = (leadTasks[leadId] ?? []).map(t => {
                                            const rid = `${leadId}:${t.id}`;
                                            return rowIds.includes(rid) ? { ...t, completed: false } : t;
                                        });
                                        onLeadTasksChange(leadId, tasks);
                                    });
                                } else if (completion === "Not Completed") {
                                    setExitingIds(s => { const n = new Set(s); rowIds.forEach(id => n.add(id)); return n; });
                                    setTimeout(() => {
                                        // Remove slide class first — browser paints the row at h=72 without animation
                                        setExitingIds(s => { const n = new Set(s); rowIds.forEach(id => n.delete(id)); return n; });
                                        // One rAF later, set h=0 so the browser has a clear "from 72" start value
                                        requestAnimationFrame(() => {
                                            setCollapsingIds(s => { const n = new Set(s); rowIds.forEach(id => n.add(id)); return n; });
                                        });
                                    }, 250);
                                    setTimeout(() => {
                                        setCompletedIds(s => { const n = new Set(s); rowIds.forEach(id => n.add(id)); return n; });
                                        setCollapsingIds(s => { const n = new Set(s); rowIds.forEach(id => n.delete(id)); return n; });
                                        // Propagate complete to leadTasks
                                        const affectedLeads = new Map<string, string[]>();
                                        rowIds.forEach(rowId => {
                                            const [leadId] = rowId.split(":");
                                            if (!affectedLeads.has(leadId)) affectedLeads.set(leadId, []);
                                            affectedLeads.get(leadId)!.push(rowId);
                                        });
                                        affectedLeads.forEach((_, leadId) => {
                                            const tasks = (leadTasks[leadId] ?? []).map(t => {
                                                const rid = `${leadId}:${t.id}`;
                                                return rowIds.includes(rid) ? { ...t, completed: true } : t;
                                            });
                                            onLeadTasksChange(leadId, tasks);
                                        });
                                    }, 470);
                                } else {
                                    setCompletedIds(s => { const n = new Set(s); rowIds.forEach(id => n.add(id)); return n; });
                                    // Propagate complete to leadTasks
                                    const affectedLeads = new Map<string, string[]>();
                                    rowIds.forEach(rowId => {
                                        const [leadId] = rowId.split(":");
                                        if (!affectedLeads.has(leadId)) affectedLeads.set(leadId, []);
                                        affectedLeads.get(leadId)!.push(rowId);
                                    });
                                    affectedLeads.forEach((_, leadId) => {
                                        const tasks = (leadTasks[leadId] ?? []).map(t => {
                                            const rid = `${leadId}:${t.id}`;
                                            return rowIds.includes(rid) ? { ...t, completed: true } : t;
                                        });
                                        onLeadTasksChange(leadId, tasks);
                                    });
                                }
                            }}
                        >
                            {allSelectedCompleted
                                ? <RefreshCcw01 className="size-5 text-white" />
                                : <Check        className="size-5 text-white" />
                            }
                        </button>
                    </div>
                </div>
            </div>,
            document.body,
        )}

        {openLead && (
            <LeadOverlay
                lead={openLead}
                leadIndex={openTaskIdx}
                totalLeads={sorted.length}
                isClosing={isClosingTask}
                onClose={handleCloseTask}
                onPrev={() => { const idx = sorted.findIndex(r => r.leadId === openLeadId); if (idx > 0) { setOpenLeadId(sorted[idx-1].leadId); setOpenRowTaskId(sorted[idx-1].task.originalId ?? String(sorted[idx-1].task.id)); }}}
                onNext={() => { const idx = sorted.findIndex(r => r.leadId === openLeadId); if (idx < sorted.length-1) { setOpenLeadId(sorted[idx+1].leadId); setOpenRowTaskId(sorted[idx+1].task.originalId ?? String(sorted[idx+1].task.id)); }}}
                hideNewTask
                currentTaskId={openRowTaskId ?? undefined}
                initialRelatedTasks={(leadTasks[openLeadId!] ?? []).map(t => ({ ...t, originalId: t.originalId ?? String(t.id) }))}
                onRelatedTasksChange={(tasks) => {
                    onLeadTasksChange(openLeadId!, tasks);
                    setCompletedIds(ids => {
                        const next = new Set(ids);
                        tasks.forEach(t => {
                            const rowId = `${openLeadId}:${t.id}`;
                            if (t.completed) next.add(rowId); else next.delete(rowId);
                        });
                        return next;
                    });
                }}
            />
        )}
        </>
    );
};

// ─── Portal Home Page ─────────────────────────────────────────────────────────

const leaderboardData = [
    { rank: "🥇", name: "Sienna Hewitt",   avatar: "https://www.untitledui.com/images/avatars/sienna-hewitt?fm=webp&q=80",   pct: 8,   count: 14 },
    { rank: "🥈", name: "Ammar Foley",     avatar: "https://www.untitledui.com/images/avatars/ammar-foley?fm=webp&q=80",     pct: 6,   count: 8  },
    { rank: "🥉", name: "Pippa Wilkinson", avatar: "https://www.untitledui.com/images/avatars/pippa-wilkinson?fm=webp&q=80", pct: 4,   count: 7  },
    { rank: "4.", name: "Olly Schroeder",  avatar: "https://www.untitledui.com/images/avatars/olly-schroeder?fm=webp&q=80",  pct: 2,   count: 5  },
    { rank: "5.", name: "Mathilde Lewis",  avatar: "https://www.untitledui.com/images/avatars/mathilde-lewis?fm=webp&q=80",  pct: 1.8, count: 4  },
];


const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        type="button"
        onClick={onClick}
        className={cx(
            "h-9 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-100 whitespace-nowrap",
            active
                ? "border border-primary bg-primary_alt shadow-xs text-secondary"
                : "text-quaternary hover:text-secondary",
        )}
    >
        {children}
    </button>
);

const PortalHomePage = ({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) => {
    const [tierTab, setTierTab] = useState<"today" | "week">("today");
    const [lbTab, setLbTab]     = useState<"today" | "yesterday">("today");

    const tierStats = {
        today: [
            { label: "Calls made",     value: "36"    },
            { label: "Calls received", value: "12"    },
            { label: "Answer rate",    value: "100%"  },
            { label: "Talk time",      value: "1h 17m" },
        ],
        week: [
            { label: "Calls made",     value: "183"   },
            { label: "Calls received", value: "67"    },
            { label: "Answer rate",    value: "97%"   },
            { label: "Talk time",      value: "6h 42m" },
        ],
    };

    return (
        <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex flex-col gap-4 px-5 pt-5 pb-6">

                {/* Header — matches ApplicationHeader card style */}
                <div className="rounded-xl border border-secondary bg-secondary shadow-xs">
                    <div className="flex items-center gap-4 px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                            <h1 className="text-lg font-semibold text-primary">Good Morning Stu!</h1>
                            <p className="text-sm text-tertiary">Here's your snapshot for the day</p>
                        </div>
                        <div className="ml-auto">
                            <Button
                                color="secondary"
                                size="sm"
                                iconLeading={RefreshCcw01}
                                onClick={onRefresh}
                                className={isRefreshing ? "opacity-50 pointer-events-none" : ""}
                                aria-label="Refresh"
                            />
                        </div>
                    </div>
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Commission this month */}
                    <div className="flex gap-4 items-start rounded-xl border border-secondary bg-primary p-5 shadow-xs">
                        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-md border border-secondary bg-primary shadow-xs">
                            <BankNote01 className="size-5 text-secondary" />
                        </div>
                        <div className="flex flex-1 flex-col gap-2 min-w-0">
                            <p className="text-sm font-semibold text-tertiary">Commission this month</p>
                            <div className="flex flex-wrap items-center justify-between gap-y-3">
                                <p className="font-display text-display-sm font-semibold text-primary whitespace-nowrap">£1,746.22</p>
                                <Tooltip title="Percent of your target">
                                    <TooltipTrigger>
                                        <div className="flex items-center gap-1 rounded-sm border border-primary bg-primary shadow-xs pl-1.5 pr-2 py-0.5">
                                            <Target04 className="size-3 text-secondary" />
                                            <span className="text-sm font-medium text-secondary whitespace-nowrap">93%</span>
                                        </div>
                                    </TooltipTrigger>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Deals created */}
                    <div className="flex gap-4 items-start rounded-xl border border-secondary bg-primary p-5 shadow-xs">
                        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-md border border-secondary bg-primary shadow-xs">
                            <FilePlus01 className="size-5 text-secondary" />
                        </div>
                        <div className="flex flex-1 flex-col gap-2 min-w-0">
                            <p className="text-sm font-semibold text-tertiary">Deals created</p>
                            <div className="flex flex-wrap items-center justify-between gap-y-3">
                                <p className="font-display text-display-sm font-semibold text-primary whitespace-nowrap">165</p>
                                <Tooltip title="Average deals created per day">
                                    <TooltipTrigger>
                                        <div className="flex items-center gap-1 rounded-sm border border-primary bg-primary shadow-xs pl-1.5 pr-2 py-0.5">
                                            <TrendUp01 className="size-3 text-secondary" />
                                            <span className="text-sm font-medium text-secondary whitespace-nowrap">8.3/day</span>
                                        </div>
                                    </TooltipTrigger>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Deals won */}
                    <div className="flex gap-4 items-start rounded-xl border border-secondary bg-primary p-5 shadow-xs">
                        <div className="relative flex size-10 shrink-0 items-center justify-center rounded-md border border-secondary bg-primary shadow-xs">
                            <Trophy01 className="size-5 text-secondary" />
                        </div>
                        <div className="flex flex-1 flex-col gap-2 min-w-0">
                            <p className="text-sm font-semibold text-tertiary">Deals won</p>
                            <div className="flex flex-wrap items-center justify-between gap-y-3">
                                <p className="font-display text-display-sm font-semibold text-primary whitespace-nowrap">11</p>
                                <Tooltip title="vs last month">
                                    <TooltipTrigger>
                                        <div className="flex items-center gap-1 rounded-sm border border-primary bg-primary shadow-xs pl-1.5 pr-2 py-0.5">
                                            <TrendUp01 className="size-3 text-secondary" />
                                            <span className="text-sm font-medium text-secondary whitespace-nowrap">+12.5%</span>
                                        </div>
                                    </TooltipTrigger>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tier Activity + Leaderboard */}
                <div className="grid grid-cols-2 gap-4">

                    {/* Tier Activity */}
                    <div className="flex flex-col justify-between rounded-xl border border-secondary bg-primary p-5 shadow-xs gap-4">
                        {/* Top: title + tabs + stats */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-primary">Tier Activity</span>
                                <div className="flex gap-0.5 rounded-md border border-secondary bg-secondary_alt items-center">
                                    <TabButton active={tierTab === "today"} onClick={() => setTierTab("today")}>Today</TabButton>
                                    <TabButton active={tierTab === "week"}  onClick={() => setTierTab("week")}>This Week</TabButton>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-3">
                                {tierStats[tierTab].map(({ label, value }) => (
                                    <div key={label} className="flex flex-1 flex-col items-center gap-0.5 min-w-0">
                                        <p className="font-display text-display-sm font-semibold text-primary whitespace-nowrap">{value}</p>
                                        <p className="text-sm font-medium text-tertiary">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Daily outbound target sub-card */}
                        <div className="flex flex-col justify-between gap-4 rounded-xl border border-secondary bg-secondary p-5 shadow-xs">
                            <div className="flex gap-4 items-start">
                                <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-secondary bg-primary shadow-xs">
                                    <span className="text-lg leading-none">📞</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-2 min-w-0">
                                    <p className="text-sm font-semibold text-tertiary">Daily outbound target</p>
                                    <div className="flex flex-wrap items-center justify-between gap-y-3">
                                        <p className="font-display text-display-sm font-semibold text-primary whitespace-nowrap">66 / 90</p>
                                        <Tooltip title="Calls remaining to hit today's target">
                                            <TooltipTrigger>
                                                <div className="flex items-center gap-1 rounded-sm border border-primary bg-primary shadow-xs pl-1.5 pr-2 py-0.5">
                                                    <Target04 className="size-3 text-secondary" />
                                                    <span className="text-sm font-medium text-secondary whitespace-nowrap">24 to go</span>
                                                </div>
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                            <ProgressBarBase value={66} max={90} className="bg-brand-primary" />
                        </div>
                    </div>

                    {/* Top 5 Leaderboard */}
                    <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-primary p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-primary">Top 5</span>
                            <div className="flex gap-0.5 rounded-md border border-secondary bg-secondary_alt items-center">
                                <TabButton active={lbTab === "today"}     onClick={() => setLbTab("today")}>Today</TabButton>
                                <TabButton active={lbTab === "yesterday"} onClick={() => setLbTab("yesterday")}>Yesterday</TabButton>
                            </div>
                        </div>

                        <div className="flex overflow-hidden">
                            {/* Rank column */}
                            <div className="flex shrink-0 flex-col w-[50px]">
                                {leaderboardData.map(({ rank, name }, i) => (
                                    <div key={name} className={cx("flex h-14 items-center justify-center px-2", i < leaderboardData.length - 1 && "border-b border-secondary")}>
                                        <span className="text-lg leading-none">{rank}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Name + avatar column */}
                            <div className="flex flex-1 min-w-0 flex-col">
                                {leaderboardData.map(({ name, avatar }, i) => (
                                    <div key={name} className={cx("flex h-14 items-center gap-3 px-2", i < leaderboardData.length - 1 && "border-b border-secondary")}>
                                        <Avatar src={avatar} initials={name.split(" ").map(p => p[0]).join("")} size="sm" />
                                        <span className="truncate text-sm font-medium text-primary">{name}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Progress bar + % column */}
                            <div className="flex shrink-0 flex-col w-40">
                                {leaderboardData.map(({ name, pct }, i) => (
                                    <div key={name} className={cx("flex h-14 items-center gap-4 px-2", i < leaderboardData.length - 1 && "border-b border-secondary")}>
                                        <ProgressBarBase value={pct} max={8} className="bg-brand-primary" />
                                        <span className="shrink-0 text-sm font-medium text-secondary">{pct}%</span>
                                    </div>
                                ))}
                            </div>
                            {/* Count column */}
                            <div className="flex shrink-0 flex-col w-[30px]">
                                {leaderboardData.map(({ name, count }, i) => (
                                    <div key={name} className={cx("flex h-14 items-center justify-center px-2", i < leaderboardData.length - 1 && "border-b border-secondary")}>
                                        <span className="text-sm text-tertiary">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Your lead mix */}
                <div className="flex flex-col gap-4 overflow-hidden rounded-xl border border-secondary bg-primary p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-primary">Your lead mix</span>
                        <Button color="secondary" size="sm" iconTrailing={ArrowRight}>
                            View leads
                        </Button>
                    </div>

                    <div className="flex gap-4">
                        {[
                            { emoji: "💪", label: "Strong untasked",    value: "220",   badge: "1.2%" },
                            { emoji: "🥶", label: "Weak or cold tasked", value: "965",   badge: "3.4%" },
                            { emoji: "📵", label: "Never called",        value: "35785", badge: "72%"  },
                            { emoji: "🗓️", label: "90+ days tasked",     value: "382",   badge: "1%"   },
                        ].map(({ emoji, label, value, badge }) => (
                            <div key={label} className="flex flex-1 gap-4 items-start rounded-xl border border-secondary bg-secondary p-5 shadow-xs min-w-0">
                                <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-secondary bg-primary shadow-xs">
                                    <span className="text-lg leading-none">{emoji}</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-2 min-w-0">
                                    <p className="text-sm font-semibold text-tertiary">{label}</p>
                                    <div className="flex flex-wrap items-center justify-between gap-y-3">
                                        <p className="font-display text-display-sm font-semibold text-primary whitespace-nowrap">{value}</p>
                                        <div className="flex items-center rounded-sm border border-primary bg-primary shadow-xs px-2 py-0.5">
                                            <span className="text-sm font-medium text-secondary whitespace-nowrap">{badge}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const LoveyPortal = () => {
    const { pathname } = useLocation();
    const [leadsData, setLeadsData] = useState<Record<LeadStage, Lead[]>>(initialLeadsData);
    const [leadTasks, setLeadTasks] = useState<Record<string, OverlayTask[]>>(initialLeadTasks);
    const handleLeadTasksChange = useCallback((leadId: string, tasks: OverlayTask[]) => {
        setLeadTasks(prev => ({ ...prev, [leadId]: tasks }));
    }, []);
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
            // Move to accepted or declined stage
            const targetStage: LeadStage = decision === "approved" ? "accepted" : "declined";
            const alreadyInTarget = prev[targetStage].some((l) => l.id === leadId);
            newData[targetStage] = alreadyInTarget
                ? prev[targetStage].map((l) => (l.id === leadId ? updatedLead : l))
                : [...prev[targetStage], updatedLead];
            return newData;
        });
    };

    const leadIdMatch = pathname.match(/^\/portal\/lead\/(.+)$/);
    const selectedLeadId = leadIdMatch?.[1] ?? null;
    const selectedLead = selectedLeadId ? stageLeads.find((l) => l.id === selectedLeadId) ?? null : null;
    const isHomePage  = !selectedLeadId && (pathname === "/portal" || pathname === "/portal/");
    const isLeadsPage = !selectedLeadId && pathname === "/portal/leads";
    const isTasksPage = !selectedLeadId && pathname === "/portal/tasks";
    const isAppsPage    = !selectedLeadId && (pathname === "/portal/applications" || pathname === "/portal/borrowers");
    const isNoAccessPage   = !selectedLeadId && pathname === "/portal/noaccess";
    const isSupportPage    = !selectedLeadId && pathname === "/portal/bug";
    const searchRef = useRef<HTMLInputElement>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [view, setView] = useState<"board" | "table">("table");
    const [hideEmptyColumns, setHideEmptyColumns] = useState(false);

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
        <LeadTasksContext.Provider value={leadTasks}>
        <>
        {/* Sidebar — always visible so it appears on the small-screen fallback too */}
        <LoveyPortalSidebar
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
            ) : isHomePage ? (
                <PortalHomePage onRefresh={handleRefresh} isRefreshing={isRefreshing} />
            ) : isLeadsPage ? (
                <LeadsPage isRefreshing={isRefreshing} onLeadTasksChange={handleLeadTasksChange} />
            ) : isTasksPage ? (
                <TasksPage
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    allLeads={LEADS_DATA}
                    leadTasks={leadTasks}
                    onLeadTasksChange={handleLeadTasksChange}
                />
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
                                hideEmpty={hideEmptyColumns} onToggleHideEmpty={() => setHideEmptyColumns(h => !h)}
                            />
                        </div>
                        <div ref={kanbanDrag.ref} {...kanbanDrag.dragProps} className="scrollbar-hide flex-1 overflow-x-auto overflow-y-hidden">
                            <div className="flex h-full gap-4 pl-5 pt-2">
                                {columnConfig
                                    .filter(col => !hideEmptyColumns || filteredLeads[col.id].length > 0)
                                    .map((col) => (
                                        <KanbanColumn key={col.id} {...col} leads={filteredLeads[col.id]} isRefreshing={isRefreshing} />
                                    ))}
                                <div className="w-4 shrink-0" />
                            </div>
                        </div>
                    </>
                )}
            </div>
            ) : isSupportPage ? (
                <FeatureRequest />
            ) : isNoAccessPage ? (
                <NoAccess />
            ) : (
                <NotFound />
            )}
        </div>
        </>
        </LeadTasksContext.Provider>
    );
};
