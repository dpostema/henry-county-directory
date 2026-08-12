"use client";

import { useState } from "react";
import { Check, Ticket } from "lucide-react";

interface CopyCodeButtonProps {
  code: string;
  id: string;
}

export default function CopyCodeButton({ code, id: _id }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-btn border border-brandBorder-light/50">
      <span className="font-mono text-brandText-dark font-bold pl-2 select-all">
        {code}
      </span>
      <button
        type="button"
        onClick={handleCopyCode}
        className="bg-brandRed hover:bg-brandRed-hover text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm transition flex items-center space-x-1"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Ticket className="h-3 w-3" />
            <span>Copy Code</span>
          </>
        )}
      </button>
    </div>
  );
}
