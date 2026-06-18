"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Phone, Search } from "lucide-react";

// Full list of countries with ISO code + international dial code.
const COUNTRIES: { code: string; dial: string; name: string }[] = [
  { code: "AF", dial: "+93", name: "Afghanistan" },
  { code: "AL", dial: "+355", name: "Albania" },
  { code: "DZ", dial: "+213", name: "Algeria" },
  { code: "AD", dial: "+376", name: "Andorra" },
  { code: "AO", dial: "+244", name: "Angola" },
  { code: "AG", dial: "+1", name: "Antigua & Barbuda" },
  { code: "AR", dial: "+54", name: "Argentina" },
  { code: "AM", dial: "+374", name: "Armenia" },
  { code: "AU", dial: "+61", name: "Australia" },
  { code: "AT", dial: "+43", name: "Austria" },
  { code: "AZ", dial: "+994", name: "Azerbaijan" },
  { code: "BS", dial: "+1", name: "Bahamas" },
  { code: "BH", dial: "+973", name: "Bahrain" },
  { code: "BD", dial: "+880", name: "Bangladesh" },
  { code: "BB", dial: "+1", name: "Barbados" },
  { code: "BY", dial: "+375", name: "Belarus" },
  { code: "BE", dial: "+32", name: "Belgium" },
  { code: "BZ", dial: "+501", name: "Belize" },
  { code: "BJ", dial: "+229", name: "Benin" },
  { code: "BT", dial: "+975", name: "Bhutan" },
  { code: "BO", dial: "+591", name: "Bolivia" },
  { code: "BA", dial: "+387", name: "Bosnia & Herzegovina" },
  { code: "BW", dial: "+267", name: "Botswana" },
  { code: "BR", dial: "+55", name: "Brazil" },
  { code: "BN", dial: "+673", name: "Brunei" },
  { code: "BG", dial: "+359", name: "Bulgaria" },
  { code: "BF", dial: "+226", name: "Burkina Faso" },
  { code: "BI", dial: "+257", name: "Burundi" },
  { code: "KH", dial: "+855", name: "Cambodia" },
  { code: "CM", dial: "+237", name: "Cameroon" },
  { code: "CA", dial: "+1", name: "Canada" },
  { code: "CV", dial: "+238", name: "Cape Verde" },
  { code: "CF", dial: "+236", name: "Central African Republic" },
  { code: "TD", dial: "+235", name: "Chad" },
  { code: "CL", dial: "+56", name: "Chile" },
  { code: "CN", dial: "+86", name: "China" },
  { code: "CO", dial: "+57", name: "Colombia" },
  { code: "KM", dial: "+269", name: "Comoros" },
  { code: "CG", dial: "+242", name: "Congo" },
  { code: "CD", dial: "+243", name: "Congo (DRC)" },
  { code: "CR", dial: "+506", name: "Costa Rica" },
  { code: "CI", dial: "+225", name: "Côte d'Ivoire" },
  { code: "HR", dial: "+385", name: "Croatia" },
  { code: "CU", dial: "+53", name: "Cuba" },
  { code: "CY", dial: "+357", name: "Cyprus" },
  { code: "CZ", dial: "+420", name: "Czechia" },
  { code: "DK", dial: "+45", name: "Denmark" },
  { code: "DJ", dial: "+253", name: "Djibouti" },
  { code: "DM", dial: "+1", name: "Dominica" },
  { code: "DO", dial: "+1", name: "Dominican Republic" },
  { code: "EC", dial: "+593", name: "Ecuador" },
  { code: "EG", dial: "+20", name: "Egypt" },
  { code: "SV", dial: "+503", name: "El Salvador" },
  { code: "GQ", dial: "+240", name: "Equatorial Guinea" },
  { code: "ER", dial: "+291", name: "Eritrea" },
  { code: "EE", dial: "+372", name: "Estonia" },
  { code: "SZ", dial: "+268", name: "Eswatini" },
  { code: "ET", dial: "+251", name: "Ethiopia" },
  { code: "FJ", dial: "+679", name: "Fiji" },
  { code: "FI", dial: "+358", name: "Finland" },
  { code: "FR", dial: "+33", name: "France" },
  { code: "GA", dial: "+241", name: "Gabon" },
  { code: "GM", dial: "+220", name: "Gambia" },
  { code: "GE", dial: "+995", name: "Georgia" },
  { code: "DE", dial: "+49", name: "Germany" },
  { code: "GH", dial: "+233", name: "Ghana" },
  { code: "GR", dial: "+30", name: "Greece" },
  { code: "GD", dial: "+1", name: "Grenada" },
  { code: "GT", dial: "+502", name: "Guatemala" },
  { code: "GN", dial: "+224", name: "Guinea" },
  { code: "GW", dial: "+245", name: "Guinea-Bissau" },
  { code: "GY", dial: "+592", name: "Guyana" },
  { code: "HT", dial: "+509", name: "Haiti" },
  { code: "HN", dial: "+504", name: "Honduras" },
  { code: "HK", dial: "+852", name: "Hong Kong" },
  { code: "HU", dial: "+36", name: "Hungary" },
  { code: "IS", dial: "+354", name: "Iceland" },
  { code: "IN", dial: "+91", name: "India" },
  { code: "ID", dial: "+62", name: "Indonesia" },
  { code: "IR", dial: "+98", name: "Iran" },
  { code: "IQ", dial: "+964", name: "Iraq" },
  { code: "IE", dial: "+353", name: "Ireland" },
  { code: "IL", dial: "+972", name: "Israel" },
  { code: "IT", dial: "+39", name: "Italy" },
  { code: "JM", dial: "+1", name: "Jamaica" },
  { code: "JP", dial: "+81", name: "Japan" },
  { code: "JO", dial: "+962", name: "Jordan" },
  { code: "KZ", dial: "+7", name: "Kazakhstan" },
  { code: "KE", dial: "+254", name: "Kenya" },
  { code: "KI", dial: "+686", name: "Kiribati" },
  { code: "KW", dial: "+965", name: "Kuwait" },
  { code: "KG", dial: "+996", name: "Kyrgyzstan" },
  { code: "LA", dial: "+856", name: "Laos" },
  { code: "LV", dial: "+371", name: "Latvia" },
  { code: "LB", dial: "+961", name: "Lebanon" },
  { code: "LS", dial: "+266", name: "Lesotho" },
  { code: "LR", dial: "+231", name: "Liberia" },
  { code: "LY", dial: "+218", name: "Libya" },
  { code: "LI", dial: "+423", name: "Liechtenstein" },
  { code: "LT", dial: "+370", name: "Lithuania" },
  { code: "LU", dial: "+352", name: "Luxembourg" },
  { code: "MO", dial: "+853", name: "Macao" },
  { code: "MG", dial: "+261", name: "Madagascar" },
  { code: "MW", dial: "+265", name: "Malawi" },
  { code: "MY", dial: "+60", name: "Malaysia" },
  { code: "MV", dial: "+960", name: "Maldives" },
  { code: "ML", dial: "+223", name: "Mali" },
  { code: "MT", dial: "+356", name: "Malta" },
  { code: "MH", dial: "+692", name: "Marshall Islands" },
  { code: "MR", dial: "+222", name: "Mauritania" },
  { code: "MU", dial: "+230", name: "Mauritius" },
  { code: "MX", dial: "+52", name: "Mexico" },
  { code: "FM", dial: "+691", name: "Micronesia" },
  { code: "MD", dial: "+373", name: "Moldova" },
  { code: "MC", dial: "+377", name: "Monaco" },
  { code: "MN", dial: "+976", name: "Mongolia" },
  { code: "ME", dial: "+382", name: "Montenegro" },
  { code: "MA", dial: "+212", name: "Morocco" },
  { code: "MZ", dial: "+258", name: "Mozambique" },
  { code: "MM", dial: "+95", name: "Myanmar" },
  { code: "NA", dial: "+264", name: "Namibia" },
  { code: "NR", dial: "+674", name: "Nauru" },
  { code: "NP", dial: "+977", name: "Nepal" },
  { code: "NL", dial: "+31", name: "Netherlands" },
  { code: "NZ", dial: "+64", name: "New Zealand" },
  { code: "NI", dial: "+505", name: "Nicaragua" },
  { code: "NE", dial: "+227", name: "Niger" },
  { code: "NG", dial: "+234", name: "Nigeria" },
  { code: "KP", dial: "+850", name: "North Korea" },
  { code: "MK", dial: "+389", name: "North Macedonia" },
  { code: "NO", dial: "+47", name: "Norway" },
  { code: "OM", dial: "+968", name: "Oman" },
  { code: "PK", dial: "+92", name: "Pakistan" },
  { code: "PW", dial: "+680", name: "Palau" },
  { code: "PS", dial: "+970", name: "Palestine" },
  { code: "PA", dial: "+507", name: "Panama" },
  { code: "PG", dial: "+675", name: "Papua New Guinea" },
  { code: "PY", dial: "+595", name: "Paraguay" },
  { code: "PE", dial: "+51", name: "Peru" },
  { code: "PH", dial: "+63", name: "Philippines" },
  { code: "PL", dial: "+48", name: "Poland" },
  { code: "PT", dial: "+351", name: "Portugal" },
  { code: "QA", dial: "+974", name: "Qatar" },
  { code: "RO", dial: "+40", name: "Romania" },
  { code: "RU", dial: "+7", name: "Russia" },
  { code: "RW", dial: "+250", name: "Rwanda" },
  { code: "KN", dial: "+1", name: "Saint Kitts & Nevis" },
  { code: "LC", dial: "+1", name: "Saint Lucia" },
  { code: "VC", dial: "+1", name: "Saint Vincent" },
  { code: "WS", dial: "+685", name: "Samoa" },
  { code: "SM", dial: "+378", name: "San Marino" },
  { code: "ST", dial: "+239", name: "São Tomé & Príncipe" },
  { code: "SA", dial: "+966", name: "Saudi Arabia" },
  { code: "SN", dial: "+221", name: "Senegal" },
  { code: "RS", dial: "+381", name: "Serbia" },
  { code: "SC", dial: "+248", name: "Seychelles" },
  { code: "SL", dial: "+232", name: "Sierra Leone" },
  { code: "SG", dial: "+65", name: "Singapore" },
  { code: "SK", dial: "+421", name: "Slovakia" },
  { code: "SI", dial: "+386", name: "Slovenia" },
  { code: "SB", dial: "+677", name: "Solomon Islands" },
  { code: "SO", dial: "+252", name: "Somalia" },
  { code: "ZA", dial: "+27", name: "South Africa" },
  { code: "KR", dial: "+82", name: "South Korea" },
  { code: "SS", dial: "+211", name: "South Sudan" },
  { code: "ES", dial: "+34", name: "Spain" },
  { code: "LK", dial: "+94", name: "Sri Lanka" },
  { code: "SD", dial: "+249", name: "Sudan" },
  { code: "SR", dial: "+597", name: "Suriname" },
  { code: "SE", dial: "+46", name: "Sweden" },
  { code: "CH", dial: "+41", name: "Switzerland" },
  { code: "SY", dial: "+963", name: "Syria" },
  { code: "TW", dial: "+886", name: "Taiwan" },
  { code: "TJ", dial: "+992", name: "Tajikistan" },
  { code: "TZ", dial: "+255", name: "Tanzania" },
  { code: "TH", dial: "+66", name: "Thailand" },
  { code: "TL", dial: "+670", name: "Timor-Leste" },
  { code: "TG", dial: "+228", name: "Togo" },
  { code: "TO", dial: "+676", name: "Tonga" },
  { code: "TT", dial: "+1", name: "Trinidad & Tobago" },
  { code: "TN", dial: "+216", name: "Tunisia" },
  { code: "TR", dial: "+90", name: "Turkey" },
  { code: "TM", dial: "+993", name: "Turkmenistan" },
  { code: "TV", dial: "+688", name: "Tuvalu" },
  { code: "UG", dial: "+256", name: "Uganda" },
  { code: "UA", dial: "+380", name: "Ukraine" },
  { code: "AE", dial: "+971", name: "United Arab Emirates" },
  { code: "GB", dial: "+44", name: "United Kingdom" },
  { code: "US", dial: "+1", name: "United States" },
  { code: "UY", dial: "+598", name: "Uruguay" },
  { code: "UZ", dial: "+998", name: "Uzbekistan" },
  { code: "VU", dial: "+678", name: "Vanuatu" },
  { code: "VA", dial: "+379", name: "Vatican City" },
  { code: "VE", dial: "+58", name: "Venezuela" },
  { code: "VN", dial: "+84", name: "Vietnam" },
  { code: "YE", dial: "+967", name: "Yemen" },
  { code: "ZM", dial: "+260", name: "Zambia" },
  { code: "ZW", dial: "+263", name: "Zimbabwe" },
];

function flagEmoji(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Parse a stored value like "+353 871234567" into {dial, number}.
function parse(value: string): { dial: string; number: string } {
  const v = (value || "").trim();
  const match = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length).find(c => v.startsWith(c.dial));
  if (match) return { dial: match.dial, number: v.slice(match.dial.length).trim() };
  return { dial: "+353", number: v.replace(/^\+/, "") };
}

export default function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const initial = parse(value);
  const [code, setCode] = useState(() => {
    const m = COUNTRIES.find(c => c.dial === initial.dial);
    return m ? m.code + m.dial : "IE+353";
  });
  const [number, setNumber] = useState(initial.number);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find(c => c.code + c.dial === code) || COUNTRIES.find(c => c.code === "IE")!;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase() === q);
  }, [query]);

  useEffect(() => {
    onChange(number ? `${selected.dial} ${number}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, number]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-2 px-2 py-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-brand-500 transition-colors">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
      >
        <span className="text-lg leading-none">{flagEmoji(selected.code)}</span>
        <span className="text-sm text-white/70">{selected.dial}</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/40" />
      </button>
      <div className="w-px h-5 bg-white/10" />
      <Phone className="w-4 h-4 text-brand-400 shrink-0" />
      <input
        type="tel"
        value={number}
        onChange={e => setNumber(e.target.value.replace(/[^\d\s]/g, ""))}
        placeholder="Phone number"
        className="bg-transparent text-white placeholder:text-white/20 focus:outline-none w-full text-sm"
      />

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-white/5 sticky top-0 bg-[#1a1a1a]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg">
              <Search className="w-3.5 h-3.5 text-white/30" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search country…"
                className="bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none w-full"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-white/30">No match</div>
            ) : filtered.map(c => (
              <button
                key={c.code + c.dial}
                type="button"
                onClick={() => { setCode(c.code + c.dial); setOpen(false); setQuery(""); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-lg leading-none">{flagEmoji(c.code)}</span>
                <span className="text-sm text-white/80 flex-1 truncate">{c.name}</span>
                <span className="text-sm text-white/40">{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
