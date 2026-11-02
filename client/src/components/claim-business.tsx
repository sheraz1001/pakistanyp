import { Check, Star, PenLine } from "lucide-react";
import { localize } from "@shared/country";

interface ClaimBusinessProps {
  onClaimClick: () => void;
}

const features = [
  {
    title: "Verified badge",
    text: "Confirm you're the owner and show customers your listing is verified.",
    icon: Check,
    tile: "bg-[#E3A82B] text-[#141414]",
  },
  {
    title: "Customer reviews",
    text: "Collect reviews and respond to customers from one place.",
    icon: Star,
    tile: "bg-[#F59E0B] text-[#0A0A0A]",
    filled: true,
  },
  {
    title: "Manage your profile",
    text: "Keep contact details, opening hours and photos up to date.",
    icon: PenLine,
    tile: "bg-[#0B6B2E] text-white",
  },
];

export default function ClaimBusiness({ onClaimClick }: ClaimBusinessProps) {
  return (
    <section className="yp-wrap pt-16 md:pt-24">
      <div className="relative flex flex-wrap items-center gap-12 overflow-hidden rounded-[28px] border border-[#CFE8D8] bg-[#F2F9F4] p-[clamp(24px,5vw,64px)] text-[#0A0A0A]">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
          <div className="yp-label text-[#0B6B2E]">For business owners</div>
          <h2 className="m-0 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.04em]">
            Claim your listing. Win more customers.
          </h2>
          <p className="m-0 text-[17px] leading-[1.6] text-[#3A4354]">
            {localize("Take control of your business profile and connect with more customers across Pakistan. Claiming a basic listing is free.")}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={onClaimClick} className="yp-btn yp-btn-primary yp-btn-lg">
              Claim your business
            </button>
            <button type="button" onClick={onClaimClick} className="yp-btn yp-btn-ghost yp-btn-lg border-[#CFD5DD]">
              Add a new business
            </button>
          </div>
        </div>

        <div className="grid min-w-0 flex-[1_1_340px] gap-3">
          {features.map(({ title, text, icon: Icon, tile, filled }) => (
            <div key={title} className="flex items-start gap-4 rounded-[18px] border border-[#DCEBE1] bg-white p-5">
              <span className={`grid h-10 w-10 flex-none place-items-center rounded-[12px] ${tile}`} aria-hidden="true">
                <Icon className={`h-5 w-5 ${filled ? "fill-current" : ""}`} strokeWidth={filled ? 1.5 : 2.2} />
              </span>
              <span>
                <span className="block text-base font-semibold">{title}</span>
                <span className="mt-1 block text-sm leading-[1.5] text-[#4B5565]">{text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
