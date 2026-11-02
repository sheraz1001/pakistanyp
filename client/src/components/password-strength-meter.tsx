import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { tj } from "@/i18n-jsx/tj";

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthChange?: (strength: number, isValid: boolean) => void;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  met: boolean;
}

export function PasswordStrengthMeter({ password, onStrengthChange, className = "" }: PasswordStrengthMeterProps) {
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([
    { label: "At least 8 characters", test: (p) => p.length >= 8, met: false },
    { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p), met: false },
    { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p), met: false },
    { label: "Contains number", test: (p) => /\d/.test(p), met: false },
    { label: "Contains special character", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), met: false },
  ]);

  const [strength, setStrength] = useState(0);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const updatedRequirements = requirements.map(req => ({
      ...req,
      met: req.test(password)
    }));
    
    setRequirements(updatedRequirements);
    
    const metCount = updatedRequirements.filter(req => req.met).length;
    const strengthScore = (metCount / updatedRequirements.length) * 100;
    const passwordIsValid = metCount >= 4 && password.length >= 8; // At least 4 out of 5 requirements
    
    setStrength(strengthScore);
    setIsValid(passwordIsValid);
    
    onStrengthChange?.(strengthScore, passwordIsValid);
  }, [password, onStrengthChange]);

  const getStrengthLabel = () => {
    if (strength < 20) return "Very Weak";
    if (strength < 40) return "Weak";
    if (strength < 60) return "Fair";
    if (strength < 80) return "Good";
    return "Strong";
  };

  const metCount = requirements.filter((r) => r.met).length;
  // Status colours (not decorative): red = weak, amber = fair, green = good/strong
  const tone =
    strength < 40
      ? { bar: "bg-[#D71920]", text: "text-[#B91C1C]" }
      : strength < 80
        ? { bar: "bg-[#B45309]", text: "text-[#B45309]" }
        : { bar: "bg-[#047857]", text: "text-[#047857]" };

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength meter bar */}
      <div className="space-y-2">
        <div className="flex gap-1" aria-hidden="true">
          {requirements.map((_, i) => (
            <span
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors duration-200 ${i < metCount ? tone.bar : "bg-[#DDE1E8]"}`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-[13px] font-medium ${tone.text}`}>{tj("{0} password", getStrengthLabel())}</span>
          <span className="text-xs text-[#5B6475]">{tj("{0}/{1} requirements", metCount, requirements.length)}</span>
        </div>
      </div>

      {/* Requirements checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <CheckCircle className="h-3.5 w-3.5 text-[#047857] flex-shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-[#8A93A3] flex-shrink-0" />
            )}
            <span className={req.met ? "text-[#047857]" : "text-[#5B6475]"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Validity indicator */}
      {isValid && (
        <div className="flex items-center gap-2 text-xs text-[#05501F] bg-[#F2F9F4] rounded-lg p-2 border border-[#CFE8D8]">
          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Password meets security requirements</span>
        </div>
      )}
    </div>
  );
}
