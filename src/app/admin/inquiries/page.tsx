"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MessageSquare,
  X,
  Archive,
  CheckCircle,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ContactSubmission } from "@/lib/types";

const statusOptions = [
  {
    value: "new",
    label: "Nuevo",
    color: "bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20",
  },
  {
    value: "read",
    label: "Leído",
    color: "bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]/20",
  },
  {
    value: "responded",
    label: "Respondido",
    color: "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20",
  },
  {
    value: "archived",
    label: "Archivado",
    color: "bg-[#6B6560]/10 text-[#6B6560] border-[#6B6560]/20",
  },
];

const reasonLabels: Record<string, string> = {
  general: "Consulta General",
  order: "Problema con Pedido",
  catering: "Catering/Eventos",
  feedback: "Comentarios",
  partnership: "Asociación",
  other: "Otro",
};

export default function AdminInquiriesPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchSubmissions();

    // Real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel("inquiries")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_submissions" },
        () => {
          fetchSubmissions();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSubmissions = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.log("Contact submissions table may not exist");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: ContactSubmission["status"],
  ) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("contact_submissions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setSubmissions(
        submissions.map((s) => (s.id === id ? { ...s, status } : s)),
      );
      if (selectedSubmission?.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status });
      }
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  const saveNotes = async () => {
    if (!selectedSubmission) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("contact_submissions")
        .update({ notes })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      setSubmissions(
        submissions.map((s) =>
          s.id === selectedSubmission.id ? { ...s, notes } : s,
        ),
      );
      setSelectedSubmission({ ...selectedSubmission, notes });
    } catch (err) {
      console.error("Failed to save notes");
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("¿Eliminar esta consulta permanentemente?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("contact_submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubmissions(submissions.filter((s) => s.id !== id));
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
      }
    } catch (err) {
      console.error("Failed to delete");
    }
  };

  const openSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setNotes(submission.notes || "");

    // Mark as read if new
    if (submission.status === "new") {
      updateStatus(submission.id, "read");
    }
  };

  const filteredSubmissions =
    filter === "all"
      ? submissions
      : submissions.filter((s) => s.status === filter);

  const newCount = submissions.filter((s) => s.status === "new").length;

  const getStatusStyle = (status: string) => {
    return (
      statusOptions.find((s) => s.value === status)?.color ||
      statusOptions[0].color
    );
  };

  return (
    <div>
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
            Gestiona las consultas del formulario de contacto
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#252320] border border-[#3D3936] text-[#FFF8F0] px-4 py-2 focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="all">Todas ({submissions.length})</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label} (
                {submissions.filter((s) => s.status === status.value).length})
              </option>
            ))}
          </select>
          <button
            onClick={fetchSubmissions}
            className="p-2 bg-[#252320] border border-[#3D3936] hover:bg-[#3D3936] transition text-[#6B6560]"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#252320] border border-[#3D3936] p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent mx-auto" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-[#252320] border border-[#3D3936] p-12 text-center">
          <Mail className="w-12 h-12 text-[#6B6560] mx-auto mb-4" />
          <p className="text-[#B8B0A8]">No hay consultas aún</p>
          <p className="text-sm text-[#6B6560] mt-1">
            Las consultas aparecerán aquí cuando alguien use el formulario de
            contacto
          </p>
        </div>
      ) : (
        <div className="bg-[#252320] border border-[#3D3936] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-[#6B6560] border-b border-[#3D3936]">
                  <th className="px-6 py-4 font-medium">Contacto</th>
                  <th className="px-6 py-4 font-medium">Asunto</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className={`border-b border-[#3D3936] hover:bg-[#3D3936]/50 transition cursor-pointer ${
                      submission.status === "new" ? "bg-[#FF6B35]/5" : ""
                    }`}
                    onClick={() => openSubmission(submission)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p
                          className={`font-medium ${submission.status === "new" ? "text-[#FFF8F0]" : "text-[#B8B0A8]"}`}
                        >
                          {submission.name}
                        </p>
                        <p className="text-sm text-[#6B6560]">
                          {submission.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#B8B0A8]">
                        {reasonLabels[submission.reason] || submission.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium border ${getStatusStyle(submission.status)}`}
                      >
                        {
                          statusOptions.find(
                            (s) => s.value === submission.status,
                          )?.label
                        }
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
                        },
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openSubmission(submission)}
                          className="p-2 hover:bg-[#3D3936] transition"
                        >
                          <Eye className="w-4 h-4 text-[#6B6560]" />
                        </button>
                        <button
                          onClick={() => deleteSubmission(submission.id)}
                          className="p-2 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252320] border border-[#3D3936] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3D3936] flex items-center justify-between sticky top-0 bg-[#252320]">
              <div>
                <h2 className="text-lg font-semibold text-[#FFF8F0]">
                  Detalle de Consulta
                </h2>
                <p className="text-sm text-[#6B6560]">
                  {new Date(selectedSubmission.created_at).toLocaleString("es")}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 hover:bg-[#3D3936]"
              >
                <X className="w-5 h-5 text-[#6B6560]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="bg-[#1F1D1A] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FF6B35]/10 flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#FFF8F0]">
                      {selectedSubmission.name}
                    </p>
                    <p className="text-sm text-[#6B6560]">
                      {reasonLabels[selectedSubmission.reason] ||
                        selectedSubmission.reason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#B8B0A8]">
                  <Mail className="w-4 h-4 text-[#6B6560]" />
                  <a
                    href={`mailto:${selectedSubmission.email}`}
                    className="hover:text-[#FF6B35]"
                  >
                    {selectedSubmission.email}
                  </a>
                </div>
                {selectedSubmission.phone && (
                  <div className="flex items-center gap-2 text-[#B8B0A8]">
                    <Phone className="w-4 h-4 text-[#6B6560]" />
                    <a
                      href={`tel:${selectedSubmission.phone}`}
                      className="hover:text-[#FF6B35]"
                    >
                      {selectedSubmission.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <h3 className="text-sm font-medium text-[#6B6560] mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Mensaje
                </h3>
                <div className="bg-[#1F1D1A] p-4">
                  <p className="text-[#B8B0A8] whitespace-pre-wrap">
                    {selectedSubmission.message}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-medium text-[#6B6560] mb-2">
                  Notas internas
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={saveNotes}
                  className="w-full px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] focus:border-[#FF6B35] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Agregar notas privadas..."
                />
              </div>

              {/* Status Actions */}
              <div>
                <h3 className="text-sm font-medium text-[#6B6560] mb-3">
                  Actualizar estado
                </h3>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() =>
                        updateStatus(
                          selectedSubmission.id,
                          status.value as ContactSubmission["status"],
                        )
                      }
                      className={`px-4 py-2 text-sm font-medium transition ${
                        selectedSubmission.status === status.value
                          ? "bg-[#FF6B35] text-white"
                          : "bg-[#3D3936] text-[#B8B0A8] hover:bg-[#4A4744]"
                      }`}
                    >
                      {status.value === "responded" && (
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                      )}
                      {status.value === "archived" && (
                        <Archive className="w-4 h-4 inline mr-1" />
                      )}
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#3D3936]">
                <a
                  href={`mailto:${selectedSubmission.email}?subject=Re: ${reasonLabels[selectedSubmission.reason] || "Consulta"} - Simmer Down`}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-3 font-medium text-center transition"
                >
                  Responder por Email
                </a>
                {selectedSubmission.phone && (
                  <a
                    href={`tel:${selectedSubmission.phone}`}
                    className="px-6 py-3 bg-[#3D3936] hover:bg-[#4A4744] text-[#FFF8F0] font-medium transition"
                  >
                    Llamar
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
