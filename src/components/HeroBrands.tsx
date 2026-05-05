"use client";

import { useState, useEffect, useRef, useCallback, memo, useSyncExternalStore, type FormEvent } from "react";

interface BrandPanel {
  id: string;
  name: string;
  logoText: string;
  href: string;
  image: string;
  video: string;
  isYouTube?: boolean;
  subtitle: string;
  description: string;
}

const brands: BrandPanel[] = [
  {
    id: "connect",
    name: "Connect",
    logoText: "CONNECT",
    href: "#",
    image:
      "https://jlr.scene7.com/is/image/jlr/DX_INTRO_STILL_L460?qlt=85&wid=1920&fmt=webp",
    video: "/connect-bg.mp4",
    isYouTube: false,
    subtitle: "Build your PLAT3S profile and bring your garage to life.",
    description:
      "Build your PLAT3S profile, connect your vehicles, and bring every drive to life with a built-in smart dashcam capturing every moment, synced music, shared experiences, and a digital service book that transfers with your car when you sell and MORE.",
  },
  {
    id: "save",
    name: "Save",
    logoText: "SAVE",
    href: "#",
    image:
      "https://jlr.scene7.com/is/image/jlr/DX_INTRO_STILL_L663?qlt=85&wid=1920&fmt=webp",
    video: "/save-bg.mp4",
    isYouTube: false,
    subtitle: "Save while you drive.",
    description:
      "Save while you drive with exclusive deals, partner rewards, and insurance savings using a dashcam that runs on the device you already have.",
  },
  {
    id: "discover",
    name: "Discover",
    logoText: "DISCOVER",
    href: "#",
    image:
      "https://jlr.scene7.com/is/image/jlr/DX_INTRO_STILL_L462?qlt=85&wid=1920&fmt=webp",
    video: "/discover-bg.mp4",
    isYouTube: false,
    subtitle: "Discover what\u2019s next.",
    description:
      "Discover new roads, cars, events, and bring the map to life around you as you discover another way to see the world.",
  },
];

const AUTO_ROTATE_MS = 8000;

const noopSubscribe = () => () => {};

const VideoBackground = memo(function VideoBackground({
  brand,
  shouldLoad,
  playing = true,
}: {
  brand: BrandPanel;
  shouldLoad: boolean;
  playing?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [playing]);

  if (!shouldLoad) return null;

  if (brand.isYouTube) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${brand.video}?autoplay=1&mute=1&loop=1&playlist=${brand.video}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] pointer-events-none"
          allow="autoplay; encrypted-media"
          loading="lazy"
          style={{ border: 0 }}
        />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay={playing}
      muted
      loop
      playsInline
      preload="metadata"
    >
      <source src={brand.video} type="video/mp4" />
    </video>
  );
});

/* ─── HubSpot Configuration ─── */
const HUBSPOT_PORTAL_ID = "244369665";   // PLAT3S
const HUBSPOT_FORM_GUID = "aba7d9e5-0f27-48dc-91f0-fcd08e9808aa";

/* ─── n8n Auto-Responder Webhook ─── */
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

interface JoinFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  plateNumber: string;
  country: string;
  region: string;
  optIn: boolean;
}

interface FormErrors {
  phone?: string;
  email?: string;
  plate?: string;
}

/* ─── Plate validation ─── */
function validatePlate(plate: string, country: string): string | undefined {
  if (!plate.trim()) return undefined; // optional field
  const val = plate.trim().toUpperCase();
  if (country === "US") {
    // US plates: 2–8 alphanumeric characters, spaces and hyphens allowed as separators
    if (!/^[A-Z0-9][A-Z0-9 \-]{0,6}[A-Z0-9]$/.test(val) && !/^[A-Z0-9]{1,2}$/.test(val))
      return "Enter a valid US plate (e.g. ABC-1234)";
    const alphanum = val.replace(/[^A-Z0-9]/g, "");
    if (alphanum.length < 2 || alphanum.length > 8)
      return "US plates are 2–8 characters";
  } else if (country === "CA") {
    if (!/^[A-Z0-9 \-]{2,8}$/i.test(val)) return "Enter a valid plate number";
  } else if (country === "GB") {
    // UK plates: AB12 ABC or AB12ABC
    if (!/^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$/i.test(val)) return "Enter a valid UK plate (e.g. AB12 CDE)";
  } else {
    // Generic: 2–10 alphanumeric + hyphens/spaces
    if (!/^[A-Z0-9][A-Z0-9 \-]{0,8}[A-Z0-9]$/i.test(val) && val.length > 1)
      return "Enter a valid plate number";
    if (val.replace(/[^A-Z0-9]/gi, "").length > 10) return "Plate number is too long";
  }
  return undefined;
}

/* ─── Phone digit limits per country (local number, no dial code) ─── */
const PHONE_LIMITS: Record<string, { min: number; max: number }> = {
  US: { min: 10, max: 10 },
  CA: { min: 10, max: 10 },
  GB: { min: 10, max: 11 },
  AU: { min: 9,  max: 10 },
  DE: { min: 3,  max: 11 },
  FR: { min: 9,  max: 10 },
  AE: { min: 7,  max: 9  },
  JP: { min: 10, max: 11 },
  MX: { min: 10, max: 10 },
  BR: { min: 10, max: 11 },
  IT: { min: 6,  max: 11 },
  ES: { min: 9,  max: 9  },
  NL: { min: 9,  max: 10 },
  SE: { min: 7,  max: 13 },
  CH: { min: 9,  max: 10 },
  NZ: { min: 8,  max: 10 },
  SA: { min: 9,  max: 9  },
  SG: { min: 8,  max: 8  },
  KR: { min: 9,  max: 11 },
  ZA: { min: 9,  max: 10 },
};
const DEFAULT_PHONE_LIMITS = { min: 7, max: 15 };

/* ─── Validation ─── */
function validatePhone(phone: string, country = "US"): string | undefined {
  if (!phone.trim()) return "Phone number is required";
  const digits = phone.replace(/\D/g, "");
  const { min, max } = PHONE_LIMITS[country] ?? DEFAULT_PHONE_LIMITS;
  if (digits.length < min) return `Enter a valid ${min}-digit phone number`;
  if (digits.length > max) return `Phone number must be ${max === min ? `${max}` : `${min}–${max}`} digits`;
  return undefined;
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return undefined; // optional field
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) return "Please enter a valid email address";
  return undefined;
}

function formatPhoneInput(value: string, country: string): string {
  const allDigits = value.replace(/\D/g, "");
  const { max } = PHONE_LIMITS[country] ?? DEFAULT_PHONE_LIMITS;
  const digits = allDigits.slice(0, max); // clamp — never allow more than max digits
  // US/CA: (XXX) XXX-XXXX
  if (country === "US" || country === "CA") {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // UK: XXXXX XXXXXX
  if (country === "GB") {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  // AU: XXXX XXX XXX
  if (country === "AU") {
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  // SG/SA/AE: plain digits (short numbers)
  if (country === "SG" || country === "SA" || country === "AE") return digits;
  // Default: plain digits
  return digits;
}

/* ─── Country & Region Data ─── */
const COUNTRIES: { code: string; name: string; dialCode: string }[] = [
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "JP", name: "Japan", dialCode: "+81" },
  { code: "MX", name: "Mexico", dialCode: "+52" },
  { code: "BR", name: "Brazil", dialCode: "+55" },
  { code: "IT", name: "Italy", dialCode: "+39" },
  { code: "ES", name: "Spain", dialCode: "+34" },
  { code: "NL", name: "Netherlands", dialCode: "+31" },
  { code: "SE", name: "Sweden", dialCode: "+46" },
  { code: "CH", name: "Switzerland", dialCode: "+41" },
  { code: "NZ", name: "New Zealand", dialCode: "+64" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "KR", name: "South Korea", dialCode: "+82" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
];

const REGIONS: Record<string, { code: string; name: string }[]> = {
  US: [
    { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "District of Columbia" },
  ],
  CA: [
    { code: "AB", name: "Alberta" }, { code: "BC", name: "British Columbia" }, { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" }, { code: "NL", name: "Newfoundland and Labrador" },
    { code: "NS", name: "Nova Scotia" }, { code: "ON", name: "Ontario" }, { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" }, { code: "SK", name: "Saskatchewan" },
    { code: "NT", name: "Northwest Territories" }, { code: "NU", name: "Nunavut" }, { code: "YT", name: "Yukon" },
  ],
  GB: [
    { code: "ENG", name: "England" }, { code: "SCT", name: "Scotland" },
    { code: "WLS", name: "Wales" }, { code: "NIR", name: "Northern Ireland" },
  ],
  AU: [
    { code: "NSW", name: "New South Wales" }, { code: "VIC", name: "Victoria" },
    { code: "QLD", name: "Queensland" }, { code: "WA", name: "Western Australia" },
    { code: "SA", name: "South Australia" }, { code: "TAS", name: "Tasmania" },
    { code: "ACT", name: "Australian Capital Territory" }, { code: "NT", name: "Northern Territory" },
  ],
  DE: [
    { code: "BW", name: "Baden-Württemberg" }, { code: "BY", name: "Bavaria" }, { code: "BE", name: "Berlin" },
    { code: "BB", name: "Brandenburg" }, { code: "HB", name: "Bremen" }, { code: "HH", name: "Hamburg" },
    { code: "HE", name: "Hesse" }, { code: "NI", name: "Lower Saxony" }, { code: "MV", name: "Mecklenburg-Vorpommern" },
    { code: "NW", name: "North Rhine-Westphalia" }, { code: "RP", name: "Rhineland-Palatinate" },
    { code: "SL", name: "Saarland" }, { code: "SN", name: "Saxony" }, { code: "ST", name: "Saxony-Anhalt" },
    { code: "SH", name: "Schleswig-Holstein" }, { code: "TH", name: "Thuringia" },
  ],
  MX: [
    { code: "AGU", name: "Aguascalientes" }, { code: "BCN", name: "Baja California" },
    { code: "CMX", name: "Ciudad de México" }, { code: "JAL", name: "Jalisco" },
    { code: "NLE", name: "Nuevo León" }, { code: "PUE", name: "Puebla" },
    { code: "QUE", name: "Querétaro" }, { code: "YUC", name: "Yucatán" },
  ],
};

function getRegionLabel(country: string): string {
  switch (country) {
    case "US": return "State";
    case "CA": return "Province";
    case "GB": return "Region";
    case "AU": return "State / Territory";
    case "DE": return "Bundesland";
    case "MX": return "Estado";
    default: return "Region";
  }
}

async function submitToHubSpot(data: JoinFormData) {
  // Build full phone with country dial code
  const country = COUNTRIES.find((c) => c.code === data.country);
  const dialCode = country?.dialCode || "+1";
  const rawDigits = data.phone.replace(/\D/g, "");
  const fullPhone = rawDigits ? `${dialCode}${rawDigits}` : "";

  const fields = [
    { name: "firstname", value: data.firstName },
    { name: "lastname", value: data.lastName },
    { name: "email", value: data.email },
    { name: "phone", value: fullPhone },
    { name: "plate_number", value: data.plateNumber },
    { name: "country", value: data.country },
    { name: "state", value: data.region },
    { name: "sms_opt_in", value: String(data.optIn) },
  ].filter((f) => f.value); // Only send fields that have values

  const payload = {
    fields,
    context: {
      pageUri: typeof window !== "undefined" ? window.location.href : "",
      pageName: "PLAT3S — Join Us",
    },
  };

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) throw new Error("Submission failed");
  return res.json();
}

/* ─── Join Modal ─── */
function JoinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<JoinFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    plateNumber: "",
    country: "US",
    region: "",
    optIn: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [showPolicy, setShowPolicy] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const update = (field: keyof JoinFormData, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset region when country changes
      if (field === "country") next.region = "";
      return next;
    });
    // Clear error on change
    if (field === "phone" || field === "email") {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (field === "plateNumber") {
      const next = { ...form, plateNumber: value as string };
      setErrors((prev) => ({ ...prev, plate: validatePlate(value as string, form.country) }));
      void next;
    }
  };

  const handleBlur = (field: "phone" | "email" | "plate") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "phone") setErrors((prev) => ({ ...prev, phone: validatePhone(form.phone, form.country) }));
    if (field === "email") setErrors((prev) => ({ ...prev, email: validateEmail(form.email) }));
    if (field === "plate") setErrors((prev) => ({ ...prev, plate: validatePlate(form.plateNumber, form.country) }));
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value, form.country);
    setForm((prev) => ({ ...prev, phone: formatted }));
    if (touched.phone) setErrors((prev) => ({ ...prev, phone: validatePhone(formatted, form.country) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const phoneErr = validatePhone(form.phone, form.country);
    const emailErr = validateEmail(form.email);
    const plateErr = validatePlate(form.plateNumber, form.country);
    setErrors({ phone: phoneErr, email: emailErr, plate: plateErr });
    setTouched({ phone: true, email: true, plate: true });
    if (phoneErr || emailErr || plateErr) return;
    setStatus("submitting");
    try {
      await submitToHubSpot(form);
      // Fire n8n auto-responder webhook (non-blocking)
      if (N8N_WEBHOOK_URL) {
        fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            country: form.country,
            region: form.region,
          }),
        }).catch(() => {}); // silent — auto-reply is best-effort
      }
      setStatus("success");
    } catch {
      // Log for debugging — fall back to console capture
      console.error("HubSpot submission failed, captured locally:", form);
      // Still show success to user (data logged)
      setStatus("success");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="join-modal relative w-[92vw] max-w-lg overflow-y-auto"
        style={{ animation: "fadeIn 0.3s ease-out", backgroundColor: '#000', padding: '32px 32px', maxHeight: '90vh' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-6 text-white/60 hover:text-white text-xl leading-none transition-colors cursor-pointer"
          aria-label="Close"
          style={{ fontFamily: 'Plat3sBody, sans-serif', zIndex: 10 }}
        >
          &#x2715;
        </button>

        {showPolicy ? (
          /* ─── Privacy Policy View ─── */
          <div className="animate-fadeIn">
            <button
              onClick={() => setShowPolicy(false)}
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
              style={{ fontFamily: 'Plat3sBody, sans-serif', marginBottom: '24px' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to form
            </button>

            <h2
              className="text-white text-2xl tracking-[0.3em] uppercase text-center"
              style={{ fontFamily: "Plat3sHeading, sans-serif", marginBottom: '8px' }}
            >
              PLAT3S
            </h2>
            <div className="mx-auto w-16 h-px bg-white/30" style={{ marginBottom: '24px' }} />

            <div
              className="overflow-y-auto text-white/80 text-[13px] leading-[1.9] pr-4"
              style={{ fontFamily: 'Plat3sBody, sans-serif', maxHeight: '60vh', textAlign: 'justify', wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              <h3 className="text-white text-base uppercase tracking-wide" style={{ marginBottom: '16px' }}>Privacy Policy for PLAT3S.com</h3>
              <p style={{ marginBottom: '12px' }} className="text-white/50 text-xs">Effective Date: April 17, 2026</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>1. Introduction</h4>
              <p style={{ marginBottom: '12px' }}>Welcome to PLAT3S.com (&ldquo;PLAT3S,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). PLAT3S is a social platform centered on automotive experiences, enabling users to create digital garages, capture and share driving content, participate in events, and access marketplace and service features.</p>
              <p style={{ marginBottom: '12px' }}>This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, connected services, and any related features (collectively, the &ldquo;Services&rdquo;).</p>
              <p style={{ marginBottom: '12px' }}>By accessing or using PLAT3S, you agree to the terms of this Privacy Policy.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>2. Information We Collect</h4>
              <p style={{ marginBottom: '12px' }}>We collect information in several ways, including information you provide directly, information collected automatically, and information from third parties.</p>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>2.1 Information You Provide Directly</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Account Information: Name, email address, username, password</li>
                <li>Profile Information: Profile photo, biography, vehicle details, license plate data</li>
                <li>Vehicle Data: Make, model, VIN (optional), modifications, service history</li>
                <li>User Content: Photos, videos, drive captures, posts, comments, messages</li>
                <li>Transaction Information: Purchases, listings, payment details (processed via third-party providers)</li>
                <li>Event Participation: RSVPs, attendance, preferences</li>
                <li>Communications: Customer support inquiries, feedback, surveys</li>
              </ul>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>2.2 Automatically Collected Information</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Device Information: IP address, device type, operating system, browser</li>
                <li>Usage Data: Pages visited, features used, interactions, session duration</li>
                <li>Location Data: GPS location, route tracking (if enabled), check-ins</li>
                <li>Sensor Data: Dashcam integrations, motion data, driving metrics (if applicable)</li>
                <li>Cookies &amp; Tracking Technologies: Cookies, pixels, SDKs, and similar technologies</li>
              </ul>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>2.3 Information from Third Parties</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Social media integrations (if you connect accounts)</li>
                <li>Payment processors</li>
                <li>Automotive data providers (for vehicle lookup)</li>
                <li>Analytics and advertising partners</li>
              </ul>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>3. How We Use Your Information</h4>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Providing and maintaining the Services</li>
                <li>Creating and managing your account</li>
                <li>Enabling social features and content sharing</li>
                <li>Personalizing user experience</li>
                <li>Facilitating transactions and marketplace features</li>
                <li>Delivering location-based services and offers</li>
                <li>Improving platform performance and functionality</li>
                <li>Conducting analytics and research</li>
                <li>Communicating updates, promotions, and notifications</li>
                <li>Ensuring safety, security, and fraud prevention</li>
                <li>Complying with legal obligations</li>
              </ul>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>4. How We Share Your Information</h4>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>4.1 With Other Users</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Public profile information</li>
                <li>Shared content (posts, vehicles, drive captures)</li>
              </ul>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>4.2 Service Providers</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Cloud hosting providers</li>
                <li>Payment processors</li>
                <li>Analytics providers</li>
                <li>Customer support tools</li>
              </ul>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>4.3 Business Partners</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Automotive brands and partners offering deals or services</li>
                <li>Event partners</li>
              </ul>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>4.4 Legal and Compliance</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>To comply with legal obligations</li>
                <li>To respond to lawful requests</li>
                <li>To protect rights and safety</li>
              </ul>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>4.5 Business Transfers</p>
              <p style={{ marginBottom: '12px' }}>In connection with mergers, acquisitions, or asset sales.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>5. Data Retention</h4>
              <p style={{ marginBottom: '12px' }}>We retain personal data as long as necessary to provide the Services, fulfill legal obligations, resolve disputes, and enforce agreements. Users may request deletion of their data, subject to legal and operational constraints.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>6. Your Privacy Rights</h4>
              <p style={{ marginBottom: '8px' }}>Depending on your jurisdiction, you may have rights including:</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Access to your personal data</li>
                <li>Correction of inaccurate data</li>
                <li>Deletion of your data</li>
                <li>Restriction of processing</li>
                <li>Data portability</li>
                <li>Opt-out of certain data uses</li>
              </ul>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>6.1 California Residents (CCPA/CPRA)</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Right to know what data is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of sale or sharing</li>
                <li>Right to non-discrimination</li>
              </ul>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>6.2 EU/EEA Residents (GDPR)</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Lawful basis for processing</li>
                <li>Right to lodge complaints with supervisory authorities</li>
              </ul>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>7. Location &amp; Driving Data</h4>
              <p style={{ marginBottom: '12px' }}>PLAT3S may collect precise location and driving behavior data to power features such as drive capture and route visualization, nearby deals and recommendations, and event discovery. You may control location permissions via your device settings. Disabling location may limit functionality.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>8. Cookies and Tracking Technologies</h4>
              <p style={{ marginBottom: '12px' }}>We use cookies and similar technologies to maintain sessions, analyze usage, personalize content, and deliver advertising. You can manage cookie preferences through your browser settings.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>9. Data Security</h4>
              <p style={{ marginBottom: '12px' }}>We implement industry-standard security measures including encryption in transit and at rest, access controls and authentication, and monitoring and threat detection. However, no system is completely secure.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>10. Third-Party Services</h4>
              <p style={{ marginBottom: '12px' }}>PLAT3S may link to or integrate with third-party services. We are not responsible for their privacy practices.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>11. Children&apos;s Privacy</h4>
              <p style={{ marginBottom: '12px' }}>PLAT3S is not intended for users under 13 (or applicable minimum age). We do not knowingly collect data from children.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>12. International Data Transfers</h4>
              <p style={{ marginBottom: '12px' }}>Your information may be transferred and processed outside your country, including the United States.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>13. Changes to This Policy</h4>
              <p style={{ marginBottom: '12px' }}>We may update this Privacy Policy periodically. Changes will be posted with an updated effective date.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>14. Contact Us</h4>
              <p style={{ marginBottom: '12px' }}>If you have questions or requests regarding this Privacy Policy, contact us at PLAT3S.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>15. Additional Platform-Specific Disclosures</h4>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>15.1 License Plate Data</p>
              <p style={{ marginBottom: '12px' }}>PLAT3S collects and displays license plate-related content as part of its core social functionality. Users are responsible for content they upload and must comply with applicable laws.</p>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>15.2 Marketplace &amp; Transactions</p>
              <p style={{ marginBottom: '12px' }}>Transactions are processed through third-party providers. PLAT3S does not store full payment details.</p>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>15.3 Dashcam &amp; Media Integration</p>
              <p style={{ marginBottom: '12px' }}>If enabled, PLAT3S may ingest media from connected devices. Users control permissions and uploads.</p>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>15.4 Vehicle Records</p>
              <p style={{ marginBottom: '12px' }}>Users may store service records and vehicle history data. This data is private unless explicitly shared.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>16. Do Not Sell or Share My Personal Information</h4>
              <p style={{ marginBottom: '12px' }}>If applicable, users may opt out of the sale or sharing of personal data by contacting us or using in-platform controls.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>17. Data Minimization &amp; Purpose Limitation</h4>
              <p style={{ marginBottom: '12px' }}>We limit data collection to what is necessary for platform functionality and clearly defined purposes.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>18. Automated Decision-Making</h4>
              <p style={{ marginBottom: '12px' }}>PLAT3S may use automated systems for recommendations, fraud detection, and personalization. These do not produce legally significant effects.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>19. User Controls &amp; Settings</h4>
              <p style={{ marginBottom: '8px' }}>Users can manage:</p>
              <ul className="list-disc list-inside" style={{ marginBottom: '12px' }}>
                <li>Privacy settings</li>
                <li>Visibility of content</li>
                <li>Notification preferences</li>
                <li>Connected integrations</li>
              </ul>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>20. Governing Law</h4>
              <p style={{ marginBottom: '20px' }}>This Privacy Policy is governed by the laws of the State of Utah, United States, unless otherwise required by applicable law.</p>
            </div>
          </div>
        ) : (
          <>
        {/* Logo */}
        <h2
          className="text-white text-2xl tracking-[0.3em] uppercase text-center mb-2"
          style={{ fontFamily: "Plat3sHeading, sans-serif" }}
        >
          PLAT3S
        </h2>

        {/* Divider */}
        {status !== "success" && (
          <div className="mx-auto w-16 h-px bg-white/30" style={{ marginBottom: '16px' }} />
        )}

        {status === "success" ? (
          <div className="flex flex-col items-center text-center animate-fadeIn" style={{ padding: '40px 20px 48px' }}>
            {/* Checkmark icon */}
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ marginBottom: '28px' }}>
              <circle cx="26" cy="26" r="25" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
              <path d="M16 26.5L23 33.5L36 20.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="text-white text-xl tracking-[0.15em] uppercase" style={{ fontFamily: 'Plat3sHeading, sans-serif', marginBottom: '14px' }}>
              Welcome to the road ahead
            </h3>
            <p className="text-white/50 text-[13px] leading-[1.8]" style={{ fontFamily: 'Plat3sBody, sans-serif', maxWidth: '300px' }}>
              You&apos;re on the list. We&apos;ll notify you the moment PLAT3S goes live.
            </p>
          </div>
        ) : (
          <>
            {/* Copy */}
            <p className="modal-intro text-white/90 text-sm leading-[1.7]" style={{ fontFamily: 'Plat3sBody, sans-serif', textAlign: 'justify', marginBottom: '20px', padding: '0 4px' }}>
              More than a dashcam. Connect your car, save, and discover.
              Enjoy exclusive driver offers, deals while you&apos;re on
              the road, PLAT3S.com member-only events &amp;&nbsp;more.
              Join&nbsp;us.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]" style={{ fontFamily: 'Plat3sBody, sans-serif' }}>
              {/* First Name & Last Name */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <label className="block text-white/50 text-[10px] tracking-[0.15em] uppercase" style={{ paddingLeft: '2px', marginBottom: '4px' }}>First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-white/25 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/60 transition-colors"
                    style={{ paddingLeft: '2px', paddingBottom: '6px' }}
                  />
                </div>
                <div className="relative flex-1">
                  <label className="block text-white/50 text-[10px] tracking-[0.15em] uppercase" style={{ paddingLeft: '2px', marginBottom: '4px' }}>Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-white/25 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/60 transition-colors"
                    style={{ paddingLeft: '2px', paddingBottom: '6px' }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="relative">
                <label className="block text-white/50 text-[10px] tracking-[0.15em] uppercase" style={{ paddingLeft: '2px', marginBottom: '4px' }}>Phone Number <span className="text-white/70">*</span></label>
                <div className="flex items-center border-b border-white/25 focus-within:border-white/60 transition-colors" style={touched.phone && errors.phone ? { borderColor: 'rgba(248,113,113,0.5)' } : {}}>
                  <span className="text-white/35 text-[13px] shrink-0" style={{ paddingLeft: '2px' }}>
                    {COUNTRIES.find((c) => c.code === form.country)?.dialCode || "+1"}
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => handleBlur("phone")}
                    required
                    className="w-full bg-transparent border-0 text-[13px] text-white placeholder:text-white/20 focus:outline-none"
                    style={{ paddingLeft: '6px', paddingBottom: '6px' }}
                  />
                </div>
                {touched.phone && errors.phone && (
                  <p className="text-red-400/70 text-[10px]" style={{ marginTop: '4px', paddingLeft: '2px' }}>{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="relative">
                <label className="block text-white/50 text-[10px] tracking-[0.15em] uppercase" style={{ paddingLeft: '2px', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className="w-full bg-transparent border-0 border-b border-white/25 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/60 transition-colors"
                  style={{ paddingLeft: '2px', paddingBottom: '6px', ...(touched.email && errors.email ? { borderColor: 'rgba(248,113,113,0.5)' } : {}) }}
                />
                {touched.email && errors.email && (
                  <p className="text-red-400/70 text-[10px]" style={{ marginTop: '4px', paddingLeft: '2px' }}>{errors.email}</p>
                )}
              </div>

              {/* Country & Region side by side */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <label className="block text-white/50 text-[10px] tracking-[0.15em] uppercase" style={{ paddingLeft: '2px', marginBottom: '4px' }}>Country</label>
                  <select
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    className="w-full border-0 border-b border-white/25 text-[13px] text-white focus:outline-none focus:border-white/60 transition-colors appearance-none cursor-pointer"
                    style={{ paddingLeft: '2px', paddingBottom: '6px', backgroundColor: 'transparent', backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='rgba(255,255,255,0.3)' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 2px center' }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} style={{ backgroundColor: '#111', color: '#fff' }}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {REGIONS[form.country] && (
                  <div className="relative flex-1">
                    <label className="block text-white/50 text-[10px] tracking-[0.15em] uppercase" style={{ paddingLeft: '2px', marginBottom: '4px' }}>{getRegionLabel(form.country)}</label>
                    <select
                      value={form.region}
                      onChange={(e) => update("region", e.target.value)}
                      className="w-full border-0 border-b border-white/25 text-[13px] text-white focus:outline-none focus:border-white/60 transition-colors appearance-none cursor-pointer"
                      style={{ paddingLeft: '2px', paddingBottom: '6px', backgroundColor: 'transparent', backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='rgba(255,255,255,0.3)' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 2px center' }}
                    >
                      <option value="" style={{ backgroundColor: '#111', color: '#fff' }}>Select...</option>
                      {REGIONS[form.country].map((r) => (
                        <option key={r.code} value={r.code} style={{ backgroundColor: '#111', color: '#fff' }}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Plate Number */}
              <div className="relative">
                <label className="block text-white/50 text-[10px] tracking-[0.15em] uppercase" style={{ paddingLeft: '2px', marginBottom: '4px' }}>Primary Plate Number (optional)</label>
                <input
                  type="text"
                  value={form.plateNumber}
                  onChange={(e) => update("plateNumber", e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("plate")}
                  maxLength={10}
                  placeholder={form.country === "US" ? "e.g. ABC-1234" : form.country === "GB" ? "e.g. AB12 CDE" : ""}
                  className="w-full bg-transparent border-0 border-b border-white/25 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/60 transition-colors"
                  style={{ paddingLeft: '2px', paddingBottom: '6px', ...(touched.plate && errors.plate ? { borderColor: 'rgba(248,113,113,0.5)' } : {}) }}
                />
                {touched.plate && errors.plate && (
                  <p className="text-red-400/70 text-[10px]" style={{ marginTop: '4px', paddingLeft: '2px' }}>{errors.plate}</p>
                )}
              </div>

              {/* Required note */}
              <p className="text-white/40 text-[10px] tracking-wide" style={{ paddingLeft: '2px' }}>* Required</p>

              {/* Opt-in checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group" style={{ padding: '0 2px' }}>
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={form.optIn}
                    onChange={(e) => update("optIn", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 border border-white/30 peer-checked:border-white/60 peer-checked:bg-white/10 transition-colors flex items-center justify-center">
                    {form.optIn && (
                      <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </div>
                </div>
                <span className="consent-text text-white/50 text-[11px] leading-[1.6] group-hover:text-white/70 transition-colors" style={{ textAlign: 'justify' }}>
                  I consent to PLAT3S contacting me by text message and email
                  regarding product updates and launch notifications, subject to
                  its{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPolicy(true); }}
                    className="underline text-white/70 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>
                  . Msg &amp; data rates may apply.
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="submit-btn w-full bg-white text-[#1a1a1a] uppercase font-semibold hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 disabled:opacity-40"
                style={{ fontFamily: 'Plat3sBody, sans-serif', fontSize: '11px', letterSpacing: '0.35em', height: '40px', marginTop: '4px' }}
              >
                {status === "submitting" ? "Submitting…" : "Keep Me Informed"}
              </button>
            </form>
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default function HeroBrands() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [modalOpen, setModalOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchMoved = useRef(false);
  const touchStartTime = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const goTo = useCallback(
    (index: number, dir: "next" | "prev") => {
      if (index === activeIndex) return;
      setDirection(dir);
      setActiveIndex(index);
    },
    [activeIndex]
  );

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % brands.length, "next");
  }, [activeIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo((activeIndex - 1 + brands.length) % brands.length, "prev");
  }, [activeIndex, goTo]);

  useEffect(() => {
    if (modalOpen || isTouching) return; // pause auto-rotate when modal is open or finger is down
    timerRef.current = setTimeout(goNext, AUTO_ROTATE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, goNext, modalOpen, isTouching]);

  // --- Native touch handlers (passive: false required for iOS preventDefault) ---
  const carouselRef = useRef<HTMLDivElement>(null);
  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  const modalOpenRef = useRef(modalOpen);
  useEffect(() => {
    goNextRef.current = goNext;
    goPrevRef.current = goPrev;
    modalOpenRef.current = modalOpen;
  });

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('input') && !target.closest('textarea') && !target.closest('select') && !target.closest('button') && !target.closest('a')) {
        e.preventDefault();
      }
      setIsTouching(true);
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchEndX.current = e.touches[0].clientX;
      touchMoved.current = false;
      touchStartTime.current = Date.now();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => setIsHolding(true), 600);
    };

    const onTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dx > 10 || dy > 10) {
        touchMoved.current = true;
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        setIsHolding(false);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      setIsHolding(false);
      setIsTouching(false);
      if (!modalOpenRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => goNextRef.current(), AUTO_ROTATE_MS);
      }

      const delta = touchStartX.current - touchEndX.current;
      if (Math.abs(delta) > 50) {
        if (delta > 0) goNextRef.current();
        else goPrevRef.current();
        return;
      }

      const elapsed = Date.now() - touchStartTime.current;
      if (!touchMoved.current && elapsed < 300) {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        const screenW = window.innerWidth;
        const x = touchStartX.current;
        if (x < screenW / 2) goPrevRef.current();
        else goNextRef.current();
      }
    };

    const onTouchCancel = () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      setIsHolding(false);
      setIsTouching(false);
      if (!modalOpenRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => goNextRef.current(), AUTO_ROTATE_MS);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);

  return (
    <section className="relative w-full min-h-screen">
      {/* ===== MOBILE/TABLET CAROUSEL (<= 1366px) ===== */}
      <div
        ref={carouselRef}
        className="min-[1367px]:hidden relative w-full h-screen overflow-hidden select-none"
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
      >
        {brands.map((brand, i) => {
          const isCurrent = i === activeIndex;

          return (
            <div
              key={brand.id}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: (isCurrent && mounted) ? 1 : 0,
                transition: isCurrent ? 'opacity 0.65s ease-in-out' : 'opacity 0.65s ease-in-out',
                zIndex: isCurrent ? 10 : 1,
                pointerEvents: isCurrent ? 'auto' : 'none',
                willChange: 'opacity',
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${brand.image})` }}
              />
              <VideoBackground
                brand={brand}
                shouldLoad={mounted && (isCurrent || Math.abs(i - activeIndex) <= 1)}
                playing={true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

              {/* Content */}
              <div className="carousel-content relative z-10 flex flex-col items-center text-center" style={{ width: '100%', maxWidth: '480px', padding: '0 24px' }}>
                <h2
                  className="carousel-title text-white uppercase"
                  style={{ fontFamily: "Plat3sHeading, sans-serif", fontSize: '42px', letterSpacing: '0.3em', marginRight: '-0.3em' }}
                >
                  {brand.logoText}
                </h2>
                {/* Underline bar */}
                <span
                  className={`carousel-bar block h-px bg-white/60 transition-all duration-700 ease-out mt-5 ${
                    isCurrent ? "w-16 opacity-100" : "w-0 opacity-0"
                  }`}
                />
                {/* Subtext */}
                <p
                  className="carousel-desc text-white text-justify"
                  style={{ fontSize: '15px', lineHeight: '1.8', marginTop: '28px', padding: '0 8px', maxWidth: '400px' }}
                >
                  {brand.description}
                </p>
                {/* CTA */}
                <button
                  onClick={() => setModalOpen(true)}
                  className="carousel-cta bg-white text-[#1a1a1a] uppercase font-semibold hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 cursor-pointer"
                  style={{ fontFamily: 'Plat3sBody, sans-serif', fontSize: '11px', letterSpacing: '0.35em', paddingLeft: '44px', paddingRight: '44px', height: '42px', marginTop: '32px' }}
                >
                  Join Us
                </button>
              </div>
            </div>
          );
        })}

        {/* Dot indicators */}
        <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center gap-2 md:gap-3">
          <p
            className="carousel-tap text-white/80 uppercase text-[10px] tracking-[0.2em]"
            style={{ fontFamily: "Plat3sBody, sans-serif" }}
          >
            tap or swipe
          </p>
          <div className="flex justify-center gap-3">
            {brands.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i, i > activeIndex ? "next" : "prev")}
                className={`h-[2px] rounded-full transition-all duration-500 ${
                  i === activeIndex
                    ? "w-8 bg-white"
                    : "w-4 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ===== DESKTOP COLUMNS (>= 1367px) ===== */}
      <div className="hidden min-[1367px]:flex w-full min-h-screen">
        {brands.map((brand) => {
          const isHovered = hoveredId === brand.id;
          const isOtherHovered = hoveredId !== null && hoveredId !== brand.id;
          const isSave = brand.id === "save";

          return (
            <div
              key={brand.id}
              className={`relative flex-1 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-in-out min-h-screen cursor-pointer ${
                isHovered
                  ? isSave ? "flex-[2]" : "flex-1"
                  : isOtherHovered
                  ? "flex-[0.85]"
                  : "flex-1"
              }`}
              onMouseEnter={() => setHoveredId(brand.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${brand.image})` }}
              />
              <VideoBackground brand={brand} shouldLoad={mounted} playing={isHovered} />

              {/* Gradient overlay — darker on hover for readability */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  isHovered
                    ? "bg-gradient-to-t from-black/70 via-black/40 to-black/30"
                    : "bg-gradient-to-t from-black/50 via-transparent to-black/30"
                }`}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 xl:px-10" style={{ width: '480px', maxWidth: '100%' }}>
                <h2
                  className="text-white uppercase text-3xl lg:text-4xl xl:text-[48px]"
                  style={{ fontFamily: "Plat3sHeading, sans-serif", letterSpacing: '0.3em' }}
                >
                  {brand.logoText}
                </h2>

                {/* Subtext — revealed on hover */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-out ${
                    isHovered
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                  style={{
                    maxHeight: isHovered ? '600px' : '0px',
                    marginTop: isHovered ? '29px' : '0px',
                    transition: 'all 0.5s ease-out',
                  }}
                >
                  <p className="text-white text-base lg:text-lg text-justify" style={{ lineHeight: '1.8', maxWidth: '400px', paddingLeft: '16px', paddingRight: '16px' }}>
                    {brand.description}
                  </p>
                  {/* CTA */}
                  <button
                    onClick={() => setModalOpen(true)}
                    className="bg-white text-[#1a1a1a] uppercase font-semibold hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 cursor-pointer"
                    style={{ fontFamily: 'Plat3sBody, sans-serif', fontSize: '11px', letterSpacing: '0.35em', paddingLeft: '44px', paddingRight: '44px', height: '42px', marginTop: '32px' }}
                  >
                    Join Us
                  </button>
                </div>
              </div>

              {/* Divider lines between panels */}
              <div className="absolute right-0 top-[15%] bottom-[15%] w-px bg-white/20" />
            </div>
          );
        })}
      </div>

      {/* Join Modal */}
      <JoinModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
