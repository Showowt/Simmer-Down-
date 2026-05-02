"use client";

import { Fragment, useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
}

type StatusFilter = "all" | "new" | "responded";

const statusConfig: Record<
  string,
  { label: string; color: string }
> = {
  new: {
    label: "Nuevo",
    color: "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20",
  },
  responded: {
    label: "Respondido",
    color: "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20",
  },
};

function getStatus(submission: ContactSubmission): string {
  if (
    submission.meta &&
    typeof submission.meta === "object" &&
    typeof submission.meta.status === "string"
  ) {
    return submission.meta.status;
  }
  return "new";
}

export default function AdminInquiriesPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("id, name, email, phone, subject, message, meta, created_at, created_by")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions((data as ContactSubmission[]) || []);
    } catch (err) {
      console.error("[AdminInquiries] Error al cargar consultas:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsResponded = async (submission: ContactSubmission) => {
    setUpdatingId(submission.id);
    try {
      const supabase = createClient();
      const currentMeta = submission.meta || {};
      const newMeta = { ...currentMeta, status: "responded" };

      const { error } = await supabase
        .from("contact_submissions")
        .update({ meta: newMeta })
        .eq("id", submission.id);

      if (error) throw error;

      setSubmissions(
        submissions.map((s) =>
          s.id === submission.id ? { ...s, meta: newMeta } : s
        )
      );
    } catch (err) {
      console.error("[AdminInquiries] Error al actualizar estado:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (filter === "all") return true;
    return getStatus(s) === filter;
  });

  const newCount = submissions.filter((s) => getStatus(s) === "new").length;
  const respondedCount = submissions.filter(
    (s) => getStatus(s) === "responded"
  ).length;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#FFF8F0] flex items-center gap-3">
            Consultas
            {newCount > 0 && (
              <span className="bg-[#FF6B35] text-white text-sm px-2 py-0.5">
                {newCount} nuevas
              </span>
            )}
          </h1>
          <p className="text-[#6B6560]">
            Consultas recibidas del formulario de contacto
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            className="bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-4 py-2 focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="all">Todas ({submissions.length})</option>
            <option value="new">Nuevas ({newCount})</option>
            <option value="responded">Respondidas ({respondedCount})</option>
          </select>
          <button
            onClick={fetchSubmissions}
            className="p-2 bg-[#252320] border border-[#3D3936] hover:bg-[#3D3936] transition text-[#6B6560]"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cargando */}
      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : submissions.length === 0 ? (
        /* Estado vacio */
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Inbox className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8] mb-2">No hay consultas aun</p>
          <p className="text-sm text-[#6B6560]">
            Las consultas apareceran aqui cuando alguien use el formulario de
            contacto
          </p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <p className="text-[#B8B0A8]">
            No se encontraron consultas con este filtro
          </p>
        </div>
      ) : (
        /* Lista de consultas */
        <div className="bg-[#252320] border border-[#3D3936] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-[#6B6560] border-b border-[#3D3936]">
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Asunto</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => {
                  const status = getStatus(submission);
                  const isExpanded = expandedId === submission.id;
                  const cfg = statusConfig[status] || statusConfig.new;

                  return (
                    <Fragment key={submission.id}>
                      <tr
                        className={`border-b border-[#3D3936] hover:bg-[#3D3936]/50 transition cursor-pointer ${
                          status === "new" ? "bg-[#FF6B35]/5" : ""
                        }`}
                        onClick={() => toggleExpand(submission.id)}
                      >
                        <td className="px-6 py-4">
                          <p
                            className={`font-medium ${
                              status === "new"
                                ? "text-[#FFF8F0]"
                                : "text-[#B8B0A8]"
                            }`}
                          >
                            {submission.name}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B6560]">
                          {submission.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#B8B0A8]">
                            {submission.subject || "Sin asunto"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6B6560]">
                          {new Date(submission.created_at).toLocaleDateString(
                            "es",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium border ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => toggleExpand(submission.id)}
                              className="p-2 hover:bg-[#3D3936] transition"
                              title={isExpanded ? "Contraer" : "Expandir"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-[#6B6560]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[#6B6560]" />
                              )}
                            </button>
                            {status !== "responded" && (
                              <button
                                onClick={() => markAsResponded(submission)}
                                disabled={updatingId === submission.id}
                                className="p-2 hover:bg-[#4CAF50]/10 transition disabled:opacity-50"
                                title="Marcar como respondido"
                              >
                                {updatingId === submission.id ? (
                                  <div className="w-4 h-4 border-2 border-[#4CAF50] border-t-transparent animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandida con mensaje completo */}
                      {isExpanded && (
                        <tr className="border-b border-[#3D3936]">
                          <td colSpan={6} className="px-6 py-5 bg-[#1F1D1A]">
                            <div className="space-y-4">
                              {/* Informacion de contacto */}
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 text-[#B8B0A8]">
                                  <Mail className="w-4 h-4 text-[#6B6560]" />
                                  <a
                                    href={`mailto:${submission.email}`}
                                    className="hover:text-[#FF6B35]"
                                  >
                                    {submission.email}
                                  </a>
                                </div>
                                {submission.phone && (
                                  <div className="flex items-center gap-2 text-[#B8B0A8]">
                                    <Phone className="w-4 h-4 text-[#6B6560]" />
                                    <a
                                      href={`tel:${submission.phone}`}
                                      className="hover:text-[#FF6B35]"
                                    >
                                      {submission.phone}
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Mensaje */}
                              <div>
                                <h4 className="text-sm font-medium text-[#6B6560] mb-2 flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4" />
                                  Mensaje
                                </h4>
                                <div className="bg-[#252320] p-4 border border-[#3D3936]">
                                  <p className="text-[#B8B0A8] whitespace-pre-wrap">
                                    {submission.message}
                                  </p>
                                </div>
                              </div>

                              {/* Acciones rapidas */}
                              <div className="flex gap-3">
                                {status !== "responded" && (
                                  <button
                                    onClick={() => markAsResponded(submission)}
                                    disabled={updatingId === submission.id}
                                    className="bg-[#FF6B35] hover:bg-[#E55A2B] disabled:opacity-50 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 transition"
                                  >
                                    {updatingId === submission.id ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                    Marcar como respondido
                                  </button>
                                )}
                                <a
                                  href={`mailto:${submission.email}?subject=Re: ${submission.subject || "Consulta"} - Simmer Down`}
                                  className="bg-[#3D3936] hover:bg-[#4A4744] text-[#FFF8F0] px-4 py-2 text-sm font-medium flex items-center gap-2 transition"
                                >
                                  <Mail className="w-4 h-4" />
                                  Responder por email
                                </a>
                                {submission.phone && (
                                  <a
                                    href={`tel:${submission.phone}`}
                                    className="bg-[#3D3936] hover:bg-[#4A4744] text-[#FFF8F0] px-4 py-2 text-sm font-medium flex items-center gap-2 transition"
                                  >
                                    <Phone className="w-4 h-4" />
                                    Llamar
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

