"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

function isFieldValid(f: SignupField, v: Values): boolean {
  if (f === "fullName") return v.fullName.trim().length >= 2;
  if (f === "email") return isValidEmail(v.email.trim()) && !isPersonalEmail(v.email); // company emails only
  return v.company !== "";
}

const missingFields = (v: Values) => FIELDS.filter((f) => !isFieldValid(f, v));

/** Beside each field: a quick spinner, then a check once that field is filled in correctly. */
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

// No sign-up button. Each field gets its own check as soon as it is filled in
// correctly; once all of them are, the details save through the backend on
// their own, and every later change saves again. The store badges appear after
// the first save. A corrected email moves the saved row (the backend checks the
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

  const clearFieldTimers = () => FIELDS.forEach((f) => clearTimeout(fieldTimers.current[f]));
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      clearFieldTimers();
    },
    [],
  );

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
    clearFieldTimers();
    // Back to how the page opened, with the company still chosen.
    checkedValues.current = { company: startCompany };
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

  let statusText = t.autosave.idle;
  if (status === "saving") statusText = t.autosave.saving;
  else if (status === "error" && message) statusText = t.errors[message];
  else if (status === "saved" && !unsaved) statusText = t.autosave.saved;

  return (
    <section className={s.card} aria-labelledby="form-title">
      <h2 id="form-title" className={s.formTitle}>
        {t.formTitle}
      </h2>
      <form
        noValidate
        className={s.form}
        onSubmit={(e) => {
          // Enter in a field checks everything and saves straight away.
          e.preventDefault();
          setTouched(FIELDS);
          FIELDS.forEach((f) => checkField(f, 0));
          scheduleSave(0);
        }}
      >
        <div className={s.field}>
          <div className={s.labelRow}>
            <label htmlFor="fullName">{t.fullName}</label>
            <FieldStatus state={fieldStates.fullName} />
          </div>
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
          {invalid("fullName") && (
            <p id="fullName-error" className={s.error}>
              {t.errors.fullName}
            </p>
          )}
        </div>

        <div className={s.field}>
          <div className={s.labelRow}>
            <label htmlFor="email">{t.email}</label>
            <FieldStatus state={fieldStates.email} />
          </div>
          <p id="email-hint" className={s.hint}>
            {t.emailHint}
          </p>
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
          {invalid("email") && (
            <p id="email-error" className={s.error}>
              {isPersonalEmail(values.email) ? t.errors.personalEmail : t.errors.email}
            </p>
          )}
        </div>

        <div className={s.field}>
          <div className={s.labelRow}>
            <label htmlFor="company">{t.company}</label>
            <FieldStatus state={fieldStates.company} />
          </div>
          <p id="company-hint" className={s.hint}>
            {initialCompany ? t.companyFixedHint : t.companyHint}
          </p>
          {initialCompany ? (
            // From an invite link the company is fixed: shown, not choosable.
            <div className={s.fixed}>
              <input
                id="company"
                name="company"
                readOnly
                value={companies.find((c) => c.key === initialCompany)?.label ?? ""}
                aria-describedby="company-hint"
              />
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <rect x="4" y="9" width="12" height="8" rx="2" fill="currentColor" />
                <path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
          ) : (
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

        <p className={s.notice}>{t.notice}</p>

        <p role="status" className={s.status} data-status={status === "saved" && unsaved ? "idle" : status}>
          {status === "saved" && !unsaved && (
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {statusText}
        </p>
      </form>

      {saved && (
        <div className={s.next} aria-labelledby="next-title" role="region">
          <h3 id="next-title" className={s.doneTitle}>
            {fill(t.success.title, { name: saved.firstName })}
          </h3>
          <p className={s.doneNext}>{t.success.next}</p>
          <p className={s.emailChip} dir="ltr">
            {saved.email}
          </p>
          {badges}
          <p className={s.note}>{t.success.note}</p>
          <button type="button" className={s.linkButton} onClick={startOver}>
            {t.success.again}
          </button>
        </div>
      )}
    </section>
  );
}
