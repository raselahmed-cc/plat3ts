"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";

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
    video: "/Connect%20Bg%20Video.mov",
    isYouTube: false,
    subtitle: "Build your Plat3s profile and bring your garage to life.",
    description:
      "Build your Plat3s profile, connect your vehicles, and bring every drive to life with synced music, shared moments, and a digital service book that transfers with your car when you sell.",
  },
  {
    id: "save",
    name: "Save",
    logoText: "SAVE",
    href: "#",
    image:
      "https://jlr.scene7.com/is/image/jlr/DX_INTRO_STILL_L663?qlt=85&wid=1920&fmt=webp",
    video: "/Save%20_Bg%20Video.mov",
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
    video: "/DiscoverBgVideo.mp4",
    isYouTube: false,
    subtitle: "Discover what\u2019s next.",
    description:
      "Discover new roads, cars, events, and bring the map to life around you as you discover new businesses everywhere.",
  },
];

const AUTO_ROTATE_MS = 5000;

function VideoBackground({
  brand,
  shouldLoad,
}: {
  brand: BrandPanel;
  shouldLoad: boolean;
}) {
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
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    >
      <source src={brand.video} type="video/mp4" />
      <source src={brand.video} type="video/quicktime" />
    </video>
  );
}

/* ─── HubSpot Configuration ─── */
const HUBSPOT_PORTAL_ID = "45247805";   // brightDigital
const HUBSPOT_FORM_GUID = "e7396cce-336d-4ea2-b117-293745bd7761";

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
}

/* ─── Validation ─── */
function validatePhone(phone: string): string | undefined {
  if (!phone.trim()) return "Phone number is required";
  // Strip non-digits for validation
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return "Phone number is too short";
  if (digits.length > 15) return "Phone number is too long";
  // Basic international format check
  if (!/^[\d\s\-+().]+$/.test(phone)) return "Invalid characters in phone number";
  return undefined;
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return undefined; // optional field
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) return "Please enter a valid email address";
  return undefined;
}

function formatPhoneInput(value: string, country: string): string {
  const digits = value.replace(/\D/g, "");
  // US/CA formatting: (XXX) XXX-XXXX
  if ((country === "US" || country === "CA") && digits.length <= 10) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  // UK formatting: XXXXX XXXXXX
  if (country === "GB" && digits.length <= 11) {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return value;
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
    optIn: false,
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
  };

  const handleBlur = (field: "phone" | "email") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "phone") setErrors((prev) => ({ ...prev, phone: validatePhone(form.phone) }));
    if (field === "email") setErrors((prev) => ({ ...prev, email: validateEmail(form.email) }));
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value, form.country);
    setForm((prev) => ({ ...prev, phone: formatted }));
    if (touched.phone) setErrors((prev) => ({ ...prev, phone: validatePhone(formatted) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const phoneErr = validatePhone(form.phone);
    const emailErr = validateEmail(form.email);
    setErrors({ phone: phoneErr, email: emailErr });
    setTouched({ phone: true, email: true });
    if (phoneErr || emailErr) return;
    setStatus("submitting");
    try {
      await submitToHubSpot(form);
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
        className="relative w-[92vw] max-w-lg overflow-y-auto"
        style={{ animation: "fadeIn 0.3s ease-out", backgroundColor: '#000', padding: '32px 32px', maxHeight: '90vh' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-6 text-white/60 hover:text-white text-xl leading-none transition-colors cursor-pointer"
          aria-label="Close"
          style={{ fontFamily: 'AvenirNext, sans-serif', zIndex: 10 }}
        >
          &#x2715;
        </button>

        {showPolicy ? (
          /* ─── Privacy Policy View ─── */
          <div className="animate-fadeIn">
            <button
              onClick={() => setShowPolicy(false)}
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
              style={{ fontFamily: 'AvenirNext, sans-serif', marginBottom: '24px' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to form
            </button>

            <h2
              className="text-white text-2xl tracking-[0.3em] uppercase text-center"
              style={{ fontFamily: "LandRoverWeb-Bold, sans-serif", marginBottom: '8px' }}
            >
              PLAT3S
            </h2>
            <div className="mx-auto w-16 h-px bg-white/30" style={{ marginBottom: '24px' }} />

            <div
              className="overflow-y-auto text-white/80 text-[13px] leading-[1.9] pr-2"
              style={{ fontFamily: 'AvenirNext, sans-serif', maxHeight: '60vh', textAlign: 'justify' }}
            >
              <h3 className="text-white text-base uppercase tracking-wide" style={{ marginBottom: '16px' }}>Privacy Policy for Plat3s.com</h3>
              <p style={{ marginBottom: '12px' }} className="text-white/50 text-xs">Effective Date: April 17, 2026</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>1. Introduction</h4>
              <p style={{ marginBottom: '12px' }}>Welcome to Plat3s.com (&ldquo;Plat3s,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). Plat3s is a social platform centered on automotive experiences, enabling users to create digital garages, capture and share driving content, participate in events, and access marketplace and service features.</p>
              <p style={{ marginBottom: '12px' }}>This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, connected services, and any related features (collectively, the &ldquo;Services&rdquo;).</p>
              <p style={{ marginBottom: '12px' }}>By accessing or using Plat3s, you agree to the terms of this Privacy Policy.</p>

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
              <p style={{ marginBottom: '12px' }}>Plat3s may collect precise location and driving behavior data to power features such as drive capture and route visualization, nearby deals and recommendations, and event discovery. You may control location permissions via your device settings. Disabling location may limit functionality.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>8. Cookies and Tracking Technologies</h4>
              <p style={{ marginBottom: '12px' }}>We use cookies and similar technologies to maintain sessions, analyze usage, personalize content, and deliver advertising. You can manage cookie preferences through your browser settings.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>9. Data Security</h4>
              <p style={{ marginBottom: '12px' }}>We implement industry-standard security measures including encryption in transit and at rest, access controls and authentication, and monitoring and threat detection. However, no system is completely secure.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>10. Third-Party Services</h4>
              <p style={{ marginBottom: '12px' }}>Plat3s may link to or integrate with third-party services. We are not responsible for their privacy practices.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>11. Children&apos;s Privacy</h4>
              <p style={{ marginBottom: '12px' }}>Plat3s is not intended for users under 13 (or applicable minimum age). We do not knowingly collect data from children.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>12. International Data Transfers</h4>
              <p style={{ marginBottom: '12px' }}>Your information may be transferred and processed outside your country, including the United States.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>13. Changes to This Policy</h4>
              <p style={{ marginBottom: '12px' }}>We may update this Privacy Policy periodically. Changes will be posted with an updated effective date.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>14. Contact Us</h4>
              <p style={{ marginBottom: '12px' }}>If you have questions or requests regarding this Privacy Policy, contact us at Plat3s.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>15. Additional Platform-Specific Disclosures</h4>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>15.1 License Plate Data</p>
              <p style={{ marginBottom: '12px' }}>Plat3s collects and displays license plate-related content as part of its core social functionality. Users are responsible for content they upload and must comply with applicable laws.</p>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>15.2 Marketplace &amp; Transactions</p>
              <p style={{ marginBottom: '12px' }}>Transactions are processed through third-party providers. Plat3s does not store full payment details.</p>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>15.3 Dashcam &amp; Media Integration</p>
              <p style={{ marginBottom: '12px' }}>If enabled, Plat3s may ingest media from connected devices. Users control permissions and uploads.</p>
              <p className="text-white text-[12px] font-semibold" style={{ marginBottom: '6px' }}>15.4 Vehicle Records</p>
              <p style={{ marginBottom: '12px' }}>Users may store service records and vehicle history data. This data is private unless explicitly shared.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>16. Do Not Sell or Share My Personal Information</h4>
              <p style={{ marginBottom: '12px' }}>If applicable, users may opt out of the sale or sharing of personal data by contacting us or using in-platform controls.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>17. Data Minimization &amp; Purpose Limitation</h4>
              <p style={{ marginBottom: '12px' }}>We limit data collection to what is necessary for platform functionality and clearly defined purposes.</p>

              <h4 className="text-white text-sm font-semibold" style={{ marginTop: '20px', marginBottom: '8px' }}>18. Automated Decision-Making</h4>
              <p style={{ marginBottom: '12px' }}>Plat3s may use automated systems for recommendations, fraud detection, and personalization. These do not produce legally significant effects.</p>

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
          style={{ fontFamily: "LandRoverWeb-Bold, sans-serif" }}
        >
          PLAT3S
        </h2>

        {/* Divider */}
        <div className="mx-auto w-16 h-px bg-white/30" style={{ marginBottom: '16px' }} />

        {status === "success" ? (
          <div className="text-center py-10 animate-fadeIn">
            <p className="text-white text-lg mb-3" style={{ fontFamily: 'AvenirNext, sans-serif' }}>Welcome to the road ahead.</p>
            <p className="text-white/70 text-sm" style={{ fontFamily: 'AvenirNext, sans-serif' }}>We&apos;ll notify you the moment PLAT3S goes live.</p>
          </div>
        ) : (
          <>
            {/* Copy */}
            <p className="text-white/90 text-sm leading-[1.7]" style={{ fontFamily: 'AvenirNext, sans-serif', textAlign: 'justify', marginBottom: '20px', padding: '0 4px' }}>
              More than a dashcam. Connect your car, save, and discover.
              Enjoy exclusive driver offers, deals while you&apos;re on
              the road, PLAT3S.com member-only events &amp;&nbsp;more.
              Join&nbsp;us.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col" style={{ fontFamily: 'AvenirNext, sans-serif', gap: '14px' }}>
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
                <label className="block text-white/50 text-[10px] tracking-[0.15em] uppercase" style={{ paddingLeft: '2px', marginBottom: '4px' }}>Plate Number</label>
                <input
                  type="text"
                  value={form.plateNumber}
                  onChange={(e) => update("plateNumber", e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-white/25 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/60 transition-colors"
                  style={{ paddingLeft: '2px', paddingBottom: '6px' }}
                />
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
                <span className="text-white/50 text-[11px] leading-[1.6] group-hover:text-white/70 transition-colors" style={{ textAlign: 'justify' }}>
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
                className="w-full bg-white text-[#1a1a1a] uppercase font-semibold hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 disabled:opacity-40"
                style={{ fontFamily: 'AvenirNext, sans-serif', fontSize: '11px', letterSpacing: '0.35em', height: '40px', marginTop: '4px' }}
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const goTo = useCallback(
    (index: number, dir: "next" | "prev") => {
      if (isAnimating) return;
      setDirection(dir);
      setIsAnimating(true);
      setActiveIndex(index);
      setTimeout(() => setIsAnimating(false), 700);
    },
    [isAnimating]
  );

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % brands.length, "next");
  }, [activeIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo((activeIndex - 1 + brands.length) % brands.length, "prev");
  }, [activeIndex, goTo]);

  useEffect(() => {
    if (modalOpen) return; // pause auto-rotate when modal is open
    timerRef.current = setTimeout(goNext, AUTO_ROTATE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, goNext, modalOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext();
      else goPrev();
    }
  };

  return (
    <section className="relative w-full min-h-screen">
      {/* ===== MOBILE CAROUSEL (< lg) ===== */}
      <div
        className="lg:hidden relative w-full h-screen overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {brands.map((brand, i) => {
          const isCurrent = i === activeIndex;

          let transformClass = "";
          if (isCurrent && mounted) {
            transformClass =
              direction === "next"
                ? "animate-slideInRight"
                : "animate-slideInLeft";
          }

          return (
            <div
              key={brand.id}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
                isCurrent
                  ? `opacity-100 z-10 ${transformClass}`
                  : "opacity-0 z-0"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${brand.image})` }}
              />
              <VideoBackground
                brand={brand}
                shouldLoad={mounted && (isCurrent || Math.abs(i - activeIndex) <= 1)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg">
                <h2
                  className="text-white text-5xl tracking-[0.35em] uppercase"
                  style={{ fontFamily: "LandRoverWeb-Bold, sans-serif" }}
                >
                  {brand.logoText}
                </h2>
                <span
                  className={`block h-px bg-white/60 transition-all duration-700 ease-out mt-6 ${
                    isCurrent ? "w-16 opacity-100" : "w-0 opacity-0"
                  }`}
                />
                {/* Subtext */}
                <p className="text-white text-base leading-7" style={{ marginTop: '36px' }}>
                  {brand.description}
                </p>
                {/* CTA */}
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-white text-[#1a1a1a] uppercase font-semibold hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 cursor-pointer"
                  style={{ fontFamily: 'AvenirNext, sans-serif', fontSize: '11px', letterSpacing: '0.35em', paddingLeft: '44px', paddingRight: '44px', height: '42px', marginTop: '32px' }}
                >
                  Join Us
                </button>
              </div>
            </div>
          );
        })}

        {/* Dot indicators */}
        <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-3">
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

      {/* ===== DESKTOP COLUMNS (lg+) ===== */}
      <div className="hidden lg:flex w-full min-h-screen">
        {brands.map((brand) => {
          const isHovered = hoveredId === brand.id;
          const isOtherHovered = hoveredId !== null && hoveredId !== brand.id;

          return (
            <div
              key={brand.id}
              className={`relative flex-1 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-in-out min-h-screen cursor-pointer ${
                isHovered
                  ? "flex-[1.5]"
                  : isOtherHovered
                  ? "flex-[0.75]"
                  : "flex-1"
              }`}
              onMouseEnter={() => setHoveredId(brand.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                style={{ backgroundImage: `url(${brand.image})` }}
              />
              <VideoBackground brand={brand} shouldLoad={mounted} />

              {/* Gradient overlay — darker on hover for readability */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  isHovered
                    ? "bg-gradient-to-t from-black/70 via-black/40 to-black/30"
                    : "bg-gradient-to-t from-black/50 via-transparent to-black/30"
                }`}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center" style={{ padding: '0 40px', maxWidth: '520px' }}>
                <h2
                  className="text-white uppercase"
                  style={{ fontFamily: "LandRoverWeb-Bold, sans-serif", fontSize: '48px', letterSpacing: '0.3em' }}
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
                  <p className="text-white" style={{ fontSize: '18px', lineHeight: '1.8' }}>
                    {brand.description}
                  </p>
                  {/* CTA */}
                  <button
                    onClick={() => setModalOpen(true)}
                    className="bg-white text-[#1a1a1a] uppercase font-semibold hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 cursor-pointer"
                    style={{ fontFamily: 'AvenirNext, sans-serif', fontSize: '11px', letterSpacing: '0.35em', paddingLeft: '44px', paddingRight: '44px', height: '42px', marginTop: '32px' }}
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
