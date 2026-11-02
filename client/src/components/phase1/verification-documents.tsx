import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "./api";
import { country } from "@shared/country";
import { t as tx } from "@shared/i18n";

const licence = country.licenceAuthority;

const TYPES = [
  { value: "trade_licence", label: licence.charAt(0).toUpperCase() + licence.slice(1) },
  { value: "owner_id", label: "Owner ID / passport" },
  { value: "establishment_card", label: "Establishment card" },
  { value: "other", label: "Other" },
];

/** Owner upload of verification documents (PDF/JPG/PNG/WEBP, max 10 MB, up to 6 per request). */
export function VerificationDocuments({ businessId, editable }: { businessId: number; editable: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("trade_licence");
  const key = [`/api/businesses/${businessId}/verification/documents`];
  const { data: docs = [] } = useQuery<any[]>({ queryKey: key, queryFn: () => api(key[0]) });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("docType", docType);
      fd.append("file", file);
      const res = await fetch(key[0], { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`);
      return data;
    },
    onSuccess: () => { toast({ title: "Document uploaded" }); qc.invalidateQueries({ queryKey: key }); if (input.current) input.current.value = ""; },
    onError: (e: any) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api(`${key[0]}/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast({ title: "Could not remove", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="rounded-[14px] border border-[#E7E9EE] bg-white p-4 space-y-2">
      <div className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</div>
      {docs.length === 0 ? <p className="text-[#4B5565]">{tx("Upload a copy of your {0} so our team can check it.", licence)}</p> : (
        <ul className="divide-y divide-[#EEF0F4]">
          {docs.map((d) => (
            <li key={d.id} className="py-1.5 flex items-center gap-2">
              <span className="flex-1 truncate">{d.file_name} <span className="text-[#5B6475]">· {TYPES.find((t) => t.value === d.doc_type)?.label || d.doc_type}</span></span>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-[10px] text-[#3A4354] hover:bg-[#F1F2F6]" title="View" aria-label={tx("View {0}", d.file_name)}><Eye className="h-4 w-4" /></a>
              {editable && <button onClick={() => remove.mutate(d.id)} className="grid h-9 w-9 place-items-center rounded-[10px] text-[#D71920] hover:bg-[#FDECEC]" title="Remove" aria-label={tx("Remove {0}", d.file_name)}><Trash2 className="h-4 w-4" /></button>}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <div className="flex flex-wrap items-center gap-2">
          <select className="min-h-[40px] rounded-xl border border-[#DDE1E8] bg-white px-3 text-sm" value={docType} onChange={(e) => setDocType(e.target.value)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); }} />
          <Button size="sm" variant="outline" disabled={upload.isPending} onClick={() => input.current?.click()}>
            <Upload className="h-4 w-4 me-1" />{upload.isPending ? "Uploading…" : "Upload file"}
          </Button>
          <span className="text-xs text-[#5B6475]">PDF, JPG or PNG · max 10 MB</span>
        </div>
      )}
    </div>
  );
}
