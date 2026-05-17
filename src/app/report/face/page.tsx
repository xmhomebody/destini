"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ReportFaceChart } from "@/components/physiognomy/ReportFaceChart";
import { ScoreHexagon } from "@/components/physiognomy/ScoreHexagon";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import type {
  FaceReport,
  FaceReportContent,
  ReportLang,
} from "@/lib/faceReport";

export const REPORT_STORAGE_KEY = "destini-face-report";

type Stored = { image: string; report: FaceReport };

type Row = { label: string; text: string };

const BG_STYLE = {
  backgroundImage: "url(/images/img_facer_report_bg.png)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
} as const;

function SectionCard({
  no,
  title,
  rows,
  twoCol = false,
}: {
  no: number;
  title: string;
  rows: Row[];
  twoCol?: boolean;
}) {
  return (
    <section className="ornate-card px-5 py-5">
      <header className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-gold/30">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cinnabar text-parchment text-[12px] font-bold flex items-center justify-center">
          {no}
        </span>
        <h2 className="font-[family-name:var(--font-cinzel)] text-cinnabar text-base tracking-[0.12em]">
          {title}
        </h2>
      </header>
      <dl className={twoCol ? "grid gap-x-6 gap-y-3 sm:grid-cols-2" : "space-y-3"}>
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-[13px] font-bold text-ink-dark mb-0.5">
              {r.label}
            </dt>
            <dd className="text-[13px] leading-relaxed text-ink-light">
              {r.text}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function FaceReportPage() {
  const { lang, t } = useI18n();
  const [data, setData] = useState<Stored | null>(null);
  const [missing, setMissing] = useState(false);
  const [, setLangLoading] = useState(false);
  const inflight = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(REPORT_STORAGE_KEY);
      if (!raw) {
        setMissing(true);
        return;
      }
      setData(JSON.parse(raw) as Stored);
    } catch {
      setMissing(true);
    }
  }, []);

  // 切换到尚未生成的语言时，按需补生成该语言文本
  useEffect(() => {
    if (!data) return;
    if (data.report.i18n[lang as ReportLang]) return;
    if (inflight.current.has(lang)) return;
    inflight.current.add(lang);
    setLangLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/face-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: data.image,
            lang,
            withScores: false,
          }),
        });
        const json = (await res.json()) as
          | { ok: true; lang: string; content: FaceReportContent }
          | { error: string };
        if (cancelled || !res.ok || !("ok" in json)) return;
        setData((prev) => {
          if (!prev) return prev;
          const next: Stored = {
            ...prev,
            report: {
              ...prev.report,
              i18n: { ...prev.report.i18n, [json.lang]: json.content },
            },
          };
          try {
            sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore quota errors
          }
          return next;
        });
      } catch {
        // 补生成失败：保持回退语言显示
      } finally {
        inflight.current.delete(lang);
        if (!cancelled) setLangLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, data]);

  if (missing) {
    return (
      <>
        <div className="fixed inset-0 z-0" style={BG_STYLE} />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 gap-4">
          <h1 className="font-[family-name:var(--font-cinzel)] text-2xl text-cinnabar tracking-[0.15em]">
            {t("report.missing_title")}
          </h1>
          <p className="text-ink-light text-sm max-w-xs">
            {t("report.missing_body")}
          </p>
          <Link
            href="/physiognomy"
            className="btn-cinnabar px-7 py-3 rounded-full font-[family-name:var(--font-cinzel)] text-sm tracking-[0.2em] uppercase"
          >
            {t("report.missing_btn")}
          </Link>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <div className="fixed inset-0 z-0" style={BG_STYLE} />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-gold/30 border-t-cinnabar animate-spin" />
        </div>
      </>
    );
  }

  const { image, report } = data;
  // 当前语言文本；尚未补全时回退到任一已生成语言
  const c: FaceReportContent | undefined =
    report.i18n[lang as ReportLang] ??
    report.i18n.en ??
    Object.values(report.i18n)[0];

  if (!c) {
    return (
      <>
        <div className="fixed inset-0 z-0" style={BG_STYLE} />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-gold/30 border-t-cinnabar animate-spin" />
        </div>
      </>
    );
  }

  const santing: Row[] = [
    { label: t("report.r.shangting"), text: c.santing.shangting },
    { label: t("report.r.zhongting"), text: c.santing.zhongting },
    { label: t("report.r.xiating"), text: c.santing.xiating },
  ];
  const wuguan: Row[] = [
    { label: t("report.r.mei"), text: c.wuguan.mei },
    { label: t("report.r.yan"), text: c.wuguan.yan },
    { label: t("report.r.bi"), text: c.wuguan.bi },
    { label: t("report.r.kou"), text: c.wuguan.kou },
    { label: t("report.r.er"), text: c.wuguan.er },
  ];
  const shierGong: Row[] = [
    { label: t("report.r.ming"), text: c.shierGong.ming },
    { label: t("report.r.caibo"), text: c.shierGong.caibo },
    { label: t("report.r.xiongdi"), text: c.shierGong.xiongdi },
    { label: t("report.r.tianzhai"), text: c.shierGong.tianzhai },
    { label: t("report.r.ziNv"), text: c.shierGong.ziNv },
    { label: t("report.r.nupu"), text: c.shierGong.nupu },
    { label: t("report.r.fuqi"), text: c.shierGong.fuqi },
    { label: t("report.r.jie"), text: c.shierGong.jie },
    { label: t("report.r.qianyi"), text: c.shierGong.qianyi },
    { label: t("report.r.guanlu"), text: c.shierGong.guanlu },
    { label: t("report.r.fude"), text: c.shierGong.fude },
    { label: t("report.r.fumu"), text: c.shierGong.fumu },
  ];
  const keyParts: Row[] = [
    { label: t("report.r.etou"), text: c.keyParts.etou },
    { label: t("report.r.yintang"), text: c.keyParts.yintang },
    { label: t("report.r.shangen"), text: c.keyParts.shangen },
    { label: t("report.r.quangu"), text: c.keyParts.quangu },
    { label: t("report.r.renzhong"), text: c.keyParts.renzhong },
    { label: t("report.r.faling"), text: c.keyParts.faling },
    { label: t("report.r.chunchi"), text: c.keyParts.chunchi },
    { label: t("report.r.diage"), text: c.keyParts.diage },
  ];
  const extras: Row[] = [
    { label: t("report.r.lianxing"), text: c.extras.lianxing },
    { label: t("report.r.guxiang"), text: c.extras.guxiang },
    { label: t("report.r.duichen"), text: c.extras.duichen },
    { label: t("report.r.qise"), text: c.extras.qise },
    { label: t("report.r.zhiba"), text: c.extras.zhiba },
  ];

  return (
    <>
      <div className="fixed inset-0 z-0" style={BG_STYLE} />

      <div className="relative z-10 min-h-screen w-full max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* 标题 */}
        <header className="ornate-card px-6 py-6 text-center mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <p className="text-[10px] tracking-[0.2em] text-ink-light/70 text-left">
              {t("report.note")}
            </p>
            <LanguageSwitcher />
          </div>
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl lg:text-4xl text-cinnabar tracking-[0.18em]">
            {t("report.title")}
          </h1>
          <p className="mt-2 text-[13px] tracking-[0.2em] text-ink-light">
            {t("report.subtitle")}
          </p>
          <p className="mt-1 text-[12px] tracking-[0.35em] text-gold font-[family-name:var(--font-cinzel)]">
            {t("report.seal")}
          </p>
        </header>

        {/* 主体：左照片+评分，右依次排列的分析区 */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] items-start">
          {/* 左：面部图 + 六维评分 + 综合总论 */}
          <div className="flex flex-col gap-6">
            <ReportFaceChart imageSrc={image} />

            <section className="ornate-card px-5 py-5">
              <h2 className="font-[family-name:var(--font-cinzel)] text-cinnabar text-base tracking-[0.12em] mb-3 pb-2 border-b border-gold/30 text-center">
                {t("report.score_title")}
              </h2>

              {/* 综合格局总分 */}
              <div className="mb-3 text-center">
                <p className="text-[11px] tracking-[0.25em] uppercase text-ink-light">
                  {t("report.score.overall")}
                </p>
                <p className="font-[family-name:var(--font-cinzel)] text-5xl font-bold text-cinnabar leading-none mt-1">
                  {report.scores.overall}
                  <span className="text-xl text-ink-light/60 font-normal">
                    {" "}
                    / 100
                  </span>
                </p>
              </div>

              <ScoreHexagon scores={report.scores} />

              {/* 综合格局总论（结果，加粗大字） */}
              <div className="mt-4 pt-4 border-t border-gold/30">
                <p className="text-[11px] tracking-[0.25em] uppercase text-gold mb-2 text-center font-[family-name:var(--font-cinzel)]">
                  {t("report.overview_title")}
                </p>
                <p className="text-[17px] lg:text-lg font-bold leading-relaxed text-ink-dark text-justify">
                  {c.overview}
                </p>
              </div>
            </section>
          </div>

          {/* 右：一、二、三、四、五 */}
          <div className="flex flex-col gap-6">
            <SectionCard no={1} title={t("report.sec.santing")} rows={santing} />
            <SectionCard no={2} title={t("report.sec.wuguan")} rows={wuguan} />
            <SectionCard
              no={3}
              title={t("report.sec.shierGong")}
              rows={shierGong}
              twoCol
            />
            <SectionCard
              no={4}
              title={t("report.sec.keyParts")}
              rows={keyParts}
            />
            <SectionCard no={5} title={t("report.sec.extras")} rows={extras} />
          </div>
        </div>

        {/* 底部总诀 */}
        <footer className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            {["report.chip.1", "report.chip.2", "report.chip.3", "report.chip.4"].map(
              (k) => (
                <span
                  key={k}
                  className="px-4 py-1.5 rounded-full border border-gold/50 bg-parchment-soft/60 text-[12px] tracking-[0.12em] text-cinnabar font-[family-name:var(--font-cinzel)]"
                >
                  {t(k)}
                </span>
              ),
            )}
          </div>
          <p className="text-[12px] text-ink-light/80 max-w-xl mx-auto leading-relaxed">
            {t("report.disclaimer")}
          </p>
          <Link
            href="/physiognomy"
            className="inline-block mt-5 text-[12px] tracking-[0.2em] text-gold underline underline-offset-4"
          >
            {t("report.back")}
          </Link>
        </footer>
      </div>
    </>
  );
}
