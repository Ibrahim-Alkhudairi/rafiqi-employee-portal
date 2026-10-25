import type { en } from "./en";

export const ar: typeof en = {
  meta: {
    title: "رفيقي للشركات | سجّل وانضم إلى التطبيق",
    titleWith: "انضم إلى رفيقي مع {company} | رفيقي",
    description: "سجّل اسمك وبريدك الإلكتروني وشركتك، ثم حمّل تطبيق رفيقي وسجّل فيه بالبريد الإلكتروني نفسه.",
  },
  brand: "رفيقي",
  skip: "تخطَّ إلى المحتوى",
  language: "اللغة",
  languages: [
    { lang: "en", label: "EN", name: "English" },
    { lang: "ar", label: "عربي", name: "" },
  ],
  signup: {
    eyebrow: "رفيقي للشركات",
    title: "انضم إلى رفيقي مع شركتك",
    titleWith: "انضم إلى رفيقي مع {company}",
    lead: "سجّل هنا ببريد الشركة، ثم حمّل تطبيق رفيقي وأنشئ حسابك ببريد الشركة نفسه، لتعرف شركتك أنك انضممت.",
    stepsLabel: "كيف تنضم",
    steps: [
      "سجّل اسمك وبريد الشركة وشركتك",
      "حمّل رفيقي من App Store أو Google Play",
      "سجّل في التطبيق ببريد الشركة نفسه",
    ],
    formTitle: "بياناتك",
    fullName: "الاسم الكامل",
    email: "بريد الشركة الإلكتروني",
    emailHint: "بريدك في الشركة التي تعمل بها، لا بريدك الشخصي مثل Gmail أو Hotmail. سجّل في تطبيق رفيقي بهذا البريد نفسه.",
    company: "الشركة",
    companyHint: "اختر الشركة التي تعمل بها.",
    companyFixedHint: "محددة من رابط الدعوة الخاص بشركتك.",
    notice: "يحفظ رفيقي اسمك وبريدك الإلكتروني وشركتك، ويشاركها مع شركتك لمتابعة من انضم.",
    autosave: {
      idle: "تُحفظ بياناتك تلقائيًا بعد تعبئة كل الحقول.",
      saving: "جارٍ الحفظ…",
      saved: "تم الحفظ. أي تعديل تجريه يُحفظ تلقائيًا.",
    },
    errors: {
      fullName: "اكتب اسمك الكامل.",
      email: "اكتب بريدًا إلكترونيًا صحيحًا، مثل name@company.com.",
      personalEmail: "استخدم بريد الشركة، لا بريدًا شخصيًا (Gmail أو Hotmail أو Outlook أو Yahoo أو iCloud).",
      company: "اختر شركتك.",
      rateLimited: "محاولات كثيرة. حاول مرة أخرى بعد بضع دقائق.",
      failed: "تعذّر حفظ بياناتك. تحقق من اتصالك، وسنحاول مجددًا عند تعديل أي حقل.",
    },
    success: {
      title: "تم تسجيلك يا {name}",
      next: "الخطوة التالية: حمّل رفيقي وأنشئ حسابك ببريد الشركة هذا:",
      note: "لديك التطبيق؟ لا يُحتسب انضمامك إلا إذا كان بريدك في ملفك الشخصي في رفيقي هو بريد الشركة هذا نفسه.",
      again: "تسجيل شخص آخر",
    },
  },
  stores: {
    label: "حمّل رفيقي",
    appStore: { alt: "Download on the App Store", lang: "en" },
    googlePlay: { alt: "احصل عليه من Google Play", lang: "ar", src: "/badges/google-play-ar.png" },
  },
  footer: {
    privacy: "سياسة الخصوصية",
  },
};
