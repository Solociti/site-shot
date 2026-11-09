const W = 1600,
  H = 1000;
const $ = (id) => document.getElementById(id);
const scene = $("scene"),
  stage = $("stage");

// x, y, w, h = frame in the 1600x1000 scene; px/pt/pb = bezel; vw = virtual viewport width of the site
const D = {
  monitor: {
    x: 450,
    y: 90,
    w: 800,
    h: 474,
    r: 16,
    px: 14,
    pt: 14,
    pb: 26,
    vw: 1440,
  },
  laptop: {
    x: 60,
    y: 440,
    w: 700,
    h: 450,
    r: 16,
    px: 10,
    pt: 16,
    pb: 16,
    vw: 1280,
  },
  tablet: {
    x: 1060,
    y: 470,
    w: 300,
    h: 410,
    r: 30,
    px: 8,
    pt: 8,
    pb: 8,
    vw: 768,
  },
  phone: {
    x: 1330,
    y: 560,
    w: 170,
    h: 355,
    r: 34,
    px: 8,
    pt: 8,
    pb: 8,
    vw: 390,
  },
};
const FR = {
  black: ["#1b1f27", "#2b313c"],
  silver: ["#c9ced6", "#a9b0bb"],
  white: ["#f1f3f5", "#cfd4da"],
};
const BG = {
  sky: ["#e9f0f8", "#c9d7e8"],
  white: ["#ffffff", "#ffffff"],
  dark: ["#111827", "#1f2a44"],
  brand: ["#1a8f9a", "#7b3fb0"],
};
const state = {
  mode: "none",
  url: "",
  main: null,
  mobile: null,
  hideSb: $("hideSb").checked,
};
const screens = {},
  groups = {};
let previewGeneration = 0;
let previewTimer;

function resetPreviewStatus(message = "") {
  previewGeneration++;
  clearTimeout(previewTimer);
  $("previewStatus").textContent = message;
}

function sbWidth() {
  const d = document.createElement("div");
  d.style.cssText =
    "width:100px;height:100px;overflow:scroll;position:absolute;top:-999px";
  document.body.appendChild(d);
  const w = d.offsetWidth - d.clientWidth;
  d.remove();
  return w;
}
const SB = sbWidth();

function applySb() {
  const extra = state.hideSb ? SB : 0;
  for (const s of Object.values(screens)) {
    if (!s.frame) continue;
    s.frame.style.width = s.vw + extra + "px";
    s.frame.style.height = s.sh / (s.sw / s.vw) + extra + "px";
  }
}

$("hideSb").onchange = (e) => {
  state.hideSb = e.target.checked;
  applySb();
};

function el(cls, css, parent) {
  const d = document.createElement("div");
  d.className = cls;
  d.style.cssText = css;
  parent.appendChild(d);
  return d;
}

function build() {
  for (const [n, d] of Object.entries(D)) {
    const g = el("g", "", scene);
    groups[n] = g;
    const cx = d.x + d.w / 2;
    if (n === "monitor") {
      el(
        "x",
        `left:${cx - 45}px;top:${d.y + d.h - 4}px;width:90px;height:94px;clip-path:polygon(2% 0,98% 0,100% 100%,0 100%)`,
        g,
      );
      el(
        "x",
        `left:${cx - 140}px;top:${d.y + d.h + 86}px;width:280px;height:14px;border-radius:7px`,
        g,
      );
    }
    const dev = el(
      "dev",
      `left:${d.x}px;top:${d.y}px;width:${d.w}px;height:${d.h}px;border-radius:${d.r}px`,
      g,
    );
    el("in", `inset:2px;border-radius:${d.r - 2}px`, dev);
    const sw = d.w - 2 * d.px,
      sh = d.h - d.pt - d.pb;
    const scr = el(
      "scr",
      `left:${d.px}px;top:${d.pt}px;width:${sw}px;height:${sh}px;border-radius:${Math.max(4, d.r - d.pt)}px`,
      dev,
    );
    screens[n] = { scr, sw, sh, vw: d.vw };
    if (n === "laptop") {
      el("dot", `left:${d.w / 2 - 2.5}px;top:5px`, dev);
      el(
        "x",
        `left:${d.x - 40}px;top:${d.y + d.h}px;width:${d.w + 80}px;height:22px;
border-radius:2px 2px 0px 0px;
clip-path: polygon(
  0% 0%,
  100% 0%,
  100% calc(100% - 10px),   /* right edge, above bottom */
  calc(100% - 20px) 100%,   /* bottom edge, from right */
  20px 100%,                /* bottom edge, from left */
  0% calc(100% - 10px)      /* left edge, above bottom */
);
box-shadow:0 14px 30px rgba(15,30,55,.35)`,
        g,
      );
      el(
        "x",
        `left:${cx - 65}px;top:${d.y + d.h}px;width:130px;height:7px;border-radius:0 0 8px 8px;background:rgba(0,0,0,.22)`,
        g,
      );
    }
    if (n === "tablet") {
      el("dot", `left:${d.w / 2 - 2.5}px;top:4px`, dev);
    }
    if (n === "phone") {
      el(
        "in",
        `left:${d.w / 2 - 5}px;top:10px;width:10px;height:10px;border-radius:7px;z-index:2`,
        dev,
      );
    }
  }
}

function fill() {
  resetPreviewStatus(state.mode === "url" ? "Loading website previews..." : "");
  const generation = previewGeneration;
  let finished = 0;
  let failed = 0;
  if (state.mode === "url") {
    previewTimer = setTimeout(() => {
      if (generation === previewGeneration) {
        $("previewStatus").textContent =
          "The previews are taking longer than expected. The site may be unavailable or may block embedding. Check the browser console for details, or upload a screenshot.";
      }
    }, 12000);
  }
  for (const [n, s] of Object.entries(screens)) {
    s.scr.textContent = "";
    s.frame = null;
    const useMobile = (n === "tablet" || n === "phone") && state.mobile;
    const imgSrc =
      state.mode === "img" ? (useMobile ? state.mobile : state.main) : null;
    if (imgSrc) {
      const i = document.createElement("img");
      i.src = imgSrc;
      i.alt = "";
      i.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top";
      s.scr.appendChild(i);
    } else if (state.mode === "url") {
      const f = document.createElement("iframe");
      f.title = n + " preview";
      f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
      f.referrerPolicy = "no-referrer";
      f.style.transform = `scale(${s.sw / s.vw})`;
      let completed = false;
      const onFinish = (error) => {
        if (generation !== previewGeneration || completed) return;
        completed = true;
        finished++;
        if (error) failed++;
        if (finished === Object.keys(screens).length) {
          clearTimeout(previewTimer);
          $("previewStatus").textContent = failed
            ? "A preview could not load. Check the browser console for details, or upload a screenshot."
            : "Preview loading finished. If a device is blank or shows a refused connection, the site may block embedding. Check the browser console for details, or upload a screenshot.";
        }
      };
      f.addEventListener("load", () => onFinish(false), { once: true });
      f.addEventListener("error", () => onFinish(true), { once: true });
      f.src = state.url;
      s.frame = f;
      s.scr.appendChild(f);
    } else {
      s.scr.textContent = "Your website";
    }
  }
  applySb();
}

function fit() {
  const cap = document.body.classList.contains("cap");
  const g = cap && state.geo;
  if (g) {
    // Geometry is snapped to whole video pixels so tiles abut without seams.
    const k = g.sw / (g.kx * W);
    const t = state.tile || { s: 1, i: 0, j: 0 };
    scene.style.transform = `scale(${k * t.s})`;
    scene.style.left = (g.ox - t.i * g.sw) / g.kx + "px";
    scene.style.top = (g.oy - t.j * g.sh) / g.ky + "px";
    return;
  }
  const k = cap
    ? Math.min(innerWidth / W, innerHeight / H)
    : stage.clientWidth / W;
  scene.style.transform = `scale(${k})`;
  scene.style.left = cap ? (innerWidth - W * k) / 2 + "px" : "0";
  scene.style.top = cap ? (innerHeight - H * k) / 2 + "px" : "0";
}

function shade(hex) {
  const n = parseInt(hex.slice(1), 16),
    r = n >> 16,
    g = (n >> 8) & 255,
    b = n & 255;
  const t = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? 0 : 255;
  const m = (c) => Math.round(c + (t - c) * 0.18);
  return (
    "#" +
    [m(r), m(g), m(b)].map((v) => v.toString(16).padStart(2, "0")).join("")
  );
}

function style() {
  const sel = $("frame").value;
  const a = $("frameColor").value;
  const b = FR[sel]?.[1] ?? shade(a);
  scene.style.setProperty("--f", a);
  scene.style.setProperty("--f2", b);
  const alpha = Math.round((Number($("bgOpacity").value) * 255) / 100)
    .toString(16)
    .padStart(2, "0");
  scene.style.background = `linear-gradient(135deg,${$("bg1").value}${alpha},${$("bg2").value}${alpha})`;
}

$("form").onsubmit = (e) => {
  e.preventDefault();
  let u = $("url").value.trim();
  if (!u) {
    resetPreviewStatus("Enter a website URL to load a preview.");
    return;
  }
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(u)) u = "https://" + u;
  let url;
  try {
    url = new URL(u);
  } catch {
    resetPreviewStatus(
      "Enter a valid website URL, such as https://example.com.",
    );
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    resetPreviewStatus("Website URLs must use HTTP or HTTPS.");
    return;
  }
  const isLocal =
    url.hostname === "localhost" ||
    url.hostname.endsWith(".localhost") ||
    url.hostname === "[::1]" ||
    /^127\./.test(url.hostname);
  if (location.protocol === "https:" && url.protocol === "http:" && !isLocal) {
    resetPreviewStatus(
      "This HTTPS page cannot load an HTTP website. Try an HTTPS URL or upload a screenshot.",
    );
    return;
  }
  state.url = url.href;
  state.mode = "url";
  fill();
};
function pick(key) {
  return (e) => {
    const f = e.target.files[0];
    if (!f) return;
    state[key] = URL.createObjectURL(f);
    state.mode = "img";
    fill();
  };
}
$("fMain").onchange = pick("main");
$("fMobile").onchange = pick("mobile");
document.querySelectorAll("[data-d]").forEach(
  (c) =>
    (c.onchange = () => {
      groups[c.dataset.d].style.display = c.checked ? "" : "none";
    }),
);
document.querySelectorAll("[data-device][data-axis]").forEach((input) => {
  const { device, axis } = input.dataset;
  input.value = D[device][axis];
  input.oninput = () => {
    if (input.value === "" || !input.validity.valid) return;
    const left = document.querySelector(
      `[data-device="${device}"][data-axis="x"]`,
    );
    const top = document.querySelector(
      `[data-device="${device}"][data-axis="y"]`,
    );
    const x = left.value === "" ? D[device].x : Number(left.value);
    const y = top.value === "" ? D[device].y : Number(top.value);
    groups[device].style.transform =
      `translate(${x - D[device].x}px, ${y - D[device].y}px)`;
  };
});
$("frame").oninput = () => {
  if (FR[$("frame").value]) $("frameColor").value = FR[$("frame").value][0];
  style();
};
$("bg").oninput = () => {
  if (BG[$("bg").value]) {
    [$("bg1").value, $("bg2").value] = BG[$("bg").value];
    $("bgOpacity").value = 100;
  } else if ($("bg").value === "transparent") {
    $("bgOpacity").value = 0;
  }
  style();
};
function updateFrameColor() {
  $("frame").value = "";
  style();
}
function updateBackgroundColor() {
  $("bg").value = "";
  if ($("bgOpacity").value === "0") $("bgOpacity").value = 100;
  style();
}
$("bgOpacity").oninput = () => {
  if ($("bgOpacity").value === "0") $("bg").value = "transparent";
  else if ($("bg").value === "transparent") $("bg").value = "";
  style();
};
for (const event of ["input", "change"]) {
  $("frameColor").addEventListener(event, updateFrameColor);
  ["bg1", "bg2"].forEach((id) =>
    $(id).addEventListener(event, updateBackgroundColor),
  );
}
new ResizeObserver(fit).observe(stage);
addEventListener("resize", fit);

function recoverAlpha(dark, light) {
  for (let i = 0; i < dark.length; i += 4) {
    const difference =
      (light[i] -
        dark[i] +
        (light[i + 1] - dark[i + 1]) +
        (light[i + 2] - dark[i + 2])) /
      3;
    let alpha = Math.max(0, Math.min(255, Math.round(255 - difference)));
    if (alpha <= 3) alpha = 0;
    else if (alpha >= 252) alpha = 255;
    for (let channel = 0; channel < 3; channel++) {
      dark[i + channel] = alpha
        ? Math.min(255, Math.round((dark[i + channel] * 255) / alpha))
        : 0;
    }
    dark[i + 3] = alpha;
  }
}

$("dl").onclick = async () => {
  const st = $("status");
  st.textContent = "";
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    st.textContent = "This browser can't capture the tab. Try Chrome or Edge.";
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "never" },
      preferCurrentTab: true,
    });
  } catch (e) {
    st.textContent = "Capture was cancelled.";
    return;
  }
  try {
    const v = document.createElement("video");
    v.srcObject = stream;
    v.muted = true;
    await v.play();
    document.body.classList.add("cap");
    fit();
    await new Promise((r) => setTimeout(r, 900));
    const kx = v.videoWidth / innerWidth,
      ky = v.videoHeight / innerHeight;
    // Largest tile width (multiple of 8 so height is a whole number at 16:10) that fits the video.
    const cw = Math.floor(Math.min(v.videoWidth, (v.videoHeight * W) / H) / 8) * 8,
      ch = (cw * H) / W;
    const ox = Math.round((v.videoWidth - cw) / 2),
      oy = Math.round((v.videoHeight - ch) / 2);
    state.geo = { kx, ky, sw: cw, sh: ch, ox, oy };
    const c = document.createElement("canvas");
    const scale = Number($("scale").value) || 1;
    c.width = cw * scale;
    c.height = ch * scale;
    const out = c.getContext("2d");
    const tc = document.createElement("canvas");
    tc.width = cw;
    tc.height = ch;
    const ctx = tc.getContext("2d", { willReadFrequently: true });
    const capture = () =>
      ctx.drawImage(v, ox, oy, cw, ch, 0, 0, cw, ch);
    const transparent = Number($("bgOpacity").value) < 100;
    // Each tile is captured at native screen resolution, so output is truly sharp.
    for (let j = 0; j < scale; j++) {
      for (let i = 0; i < scale; i++) {
        state.tile = { s: scale, i, j };
        fit();
        await new Promise((r) => setTimeout(r, i || j ? 500 : 900));
        capture();
        if (transparent) {
          const dark = ctx.getImageData(0, 0, cw, ch);
          document.body.classList.add("cap-light");
          await new Promise((r) => setTimeout(r, 500));
          capture();
          const light = ctx.getImageData(0, 0, cw, ch);
          document.body.classList.remove("cap-light");
          recoverAlpha(dark.data, light.data);
          ctx.putImageData(dark, 0, 0);
        }
        out.drawImage(tc, i * cw, j * ch);
      }
    }
    c.toBlob((b) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download =
        (state.mode === "url" ? new URL(state.url).hostname : "device-mockup") +
        ".png";
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  } finally {
    stream.getTracks().forEach((t) => t.stop());
    state.tile = null;
    state.geo = null;
    document.body.classList.remove("cap-light");
    document.body.classList.remove("cap");
    fit();
  }
};

const settingsKey = "siteshot-settings";
const settingsIds = [
  "url",
  "hideSb",
  "scale",
  "frame",
  "frameColor",
  "bg",
  "bg1",
  "bg2",
  "bgOpacity",
];
const settingsInputs = [
  ...settingsIds.map((id) => $(id)),
  ...document.querySelectorAll("[data-d], [data-device][data-axis]"),
];

function settingsInputKey(input) {
  return (
    input.id ||
    input.dataset.d ||
    `${input.dataset.device}-${input.dataset.axis}`
  );
}

function saveSettings() {
  const values = {};
  for (const input of settingsInputs) {
    if (
      input.type === "number" &&
      (input.value === "" || !input.validity.valid)
    )
      continue;
    values[settingsInputKey(input)] =
      input.type === "checkbox" ? input.checked : input.value;
  }
  try {
    localStorage.setItem(
      settingsKey,
      JSON.stringify({
        values,
        activeUrl: state.mode === "url" ? state.url : "",
      }),
    );
  } catch {}
}

function restoreSettings() {
  let settings;
  try {
    settings = JSON.parse(localStorage.getItem(settingsKey));
  } catch {
    return;
  }
  if (!settings || typeof settings.values !== "object" || !settings.values)
    return;
  for (const input of settingsInputs) {
    const value = settings.values[settingsInputKey(input)];
    if (input.type === "checkbox" && typeof value === "boolean")
      input.checked = value;
    else if (input.type !== "checkbox" && typeof value === "string")
      input.value = value;
  }
  state.hideSb = $("hideSb").checked;
  document.querySelectorAll("[data-d]").forEach((input) => input.onchange());
  document
    .querySelectorAll("[data-device][data-axis]")
    .forEach((input) => input.oninput());
  if (
    typeof settings.activeUrl === "string" &&
    /^https?:\/\//i.test(settings.activeUrl)
  ) {
    state.url = settings.activeUrl;
    state.mode = "url";
  }
}

build();
restoreSettings();
style();
fill();
fit();
document.querySelector("aside").addEventListener("input", saveSettings);
document.querySelector("aside").addEventListener("change", saveSettings);
$("form").addEventListener("submit", saveSettings);
