"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { fill, type Content } from "@/content";
import { saveSignup, type SignupField } from "@/lib/api";
import { isPersonalEmail, isValidEmail } from "@/lib/normalize";
import s from "./signup.module.css";

type Values = { fullName: string; email: string; company: string };
type Status = "idle" | "saving" | "saved" | "error";
type FieldState = "checking" | "valid" | null;

const FIELDS: SignupField[] = ["fullName", "email", "company"];
const empty: Values = { fullName: "", email: "", company: "" };
const noStates: Record<SignupField, FieldState> = { fullName: null, email: null, company: null };
const TYPING_PAUSE_MS = 1200; // pause in typing before a complete form saves
const CHECK_PAUSE_MS = 500; // pause in typing before a field is checked
const CHECKING_MS = 450; // the quick spinner before a field's check
const MIN_SAVING_MS = 600; // long enough to read "Saving…" even when the save is instant
const POPUP_PAUSE_MS = 1500; // after a save while still in a text field, before the download popup opens
const POPUP_SOON_MS = 400; // otherwise, a beat to see the "Verify" step turn done

function isFieldValid(f: SignupField, v: Values): boolean {
  if (f === "fullName") return v.fullName.trim().length >= 2;
  if (f === "email") return isValidEmail(v.email.trim()) && !isPersonalEmail(v.email); // company emails only
  return v.company !== "";
}

const missingFields = (v: Values) => FIELDS.filter((f) => !isFieldValid(f, v));

const Check = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
    <path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Inside each field, at its end: a quick spinner, then a check once that field is filled in correctly. */
function FieldStatus({ state }: { state: FieldState }) {
  return (
    <span className={s.fieldStatus} data-field-state={state ?? "none"} aria-hidden="true">
      {state === "checking" && <span className={s.spinner} />}
      {state === "valid" && (
        <svg viewBox="0 0 20 20" width="20" height="20">
          <circle cx="10" cy="10" r="10" fill="currentColor" />
          <path d="M5.5 10.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/** Register, verify, download: done steps get a check, the current one is filled in. */
function Roadmap({ t, step }: { t: Content["signup"]; step: number }) {
  return (
    <ol className={s.roadmap} aria-label={t.roadmapLabel}>
      {t.roadmap.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "todo";
        return (
          <li key={label} data-step={state} aria-current={state === "current" ? "step" : undefined}>
            <span className={s.dot} aria-hidden="true">
              {state === "done" ? <Check /> : i + 1}
            </span>
            <span className={s.stepLabel}>
              {label}
              {state === "done" && <span className="visually-hidden"> ({t.stepDone})</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * An (i) button beside a field's label. Its text shows while the mouse is on
 * it, and opens and closes with a tap, click or key; Escape, leaving it or a
 * tap elsewhere closes it. The text is also the field's description, so
 * screen readers read it with the field.
 */
function InfoTip({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [arrowX, setArrowX] = useState<number>();
  const wrap = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const open = pinned || hovered;

  useEffect(() => {
    if (!pinned) return;
    const away = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [pinned]);

  // The bubble spans the label row; its arrow points at the button.
  const measure = () => {
    const b = button.current;
    if (b) setArrowX(b.offsetLeft + b.offsetWidth / 2);
  };

  return (
    <span
      ref={wrap}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        measure();
        setHovered(true);
      }}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !open) return;
        e.stopPropagation();
        setPinned(false);
        setHovered(false);
      }}
    >
      <button
        ref={button}
        type="button"
        className={s.tipButton}
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          measure();
          setPinned((p) => !p);
        }}
        onBlur={() => setPinned(false)}
      >
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
          <circle cx="10" cy="10" r="8.75" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="10" cy="6.3" r="1.2" fill="currentColor" />
          <path d="M10 9.2v5.3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </button>
      <span
        id={id}
        role="tooltip"
        className={s.tipBubble}
        data-open={open || undefined}
        style={arrowX === undefined ? undefined : ({ "--arrow-x": `${arrowX}px` } as CSSProperties)}
      >
        {children}
      </span>
    </span>
  );
}

// No sign-up button. Each field gets its own check, inside the field, as soon
// as it is filled in correctly; once all of them are, the details save through
// the backend on their own, and every later change saves again. The first save
// opens a popup with the store badges, which the "Download Rafiqi" button
// brings back. A corrected email moves the saved row (the backend checks the
// token it handed out) instead of adding a second one.
export function SignupForm({
  t,
  companies,
  initialCompany,
  badges,
}: {
  t: Content["signup"];
  companies: { key: string; label: string }[];
  /** Set when the page was opened from a company's invite link: that company is fixed. */
  initialCompany?: string;
  badges: ReactNode;
}) {
  // Without an invite link the dropdown starts on the first company, so the
  // company always starts chosen, with its check.
  const startCompany = initialCompany ?? companies[0]?.key ?? "";
  const start: Values = { ...empty, company: startCompany };
  const startStates: Record<SignupField, FieldState> = { ...noStates, company: startCompany ? "valid" : null };
  const [values, setValues] = useState<Values>(start);
  const [touched, setTouched] = useState<SignupField[]>([]);
  const [serverFields, setServerFields] = useState<SignupField[]>([]);
  const [fieldStates, setFieldStates] = useState(startStates);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<"rateLimited" | "failed" | null>(null);
  const [saved, setSaved] = useState<{ email: string; firstName: string } | null>(null);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const lastSaved = useRef<{ snapshot: string; email: string; token: string } | null>(null);
  const inFlight = useRef(false);
  const rerun = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fieldTimers = useRef<Partial<Record<SignupField, ReturnType<typeof setTimeout>>>>({});
  const checkedValues = useRef<Partial<Values>>({ company: startCompany }); // the value each field's check is for
  const honeypot = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const popup = useRef<HTMLDialogElement>(null);
  const popupTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const popupShown = useRef(false); // the popup opens by itself once per sign-up
  const popupNow = useRef(false); // Enter was pressed: open it right after the save

  const clearFieldTimers = () => FIELDS.forEach((f) => clearTimeout(fieldTimers.current[f]));
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      clearTimeout(popupTimer.current);
      clearFieldTimers();
    },
    [],
  );

  const isSaved = () => lastSaved.current?.snapshot === JSON.stringify(valuesRef.current);

  function openPopup() {
    clearTimeout(popupTimer.current);
    popupShown.current = true;
    if (popup.current && !popup.current.open) popup.current.showModal();
  }

  // After a save the download popup opens, the first time on its own. Someone
  // still in a text field gets a pause first, so it doesn't land mid-typing;
  // typing again before then puts it off until the next save.
  function popupAfterSave() {
    if (popupShown.current && !popupNow.current) return;
    const el = document.activeElement;
    const typing = el instanceof HTMLInputElement && !el.readOnly && !popupNow.current;
    popupNow.current = false;
    clearTimeout(popupTimer.current);
    popupTimer.current = setTimeout(() => isSaved() && openPopup(), typing ? POPUP_PAUSE_MS : POPUP_SOON_MS);
  }

  const setFieldState = (f: SignupField, state: FieldState) =>
    setFieldStates((prev) => (prev[f] === state ? prev : { ...prev, [f]: state }));

  // After a pause, a field that is filled in correctly shows a quick spinner
  // and then its check. Changing it takes the check away until it is checked again.
  function checkField(f: SignupField, pause: number) {
    clearTimeout(fieldTimers.current[f]);
    const value = valuesRef.current[f];
    if (!isFieldValid(f, valuesRef.current)) {
      checkedValues.current[f] = undefined;
      setFieldState(f, null);
      return;
    }
    if (checkedValues.current[f] === value) return; // this exact value already has its check
    fieldTimers.current[f] = setTimeout(() => {
      setFieldState(f, "checking");
      fieldTimers.current[f] = setTimeout(() => {
        if (valuesRef.current[f] !== value) return;
        checkedValues.current[f] = value;
        setFieldState(f, "valid");
      }, CHECKING_MS);
    }, pause);
  }

  async function save() {
    const v = valuesRef.current;
    if (missingFields(v).length) return;
    const snapshot = JSON.stringify(v);
    if (snapshot === lastSaved.current?.snapshot) return;
    if (inFlight.current) {
      rerun.current = true; // save again with the newest values once this one is back
      return;
    }
    inFlight.current = true;
    setStatus("saving");
    const started = Date.now();
    try {
      const prev = lastSaved.current;
      const res = await saveSignup({
        ...v,
        website: honeypot.current?.value,
        previous: prev ? { email: prev.email, token: prev.token } : undefined,
      });
      const wait = MIN_SAVING_MS - (Date.now() - started);
      if (wait > 0) await new Promise((done) => setTimeout(done, wait));
      if (res.ok) {
        lastSaved.current = { snapshot, email: res.email, token: res.token };
        setSaved({ email: res.email, firstName: v.fullName.trim().split(/\s+/)[0] });
        setServerFields([]);
        setMessage(null);
        setStatus("saved");
        popupAfterSave();
      } else {
        setServerFields(res.fields);
        setTouched((tf) => [...new Set([...tf, ...res.fields])]);
        for (const f of res.fields) {
          checkedValues.current[f] = undefined;
          setFieldState(f, null);
        }
        setMessage(res.message ?? null);
        setStatus("error");
      }
    } catch {
      setMessage("failed");
      setStatus("error");
    } finally {
      inFlight.current = false;
      if (rerun.current) {
        rerun.current = false;
        void save();
      }
    }
  }

  function scheduleSave(delay: number) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), delay);
  }

  function update(field: SignupField, value: string, typing: boolean) {
    const next = { ...valuesRef.current, [field]: value };
    valuesRef.current = next;
    setValues(next);
    setServerFields((f) => f.filter((x) => x !== field));
    clearTimeout(popupTimer.current);
    checkField(field, typing ? CHECK_PAUSE_MS : 0);
    scheduleSave(typing ? TYPING_PAUSE_MS : 0);
  }

  function leave(field: SignupField) {
    setTouched((tf) => (tf.includes(field) ? tf : [...tf, field]));
    checkField(field, 0);
    scheduleSave(0);
  }

  function startOver() {
    clearTimeout(saveTimer.current);
    clearTimeout(popupTimer.current);
    clearFieldTimers();
    popup.current?.close();
    // Back to how the page opened, with the company still chosen.
    checkedValues.current = { company: startCompany };
    popupShown.current = false;
    lastSaved.current = null;
    valuesRef.current = start;
    setValues(start);
    setFieldStates(startStates);
    setTouched([]);
    setServerFields([]);
    setMessage(null);
    setStatus("idle");
    setSaved(null);
    nameRef.current?.focus();
  }

  const missing = missingFields(values);
  const invalid = (f: SignupField) => serverFields.includes(f) || (touched.includes(f) && missing.includes(f));
  const unsaved = lastSaved.current?.snapshot !== JSON.stringify(values);
  const savedNow = status === "saved" && !unsaved;
  // Register until every field has its check, verify while saving, then download.
  const step = savedNow ? 2 : FIELDS.every((f) => fieldStates[f] === "valid") ? 1 : 0;

  let statusText = t.autosave.idle;
  if (status === "saving") statusText = t.autosave.saving;
  else if (status === "error" && message) statusText = t.errors[message];
  else if (savedNow) statusText = t.autosave.saved;

  return (
    <section className={s.card} aria-labelledby="form-title">
      <h2 id="form-title" className="visually-hidden">
        {t.formTitle}
      </h2>
      <Roadmap t={t} step={step} />
      <form
        noValidate
        className={s.form}
        onSubmit={(e) => {
          // Enter in a field checks everything and saves straight away, then
          // opens the download popup.
          e.preventDefault();
          setTouched(FIELDS);
          FIELDS.forEach((f) => checkField(f, 0));
          if (isSaved()) openPopup();
          else {
            popupNow.current = true;
            scheduleSave(0);
          }
        }}
      >
        <div className={s.field}>
          <label htmlFor="fullName">{t.fullName}</label>
          <div className={s.control}>
            <input
              ref={nameRef}
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              maxLength={200}
              value={values.fullName}
              onChange={(e) => update("fullName", e.target.value, true)}
              onBlur={() => leave("fullName")}
              aria-invalid={invalid("fullName") || undefined}
              aria-describedby={invalid("fullName") ? "fullName-error" : undefined}
            />
            <FieldStatus state={fieldStates.fullName} />
          </div>
          {invalid("fullName") && (
            <p id="fullName-error" className={s.error}>
              {t.errors.fullName}
            </p>
          )}
        </div>

        <div className={s.field}>
          <div className={s.labelRow}>
            <label htmlFor="email">{t.email}</label>
            <InfoTip id="email-hint" label={t.emailInfo}>
              {t.emailHint}
            </InfoTip>
          </div>
          <div className={s.control}>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={256}
              value={values.email}
              onChange={(e) => update("email", e.target.value, true)}
              onBlur={() => leave("email")}
              aria-invalid={invalid("email") || undefined}
              aria-describedby={invalid("email") ? "email-hint email-error" : "email-hint"}
            />
            <FieldStatus state={fieldStates.email} />
          </div>
          {invalid("email") && (
            <p id="email-error" className={s.error}>
              {isPersonalEmail(values.email) ? t.errors.personalEmail : t.errors.email}
            </p>
          )}
        </div>

        <div className={s.field}>
          <label htmlFor="company">{t.company}</label>
          <p id="company-hint" className="visually-hidden">
            {initialCompany ? t.companyFixedHint : t.companyHint}
          </p>
          {initialCompany ? (
            // From an invite link the company is fixed: shown, not choosable.
            <div className={`${s.control} ${s.fixed}`}>
              <svg className={s.lock} viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <rect x="4" y="9" width="12" height="8" rx="2" fill="currentColor" />
                <path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <input
                id="company"
                name="company"
                readOnly
                value={companies.find((c) => c.key === initialCompany)?.label ?? ""}
                aria-describedby="company-hint"
              />
              <FieldStatus state={fieldStates.company} />
            </div>
          ) : (
            <div className={`${s.control} ${s.choose}`}>
              <select
                id="company"
                name="company"
                required
                value={values.company}
                onChange={(e) => {
                  setTouched((tf) => (tf.includes("company") ? tf : [...tf, "company"]));
                  update("company", e.target.value, false);
                }}
                onBlur={() => leave("company")}
                aria-invalid={invalid("company") || undefined}
                aria-describedby={invalid("company") ? "company-hint company-error" : "company-hint"}
              >
                {companies.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <FieldStatus state={fieldStates.company} />
              <svg className={s.chevron} viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {invalid("company") && (
            <p id="company-error" className={s.error}>
              {t.errors.company}
            </p>
          )}
        </div>

        {/* Hidden from people; bots that fill it are ignored. */}
        <div className={s.trap} aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input ref={honeypot} id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <p role="status" className={s.status} data-status={status === "saved" && unsaved ? "idle" : status}>
          {savedNow && <Check size={16} />}
          {statusText}
        </p>

        {saved && (
          <button type="button" className={s.download} onClick={openPopup}>
            <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
              <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 15.5h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.success.download}
          </button>
        )}
      </form>

      {/* A click on the backdrop lands on the dialog itself and closes it. */}
      <dialog
        ref={popup}
        className={s.popup}
        aria-labelledby="popup-title"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      >
        {saved && (
          <div className={s.popupBody}>
            <button type="button" className={s.close} aria-label={t.success.close} onClick={() => popup.current?.close()}>
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className={s.doneIcon} aria-hidden="true">
              <Check size={28} />
            </span>
            <h2 id="popup-title" className={s.doneTitle}>
              {fill(t.success.title, { name: saved.firstName })}
            </h2>
            <h3 className={s.nextStep}>
              <span>
                {t.success.next}
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path d="M8 3v9.5M3.5 8.5L8 13l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </h3>
            <p className={s.sameEmail}>{t.success.sameEmail}</p>
            <p className={s.emailChip} dir="ltr">
              {saved.email}
            </p>
            <div className={s.badges}>{badges}</div>
            <button type="button" className={s.linkButton} onClick={startOver}>
              {t.success.again}
            </button>
          </div>
        )}
      </dialog>
    </section>
  );
}
