// Node-oriented editable pro deck builder.
// Run this after editing SLIDES, SOURCES, and layout functions.
// The init script installs a sibling node_modules/@oai/artifact-tool package link
// and package.json with type=module for shell-run eval builders. Run with the
// Node executable from Codex workspace dependencies or the platform-appropriate
// command emitted by the init script.
// Do not use pnpm exec from the repo root or any Node binary whose module
// lookup cannot resolve the builder's sibling node_modules/@oai/artifact-tool.

const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;

const DECK_ID = "ai-library-ucd-fix";
const OUT_DIR = "C:\\Users\\phyow\\OneDrive\\Documents\\AI Library Chat Box UI_UX\\tmp\\slides\\ai-library-ucd-fix\\outputs";
const REF_DIR = "C:\\Users\\phyow\\OneDrive\\Documents\\AI Library Chat Box UI_UX\\tmp\\slides\\ai-library-ucd-fix\\refs";
const SCRATCH_DIR = path.resolve(process.env.PPTX_SCRATCH_DIR || path.join("tmp", "slides", DECK_ID));
const PREVIEW_DIR = path.join(SCRATCH_DIR, "preview");
const VERIFICATION_DIR = path.join(SCRATCH_DIR, "verification");
const INSPECT_PATH = path.join(SCRATCH_DIR, "inspect.ndjson");
const MAX_RENDER_VERIFY_LOOPS = 3;

const INK = "#16233B";
const GRAPHITE = "#40516E";
const MUTED = "#70819F";
const PAPER = "#FFFFFF";
const PAPER_96 = "#FFFFFFF2";
const WHITE = "#FFFFFF";
const ACCENT = "#2F5FD0";
const ACCENT_DARK = "#24489F";
const GOLD = "#F4B85E";
const CORAL = "#9B7AE6";
const TRANSPARENT = "#00000000";

const TITLE_FACE = "Aptos";
const BODY_FACE = "Aptos";
const MONO_FACE = "Aptos";

const FALLBACK_PLATE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

const SOURCES = {
  course: "Course rubric for Weeks 1-12 and presentation timing rules.",
  project: "AI Library App implementation using React, Node.js, Supabase, and Gemini API.",
  usability: "Beta test feedback from 13 ICT students and post-test usability observations.",
};

const SLIDES = [
  {
    kicker: "AI LIBRARY APP",
    title: "Applying User-Centered Design to an AI-Supported Digital Library",
    subtitle: "A revised presentation focused on implementation, evaluation, and improvements across the full system life cycle.",
    expectedVisual: "Formal cover slide with strong title, subtitle, and one central implementation message.",
    moment: "From analysis to deployment",
    notes: "Introduce the project briefly, then explain that the presentation follows the weekly information systems process from planning to conclusion.",
    sources: ["course", "project"],
  },
  {
    kicker: "WEEK 1",
    title: "Introduction",
    subtitle: "The project combines digital library functions with AI-assisted recommendations to improve book discovery.",
    expectedVisual: "Three cards introducing the system, the problem, and the target users.",
    cards: [
      ["System", "The AI Library App allows users to browse books, search by topic or author, open book details, save books, and use an AI assistant for recommendations."],
      ["Problem", "Users often struggle to find the right book quickly when they do not know the exact title or need help identifying beginner-friendly resources."],
      ["Users", "The main users are university students who need digital access to academic books, references, and study materials."],
    ],
    notes: "Keep this short. Emphasize that the project is not only a catalog but a digital library system with intelligent recommendation support.",
    sources: ["project"],
  },
  {
    kicker: "WEEK 2",
    title: "Information System Planning",
    subtitle: "Planning defined the scope, timeline, and technology choices needed for smooth implementation.",
    expectedVisual: "Three cards summarizing goals, timeline, and technology stack.",
    cards: [
      ["Goals", "Core features were defined early: authentication, library browsing, book details, saved books, recent activity, and AI recommendations."],
      ["Timeline", "The work was organized by weekly course phases so that planning led into analysis, design, development, testing, deployment, and evaluation."],
      ["Technology", "React and Vite were selected for the frontend, Node.js and Express for the backend, Supabase for data and authentication, and Gemini API for AI support."],
    ],
    notes: "Mention that planning reduced implementation confusion by giving the project a clear sequence and realistic feature priorities.",
    sources: ["course", "project"],
  },
  {
    kicker: "WEEK 3",
    title: "System Analysis",
    subtitle: "Survey findings and requirement analysis showed why AI support and clear book details were necessary.",
    expectedVisual: "Metric cards highlighting participants, key functions, and major problem areas.",
    metrics: [
      ["13", "Beta-test participants", "ICT students"],
      ["7", "Core system functions identified", "Login, library, detail, save, profile, AI, activity"],
      ["2", "Major problem areas", "Book selection and recommendation clarity"],
    ],
    notes: "Speak about the key finding: users needed help when they only knew a topic and not a specific title. Connect this directly to implementation priorities.",
    sources: ["usability", "project"],
  },
  {
    kicker: "WEEK 4",
    title: "Information System Design Overview",
    subtitle: "Wireframes and layout planning translated user needs into structured screens before development began.",
    expectedVisual: "Three cards explaining design goals and page planning.",
    cards: [
      ["Wireframes", "Wireframes were created for the Library page, Book Detail page, AI Assistant page, and Profile page before implementation started."],
      ["Design Goals", "The design focused on clear navigation, readable content hierarchy, and a connected user flow across the app."],
      ["Implementation Role", "Early layout planning reduced confusion during coding and made later testing more consistent."],
    ],
    notes: "Explain that this slide introduces the design phase broadly, and the next slides show how different screens supported the implementation.",
    sources: ["course", "project"],
  },
  {
    kicker: "WEEK 4",
    title: "Design Outputs: Library and Book Detail",
    subtitle: "These pages were designed to support browsing, filtering, book evaluation, and continued discovery.",
    expectedVisual: "Three cards for the Library page, Book Detail page, and related books support.",
    cards: [
      ["Library Page", "The Library page was designed as the main entry point with search, category filters, sorting, and save actions."],
      ["Book Detail Page", "The Book Detail page was designed to show complete metadata, file availability, and stronger decision-making support."],
      ["Related Books", "Related books were added to help users continue exploring once they found a relevant title."],
    ],
    notes: "Highlight that design supported implementation by making browsing and evaluation two connected steps instead of isolated pages.",
    sources: ["project"],
  },
  {
    kicker: "WEEK 4",
    title: "Design Outputs: AI, Profile, and UML Models",
    subtitle: "The AI assistant, profile features, and system diagrams clarified interaction, workflow, and architecture.",
    expectedVisual: "Three cards covering AI, profile, and modeling diagrams.",
    cards: [
      ["AI Assistant", "The AI page was designed for natural-language recommendation queries grounded in the real catalog."],
      ["Profile", "The Profile page was designed to show saved books and recent activity so users could return to previous actions."],
      ["UML Models", "Use case and activity diagrams supported analysis, while sequence and component diagrams supported system design and implementation."],
    ],
    notes: "Mention that the UML diagrams helped explain both user-side interactions and backend-side communication before development.",
    sources: ["project"],
  },
  {
    kicker: "WEEK 5",
    title: "Information Systems Development",
    subtitle: "Development converted the design into a working full-stack application with AI-assisted recommendation logic.",
    expectedVisual: "Three cards covering frontend, backend, and the main development challenge.",
    cards: [
      ["Frontend", "The frontend was developed with React, TypeScript, and Vite to provide routing, theming, and responsive page layouts."],
      ["Backend", "The backend used Node.js and Express to process AI requests, retrieve books from Supabase, and send context to Gemini."],
      ["Challenge", "A key challenge was preventing the AI from acting like a general chatbot. This was solved by grounding responses in real catalog data."],
    ],
    notes: "Spend the time on how the AI recommendation path was implemented, since that is one of the most distinctive parts of the project.",
    sources: ["project"],
  },
  {
    kicker: "WEEK 6",
    title: "Testing in Information Systems",
    subtitle: "Functional testing verified whether the main user flows were stable enough for deployment.",
    expectedVisual: "Metric cards summarizing tested workflows and one partial issue.",
    metrics: [
      ["7", "Workflows tested", "Login, browse, search, details, save, profile, AI"],
      ["6", "Core flows passed fully", "Stable user and database features"],
      ["1", "Partial outcome", "AI quality needed refinement"],
    ],
    notes: "Call out that testing confirmed the application worked end to end, but AI relevance and reliability still needed follow-up improvement.",
    sources: ["project"],
  },
  {
    kicker: "WEEK 7",
    title: "System Deployment",
    subtitle: "Deployment moved the project from a local build to a usable online system with live configuration.",
    expectedVisual: "Three cards for frontend deployment, backend deployment, and the main deployment challenge.",
    cards: [
      ["Frontend", "The frontend was prepared for deployment with Vercel so the interface could be accessed outside the development environment."],
      ["Backend", "The backend was prepared for Render while Supabase remained responsible for authentication and database services."],
      ["Challenge", "The main challenge was configuring environment variables correctly for Supabase and Gemini API connections."],
    ],
    notes: "Mention that deployment was a key implementation step because it proved the system could operate beyond local testing.",
    sources: ["project"],
  },
  {
    kicker: "WEEK 9",
    title: "Maintenance and Troubleshooting",
    subtitle: "Post-implementation maintenance improved clarity, reliability, and consistency across the system.",
    expectedVisual: "Three cards showing the main issues resolved after deployment.",
    cards: [
      ["AI Reliability", "Recommendation logic and prompt structure were refined so responses became more focused and easier to understand."],
      ["User Data", "Saved books and recent activity were improved so the system behaved more consistently across Library, Profile, and Detail flows."],
      ["UI Stability", "Theme behavior, chat input behavior, and page consistency were adjusted to create a smoother user experience."],
    ],
    notes: "Keep this concise. Choose one specific issue to mention in speech, such as AI explanation clarity or profile synchronization.",
    sources: ["project"],
  },
  {
    kicker: "WEEK 10",
    title: "Usability Evaluation",
    subtitle: "Usability testing identified the AI assistant and Book Detail Page as the main areas needing improvement.",
    expectedVisual: "Three cards summarizing AI problems, Book Detail problems, and the implementation improvement made.",
    cards: [
      ["AI Assistant Findings", "The most common AI issues were inaccurate responses, slow response time, and limited context awareness."],
      ["Book Detail Findings", "Users also reported incomplete information, unclear layout decisions, and weak real-time update behavior on the Book Detail Page."],
      ["Improvement Made", "In response, AI explanations were simplified, recommendation logic was refined, and book-detail information clarity was improved."],
    ],
    notes: "This slide should clearly connect usability feedback to actual improvements made in the implementation.",
    sources: ["usability", "project"],
  },
  {
    kicker: "WEEK 11",
    title: "Applying User-Centered Design Across Phases",
    subtitle: "User-centered design guided the project from early planning through post-test improvement.",
    expectedVisual: "Three cards showing how the phases connected to successful implementation.",
    cards: [
      ["Planning and Analysis", "These phases clarified the real user problem and ensured the project focused on practical book-discovery issues."],
      ["Design and Development", "These phases transformed requirements into usable screens and working logic for the real application."],
      ["Testing and Evaluation", "These phases revealed where the system still needed improvement and allowed refinements before final submission."],
    ],
    notes: "Use this slide to reflect on one success and one challenge across phases, especially around AI usability.",
    sources: ["course", "project", "usability"],
  },
  {
    kicker: "WEEK 12",
    title: "Project Management Information System",
    subtitle: "The project was managed through the course-week structure, which supported steady implementation progress.",
    expectedVisual: "Metric cards summarizing phases, technologies, and one improvement area in project management.",
    metrics: [
      ["12", "Course-driven phases followed", "From introduction to conclusion"],
      ["4", "Main technologies integrated", "Frontend, backend, database, AI"],
      ["1", "Improvement area", "More time needed for AI refinement and deployment"],
    ],
    notes: "Explain that the course structure helped manage the project, but AI integration and deployment required more troubleshooting time than expected.",
    sources: ["course", "project"],
  },
  {
    kicker: "FINAL",
    title: "Conclusion",
    subtitle: "The final system demonstrates how user-centered implementation can make a digital library more useful and more understandable.",
    expectedVisual: "Three cards summarizing the outcome, improvement impact, and future work.",
    cards: [
      ["Outcome", "The AI Library App successfully combined library browsing, detailed book information, saved features, and AI-assisted recommendations."],
      ["Impact", "Usability-based improvements made the system clearer, more connected, and more practical for real users."],
      ["Future Work", "Future development can focus on stronger AI recommendation quality, PDF-based book understanding, and further usability refinement."],
    ],
    notes: "Close confidently and thank the audience after this slide.",
    sources: ["project", "usability"],
  },
];

const inspectRecords = [];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  if (!bytes.byteLength) {
    throw new Error(`Image file is empty: ${imagePath}`);
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function normalizeImageConfig(config) {
  if (!config.path) {
    return config;
  }
  const { path: imagePath, ...rest } = config;
  return {
    ...rest,
    blob: await readImageBlob(imagePath),
  };
}

async function ensureDirs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const obsoleteFinalArtifacts = [
    "preview",
    "verification",
    "inspect.ndjson",
    ["presentation", "proto.json"].join("_"),
    ["quality", "report.json"].join("_"),
  ];
  for (const obsolete of obsoleteFinalArtifacts) {
    await fs.rm(path.join(OUT_DIR, obsolete), { recursive: true, force: true });
  }
  await fs.mkdir(SCRATCH_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(VERIFICATION_DIR, { recursive: true });
}

function lineConfig(fill = TRANSPARENT, width = 0) {
  return { style: "solid", fill, width };
}

function recordShape(slideNo, shape, role, shapeType, x, y, w, h) {
  if (!slideNo) return;
  inspectRecords.push({
    kind: "shape",
    slide: slideNo,
    id: shape?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    shapeType,
    bbox: [x, y, w, h],
  });
}

function addShape(slide, geometry, x, y, w, h, fill = TRANSPARENT, line = TRANSPARENT, lineWidth = 0, meta = {}) {
  const shape = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: lineConfig(line, lineWidth),
  });
  recordShape(meta.slideNo, shape, meta.role || geometry, geometry, x, y, w, h);
  return shape;
}

function normalizeText(text) {
  if (Array.isArray(text)) {
    return text.map((item) => String(item ?? "")).join("\n");
  }
  return String(text ?? "");
}

function textLineCount(text) {
  const value = normalizeText(text);
  if (!value.trim()) {
    return 0;
  }
  return Math.max(1, value.split(/\n/).length);
}

function requiredTextHeight(text, fontSize, lineHeight = 1.18, minHeight = 8) {
  const lines = textLineCount(text);
  if (lines === 0) {
    return minHeight;
  }
  return Math.max(minHeight, lines * fontSize * lineHeight);
}

function assertTextFits(text, boxHeight, fontSize, role = "text") {
  const required = requiredTextHeight(text, fontSize);
  const tolerance = Math.max(2, fontSize * 0.08);
  if (normalizeText(text).trim() && boxHeight + tolerance < required) {
    throw new Error(
      `${role} text box is too short: height=${boxHeight.toFixed(1)}, required>=${required.toFixed(1)}, ` +
        `lines=${textLineCount(text)}, fontSize=${fontSize}, text=${JSON.stringify(normalizeText(text).slice(0, 90))}`,
    );
  }
}

function wrapText(text, widthChars) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > widthChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.join("\n");
}

function recordText(slideNo, shape, role, text, x, y, w, h) {
  const value = normalizeText(text);
  inspectRecords.push({
    kind: "textbox",
    slide: slideNo,
    id: shape?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    text: value,
    textPreview: value.replace(/\n/g, " | ").slice(0, 180),
    textChars: value.length,
    textLines: textLineCount(value),
    bbox: [x, y, w, h],
  });
}

function recordImage(slideNo, image, role, imagePath, x, y, w, h) {
  inspectRecords.push({
    kind: "image",
    slide: slideNo,
    id: image?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    path: imagePath,
    bbox: [x, y, w, h],
  });
}

function applyTextStyle(box, text, size, color, bold, face, align, valign, autoFit, listStyle) {
  box.text = text;
  box.text.fontSize = size;
  box.text.color = color;
  box.text.bold = Boolean(bold);
  box.text.alignment = align;
  box.text.verticalAlignment = valign;
  box.text.typeface = face;
  box.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  if (autoFit) {
    box.text.autoFit = autoFit;
  }
  if (listStyle) {
    box.text.style = "list";
  }
}

function addText(
  slide,
  slideNo,
  text,
  x,
  y,
  w,
  h,
  {
    size = 22,
    color = INK,
    bold = false,
    face = BODY_FACE,
    align = "left",
    valign = "top",
    fill = TRANSPARENT,
    line = TRANSPARENT,
    lineWidth = 0,
    autoFit = null,
    listStyle = false,
    checkFit = true,
    role = "text",
  } = {},
) {
  if (!checkFit && textLineCount(text) > 1) {
    throw new Error("checkFit=false is only allowed for single-line headers, footers, and captions.");
  }
  if (checkFit) {
    assertTextFits(text, h, size, role);
  }
  const box = addShape(slide, "rect", x, y, w, h, fill, line, lineWidth);
  applyTextStyle(box, text, size, color, bold, face, align, valign, autoFit, listStyle);
  recordText(slideNo, box, role, text, x, y, w, h);
  return box;
}

async function addImage(slide, slideNo, config, position, role, sourcePath = null) {
  const image = slide.images.add(await normalizeImageConfig(config));
  image.position = position;
  recordImage(slideNo, image, role, sourcePath || config.path || config.uri || "inline-data-url", position.left, position.top, position.width, position.height);
  return image;
}

async function addPlate(slide, slideNo, opacityPanel = false) {
  slide.background.fill = PAPER;
  const platePath = path.join(REF_DIR, `slide-${String(slideNo).padStart(2, "0")}.png`);
  if (await pathExists(platePath)) {
    await addImage(
      slide,
      slideNo,
      { path: platePath, fit: "cover", alt: `Text-free art-direction plate for slide ${slideNo}` },
      { left: 0, top: 0, width: W, height: H },
      "art plate",
      platePath,
    );
  } else {
    await addImage(
      slide,
      slideNo,
      { dataUrl: FALLBACK_PLATE_DATA_URL, fit: "cover", alt: `Fallback blank art plate for slide ${slideNo}` },
      { left: 0, top: 0, width: W, height: H },
      "fallback art plate",
      "fallback-data-url",
    );
  }
  if (opacityPanel) {
    addShape(slide, "rect", 0, 0, W, H, "#FFFFFFB8", TRANSPARENT, 0, { slideNo, role: "plate readability overlay" });
  }
}

function addHeader(slide, slideNo, kicker, idx, total) {
  addText(slide, slideNo, String(kicker || "").toUpperCase(), 64, 34, 430, 24, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    checkFit: false,
    role: "header",
  });
  addText(slide, slideNo, `${String(idx).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, 1114, 34, 104, 24, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    align: "right",
    checkFit: false,
    role: "header",
  });
  addShape(slide, "rect", 64, 64, 1152, 2, INK, TRANSPARENT, 0, { slideNo, role: "header rule" });
  addShape(slide, "ellipse", 57, 57, 16, 16, ACCENT, INK, 2, { slideNo, role: "header marker" });
}

function addTitleBlock(slide, slideNo, title, subtitle = null, x = 64, y = 86, w = 780, dark = false) {
  const titleColor = dark ? PAPER : INK;
  const bodyColor = dark ? PAPER : GRAPHITE;
  addText(slide, slideNo, title, x, y, w, 142, {
    size: 40,
    color: titleColor,
    bold: true,
    face: TITLE_FACE,
    role: "title",
  });
  if (subtitle) {
    addText(slide, slideNo, subtitle, x + 2, y + 148, Math.min(w, 720), 70, {
      size: 19,
      color: bodyColor,
      face: BODY_FACE,
      role: "subtitle",
    });
  }
}

function addIconBadge(slide, slideNo, x, y, accent = ACCENT, kind = "signal") {
  addShape(slide, "ellipse", x, y, 54, 54, PAPER_96, INK, 1.2, { slideNo, role: "icon badge" });
  if (kind === "flow") {
    addShape(slide, "ellipse", x + 13, y + 18, 10, 10, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "ellipse", x + 31, y + 27, 10, 10, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 22, y + 25, 19, 3, INK, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
  } else if (kind === "layers") {
    addShape(slide, "roundRect", x + 13, y + 15, 26, 13, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "roundRect", x + 18, y + 24, 26, 13, GOLD, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "roundRect", x + 23, y + 33, 20, 10, CORAL, INK, 1, { slideNo, role: "icon glyph" });
  } else {
    addShape(slide, "rect", x + 16, y + 29, 6, 12, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 25, y + 21, 6, 20, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 34, y + 14, 6, 27, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
  }
}

function addCard(slide, slideNo, x, y, w, h, label, body, { accent = ACCENT, fill = PAPER_96, line = INK, iconKind = "signal" } = {}) {
  if (h < 156) {
    throw new Error(`Card is too short for editable pro-deck copy: height=${h.toFixed(1)}, minimum=156.`);
  }
  addShape(slide, "roundRect", x, y, w, h, fill, line, 1.2, { slideNo, role: `card panel: ${label}` });
  addShape(slide, "rect", x, y, 8, h, accent, TRANSPARENT, 0, { slideNo, role: `card accent: ${label}` });
  addIconBadge(slide, slideNo, x + 22, y + 24, accent, iconKind);
  addText(slide, slideNo, label, x + 88, y + 22, w - 108, 28, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "card label",
  });
  const wrapped = wrapText(body, Math.max(28, Math.floor(w / 13)));
  const bodyY = y + 86;
  const bodyH = h - (bodyY - y) - 22;
  if (bodyH < 54) {
    throw new Error(`Card body area is too short: height=${bodyH.toFixed(1)}, cardHeight=${h.toFixed(1)}, label=${JSON.stringify(label)}.`);
  }
  addText(slide, slideNo, wrapped, x + 24, bodyY, w - 48, bodyH, {
    size: 14,
    color: INK,
    face: BODY_FACE,
    role: `card body: ${label}`,
  });
}

function addMetricCard(slide, slideNo, x, y, w, h, metric, label, note = null, accent = ACCENT) {
  if (h < 132) {
    throw new Error(`Metric card is too short for editable pro-deck copy: height=${h.toFixed(1)}, minimum=132.`);
  }
  addShape(slide, "roundRect", x, y, w, h, PAPER_96, INK, 1.2, { slideNo, role: `metric panel: ${label}` });
  addShape(slide, "rect", x, y, w, 7, accent, TRANSPARENT, 0, { slideNo, role: `metric accent: ${label}` });
  addText(slide, slideNo, metric, x + 22, y + 24, w - 44, 54, {
    size: 34,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "metric value",
  });
  addText(slide, slideNo, label, x + 24, y + 82, w - 48, 38, {
    size: 16,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "metric label",
  });
  if (note) {
    addText(slide, slideNo, note, x + 24, y + h - 42, w - 48, 22, {
      size: 10,
      color: MUTED,
      face: BODY_FACE,
      role: "metric note",
    });
  }
}

function addNotes(slide, body, sourceKeys) {
  const sourceLines = (sourceKeys || []).map((key) => `- ${SOURCES[key] || key}`).join("\n");
  slide.speakerNotes.setText(`${body || ""}\n\n[Sources]\n${sourceLines}`);
}

function addReferenceCaption(slide, slideNo) {
  return;
}

function addTimelineSlide(presentation, idx, items, options = {}) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 780);
  const lineY = options.lineY || 420;
  addShape(slide, "rect", 110, lineY, 1060, 4, ACCENT, TRANSPARENT, 0, { slideNo: idx, role: "timeline line" });
  const startX = 130;
  const gap = 220;
  items.forEach((item, itemIdx) => {
    const x = startX + itemIdx * gap;
    addShape(slide, "ellipse", x, lineY - 14, 28, 28, WHITE, ACCENT, 4, { slideNo: idx, role: "timeline node" });
    addText(slide, idx, item.week, x - 8, lineY - 62, 70, 24, {
      size: 13,
      color: ACCENT_DARK,
      bold: true,
      face: MONO_FACE,
      checkFit: false,
      role: "timeline week",
    });
    addText(slide, idx, item.label, x - 30, lineY + 28, 115, 48, {
      size: 16,
      color: INK,
      bold: true,
      face: BODY_FACE,
      role: "timeline label",
    });
    addText(slide, idx, wrapText(item.note, 16), x - 30, lineY + 76, 150, 110, {
      size: 12,
      color: GRAPHITE,
      face: BODY_FACE,
      role: "timeline note",
    });
  });
  addNotes(slide, data.notes, data.sources);
}

function addTestingTableSlide(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 760);
  const headers = ["Feature", "Expected Result", "Status"];
  const rows = [
    ["Login", "User can sign in successfully", "Pass"],
    ["Library Browsing", "Books load from database", "Pass"],
    ["Search and Filter", "User narrows results correctly", "Pass"],
    ["Book Detail Page", "Full book details are displayed", "Pass"],
    ["Save Book", "Selected book is saved to profile", "Pass"],
    ["AI Assistant", "Returns recommendation response", "Partial Pass"],
  ];
  const colX = [82, 360, 958];
  const colW = [250, 580, 170];
  const top = 340;
  const rowH = 48;
  headers.forEach((header, i) => {
    addShape(slide, "roundRect", colX[i], top, colW[i], rowH, ACCENT, ACCENT, 1, { slideNo: idx, role: "table header" });
    addText(slide, idx, header, colX[i] + 14, top + 12, colW[i] - 28, 22, {
      size: 14,
      color: WHITE,
      bold: true,
      face: BODY_FACE,
      checkFit: false,
      role: "table header text",
    });
  });
  rows.forEach((row, rowIdx) => {
    const y = top + rowH + rowIdx * rowH;
    row.forEach((cell, i) => {
      addShape(slide, "rect", colX[i], y, colW[i], rowH, rowIdx % 2 === 0 ? "#F5F7FD" : WHITE, INK, 0.8, { slideNo: idx, role: "table cell" });
      addText(slide, idx, cell, colX[i] + 12, y + 10, colW[i] - 24, 26, {
        size: i === 2 ? 13 : 12,
        color: i === 2 && cell.startsWith("Partial") ? CORAL : INK,
        bold: i === 0 || i === 2,
        face: BODY_FACE,
        checkFit: false,
        role: "table text",
      });
    });
  });
  addNotes(slide, data.notes, data.sources);
}

function addEvaluationGraphSlide(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 760);
  const chartX = 90;
  const chartY = 360;
  const chartW = 560;
  const chartH = 250;
  addShape(slide, "roundRect", chartX, chartY - 26, chartW, chartH + 52, PAPER_96, INK, 1, { slideNo: idx, role: "chart panel" });
  addText(slide, idx, "AI Assistant Issues", chartX + 20, chartY - 6, 240, 24, {
    size: 15, color: INK, bold: true, face: BODY_FACE, checkFit: false, role: "chart title"
  });
  const issues = [
    { label: "Accuracy", value: 6, color: ACCENT },
    { label: "Context", value: 3, color: CORAL },
    { label: "Response Time", value: 4, color: GOLD },
  ];
  addShape(slide, "rect", chartX + 56, chartY + 10, 2, 168, INK, TRANSPARENT, 0, { slideNo: idx, role: "y axis" });
  addShape(slide, "rect", chartX + 56, chartY + 178, 430, 2, INK, TRANSPARENT, 0, { slideNo: idx, role: "x axis" });
  issues.forEach((issue, i) => {
    const barH = issue.value * 22;
    const x = chartX + 105 + i * 120;
    const y = chartY + 178 - barH;
    addShape(slide, "roundRect", x, y, 64, barH, issue.color, TRANSPARENT, 0, { slideNo: idx, role: "bar" });
    addText(slide, idx, String(issue.value), x + 22, y - 24, 24, 20, {
      size: 12, color: INK, bold: true, face: BODY_FACE, checkFit: false, role: "bar value"
    });
    addText(slide, idx, wrapText(issue.label, 10), x - 12, chartY + 190, 90, 42, {
      size: 12, color: GRAPHITE, face: BODY_FACE, align: "center", role: "bar label"
    });
  });
  addCard(slide, idx, 720, 354, 470, 252, "Implementation Improvement", "The feedback led to stronger recommendation ranking, simpler AI language, and clearer Book Detail presentation after testing.", { accent: ACCENT, iconKind: "layers" });
  addNotes(slide, data.notes, data.sources);
}

function addPhaseDiagramSlide(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 760);
  const phases = [
    ["Planning", "Set direction and scope"],
    ["Analysis", "Identified user needs"],
    ["Design", "Prepared structure and wireframes"],
    ["Development", "Built the working system"],
    ["Testing", "Verified functionality"],
    ["Evaluation", "Guided improvements"],
  ];
  const colors = [ACCENT, GOLD, CORAL, "#6AB7FF", "#8FCB81", "#8E78E8"];
  phases.forEach((phase, i) => {
    const x = 92 + i * 185;
    const y = i % 2 === 0 ? 360 : 470;
    addShape(slide, "roundRect", x, y, 150, 86, WHITE, colors[i], 2, { slideNo: idx, role: "phase box" });
    addText(slide, idx, phase[0], x + 14, y + 14, 122, 24, {
      size: 16, color: colors[i], bold: true, face: BODY_FACE, checkFit: false, role: "phase title"
    });
    addText(slide, idx, wrapText(phase[1], 16), x + 14, y + 40, 122, 40, {
      size: 10, color: GRAPHITE, face: BODY_FACE, role: "phase note"
    });
    if (i < phases.length - 1) {
      const nextX = 92 + (i + 1) * 185;
      const lineY = i % 2 === 0 ? y + 42 : y - 28;
      const nextLineY = i % 2 === 0 ? 442 : 512;
      addShape(slide, "rect", x + 150, lineY, nextX - (x + 150), 3, INK, TRANSPARENT, 0, { slideNo: idx, role: "phase connector" });
      addShape(slide, "rect", nextX - 8, nextLineY, 8, 3, INK, TRANSPARENT, 0, { slideNo: idx, role: "phase connector" });
    }
  });
  addNotes(slide, data.notes, data.sources);
}

async function slideCover(presentation) {
  const slideNo = 1;
  const data = SLIDES[0];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFCC", TRANSPARENT, 0, { slideNo, role: "cover contrast overlay" });
  addShape(slide, "rect", 64, 86, 7, 455, ACCENT, TRANSPARENT, 0, { slideNo, role: "cover accent rule" });
  addText(slide, slideNo, data.kicker, 86, 88, 520, 26, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "kicker",
  });
  addText(slide, slideNo, data.title, 82, 130, 785, 184, {
    size: 48,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover title",
  });
  addText(slide, slideNo, data.subtitle, 86, 326, 610, 86, {
    size: 20,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "cover subtitle",
  });
  addShape(slide, "roundRect", 86, 456, 390, 92, PAPER_96, INK, 1.2, { slideNo, role: "cover moment panel" });
  addText(slide, slideNo, data.moment || "Replace with core idea", 112, 478, 336, 40, {
    size: 23,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover moment",
  });
  addReferenceCaption(slide, slideNo);
  addNotes(slide, data.notes, data.sources);
}

async function slideCards(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFB8", TRANSPARENT, 0, { slideNo: idx, role: "content contrast overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 760);
  const cards = data.cards?.length
    ? data.cards
    : [
        ["Replace", "Add a specific, sourced point for this slide."],
        ["Author", "Use native PowerPoint chart objects for charts; use deterministic geometry for cards and callouts."],
        ["Verify", "Render previews, inspect them at readable size, and fix actionable layout issues within 3 total render loops."],
      ];
  const cols = Math.min(3, cards.length);
  const cardW = (1114 - (cols - 1) * 24) / cols;
  const iconKinds = ["signal", "flow", "layers"];
  for (let cardIdx = 0; cardIdx < cols; cardIdx += 1) {
    const [label, body] = cards[cardIdx];
    const x = 84 + cardIdx * (cardW + 24);
    addCard(slide, idx, x, 352, cardW, 244, label, body, { iconKind: iconKinds[cardIdx % iconKinds.length] });
  }
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function slideMetrics(presentation, idx) {
  const data = SLIDES[idx - 1];
  const slide = presentation.slides.add();
  await addPlate(slide, idx);
  addShape(slide, "rect", 0, 0, W, H, "#FFFFFFBD", TRANSPARENT, 0, { slideNo: idx, role: "metrics contrast overlay" });
  addHeader(slide, idx, data.kicker, idx, SLIDES.length);
  addTitleBlock(slide, idx, data.title, data.subtitle, 64, 86, 700);
  const metrics = data.metrics || [
    ["00", "Replace metric", "Source"],
    ["00", "Replace metric", "Source"],
    ["00", "Replace metric", "Source"],
  ];
  const accents = [ACCENT, GOLD, CORAL];
  for (let metricIdx = 0; metricIdx < Math.min(3, metrics.length); metricIdx += 1) {
    const [metric, label, note] = metrics[metricIdx];
    addMetricCard(slide, idx, 92 + metricIdx * 370, 404, 330, 174, metric, label, note, accents[metricIdx % accents.length]);
  }
  addReferenceCaption(slide, idx);
  addNotes(slide, data.notes, data.sources);
}

async function createDeck() {
  await ensureDirs();
  if (!SLIDES.length) {
    throw new Error("SLIDES must contain at least one slide.");
  }
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  await slideCover(presentation);
  for (let idx = 2; idx <= SLIDES.length; idx += 1) {
    const data = SLIDES[idx - 1];
    if (idx === 3) {
      addTimelineSlide(presentation, idx, [
        { week: "W1", label: "Intro", note: "Defined project problem and objective." },
        { week: "W2", label: "Planning", note: "Set scope, features, timeline, and tools." },
        { week: "W3", label: "Analysis", note: "Survey findings shaped requirements." },
        { week: "W4", label: "Design", note: "Prepared wireframes and UML models." },
        { week: "W5+", label: "Build", note: "Implementation continued into test and deployment." },
      ]);
    } else if (idx === 9) {
      addTestingTableSlide(presentation, idx);
    } else if (idx === 12) {
      addEvaluationGraphSlide(presentation, idx);
    } else if (idx === 13) {
      addPhaseDiagramSlide(presentation, idx);
    } else if (idx === 14) {
      addTimelineSlide(presentation, idx, [
        { week: "W1-2", label: "Plan", note: "Defined scope and selected technology." },
        { week: "W3-4", label: "Analyze & Design", note: "Prepared requirements and design outputs." },
        { week: "W5-7", label: "Develop & Deploy", note: "Built features and configured the live system." },
        { week: "W9-10", label: "Maintain & Evaluate", note: "Resolved issues and used usability feedback." },
        { week: "W11-12", label: "Reflect", note: "Applied UCD lessons and project-management review." },
      ], { lineY: 430 });
    } else if (data.metrics) {
      await slideMetrics(presentation, idx);
    } else {
      await slideCards(presentation, idx);
    }
  }
  return presentation;
}

async function saveBlobToFile(blob, filePath) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(filePath, bytes);
}

async function writeInspectArtifact(presentation) {
  inspectRecords.unshift({
    kind: "deck",
    id: DECK_ID,
    slideCount: presentation.slides.count,
    slideSize: { width: W, height: H },
  });
  presentation.slides.items.forEach((slide, index) => {
    inspectRecords.splice(index + 1, 0, {
      kind: "slide",
      slide: index + 1,
      id: slide?.id || `slide-${index + 1}`,
    });
  });
  const lines = inspectRecords.map((record) => JSON.stringify(record)).join("\n") + "\n";
  await fs.writeFile(INSPECT_PATH, lines, "utf8");
}

async function currentRenderLoopCount() {
  const logPath = path.join(VERIFICATION_DIR, "render_verify_loops.ndjson");
  if (!(await pathExists(logPath))) return 0;
  const previous = await fs.readFile(logPath, "utf8");
  return previous.split(/\r?\n/).filter((line) => line.trim()).length;
}

async function nextRenderLoopNumber() {
  return (await currentRenderLoopCount()) + 1;
}

async function appendRenderVerifyLoop(presentation, previewPaths, pptxPath) {
  const logPath = path.join(VERIFICATION_DIR, "render_verify_loops.ndjson");
  const priorCount = await currentRenderLoopCount();
  const record = {
    kind: "render_verify_loop",
    deckId: DECK_ID,
    loop: priorCount + 1,
    maxLoops: MAX_RENDER_VERIFY_LOOPS,
    capReached: priorCount + 1 >= MAX_RENDER_VERIFY_LOOPS,
    timestamp: new Date().toISOString(),
    slideCount: presentation.slides.count,
    previewCount: previewPaths.length,
    previewDir: PREVIEW_DIR,
    inspectPath: INSPECT_PATH,
    pptxPath,
  };
  await fs.appendFile(logPath, JSON.stringify(record) + "\n", "utf8");
  return record;
}

async function verifyAndExport(presentation) {
  await ensureDirs();
  const nextLoop = await nextRenderLoopNumber();
  if (nextLoop > MAX_RENDER_VERIFY_LOOPS) {
    throw new Error(
      `Render/verify/fix loop cap reached: ${MAX_RENDER_VERIFY_LOOPS} total renders are allowed. ` +
        "Do not rerender; note any remaining visual issues in the final response.",
    );
  }
  await writeInspectArtifact(presentation);
  const previewPaths = [];
  for (let idx = 0; idx < presentation.slides.items.length; idx += 1) {
    const slide = presentation.slides.items[idx];
    const preview = await presentation.export({ slide, format: "png", scale: 1 });
    const previewPath = path.join(PREVIEW_DIR, `slide-${String(idx + 1).padStart(2, "0")}.png`);
    await saveBlobToFile(preview, previewPath);
    previewPaths.push(previewPath);
  }
  const pptxBlob = await PresentationFile.exportPptx(presentation);
  const pptxPath = path.join(OUT_DIR, "output.pptx");
  await pptxBlob.save(pptxPath);
  const loopRecord = await appendRenderVerifyLoop(presentation, previewPaths, pptxPath);
  return { pptxPath, loopRecord };
}

const presentation = await createDeck();
const result = await verifyAndExport(presentation);
console.log(result.pptxPath);
