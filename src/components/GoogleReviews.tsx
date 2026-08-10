"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Review {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url?: string | null;
}
interface ReviewsData {
  enabled: boolean;
  rating?: number | null;
  total?: number | null;
  url?: string | null;
  reviews?: Review[];
}

function Stars({ n, className = "w-4 h-4" }: { n: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${n} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={className}
          fill={i <= Math.round(n) ? "#FBBF24" : "none"}
          stroke="#FBBF24"
        />
      ))}
    </div>
  );
}

export default function GoogleReviews() {
  const { locale } = useI18n();
  const [data, setData] = useState<ReviewsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData({ enabled: false }); });
    return () => { cancelled = true; };
  }, []);

  // Hidden until the feed is configured (GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID)
  // and returns real reviews — never render a placeholder.
  if (!data?.enabled || !data.reviews || data.reviews.length === 0) return null;

  const t = (es: string, en: string) => (locale === "es" ? es : en);

  return (
    <section className="py-20 md:py-28 bg-[#0A0A0A] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-white/40 text-sm uppercase tracking-[0.2em] mb-4">
            {t("Reseñas verificadas de Google", "Verified Google reviews")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-white mb-5">
            {t("Lo que dicen nuestros clientes", "What our guests are saying")}
          </h2>
          {data.rating != null && (
            <div className="inline-flex items-center gap-3">
              <span className="text-3xl font-bold text-[#FBBF24] tabular-nums">
                {data.rating.toFixed(1)}
              </span>
              <Stars n={data.rating} className="w-5 h-5" />
              {data.total != null && (
                <span className="text-white/50 text-sm">
                  {t(`${data.total.toLocaleString("es-SV")} reseñas`, `${data.total.toLocaleString("en-US")} reviews`)}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.reviews.map((rv, i) => (
            <figure
              key={i}
              className="bg-[#141414] border border-white/10 rounded-2xl p-6 flex flex-col"
            >
              <Stars n={rv.rating} />
              <blockquote className="text-white/70 text-sm mt-4 leading-relaxed line-clamp-6 flex-1">
                “{rv.text}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                {/* Branded initial avatar — Google author photos are hosted on
                    googleusercontent.com, which the hardened CSP img-src blocks;
                    initials keep it consistent and never break. */}
                <div className="w-9 h-9 rounded-full bg-[#E85D04]/20 text-[#E85D04] flex items-center justify-center font-bold shrink-0">
                  {rv.author_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{rv.author_name}</p>
                  <p className="text-white/40 text-xs">{rv.relative_time_description}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {data.url && (
          <div className="text-center mt-10">
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition border border-white/15 hover:border-white/30 rounded-xl px-5 py-3"
            >
              {t("Ver todas las reseñas en Google", "See all reviews on Google")}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
