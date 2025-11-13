// =============================
// ⚙️ CONFIG GENERAL
// =============================
const URL_TRADUCTOR = "https://api.mymemory.translated.net/get";

// Idiomas disponibles
const IDIOMAS = {
  "es-ES": "Español (España)",
  "es-MX": "Español (México)",
  "en-GB": "Inglés (UK)",
  "en-US": "Inglés (US)",
  "fr-FR": "Francés",
  "pt-BR": "Portugués (Brasil)",
  "it-IT": "Italiano",
  "de-DE": "Alemán",
  "ru-RU": "Ruso",
  "ja-JP": "Japonés",
  "zh-CN": "Chino (Simplificado)",
  "ko-KR": "Coreano",
  "ar-SA": "Árabe",
  "hi-IN": "Hindi",
  "nl-NL": "Neerlandés",
  "sv-SE": "Sueco",
  "no-NO": "Noruego",
  "pl-PL": "Polaco",
  "tr-TR": "Turco"
};

// Referencias al DOM
const idiomaOrigen = document.getElementById("idiomaOrigen");
const idiomaDestino = document.getElementById("idiomaDestino");
const textoOrigen = document.getElementById("textoOrigen");
const textoTraducido = document.getElementById("textoTraducido");

const btnIntercambiar = document.getElementById("btnIntercambiar");
const btnTraducir = document.getElementById("btnTraducir");
const btnLimpiar = document.getElementById("btnLimpiar");

const btnPronunciarOrigen = document.getElementById("btnPronunciarOrigen");
const btnPronunciarTraduccion = document.getElementById(
  "btnPronunciarTraduccion"
);
const btnCopiarTraduccion = document.getElementById("btnCopiarTraduccion");

const divMensaje = document.getElementById("mensaje");
const contadorOrigen = document.getElementById("contadorOrigen");

// 🔁 Tema
const btnThemeToggle = document.getElementById("btnThemeToggle");
const themeLabel = document.querySelector(".theme-toggle-label");
const THEME_KEY = "trad_tema";

// Para la voz
let vocesDisponibles = [];

// =============================
// 🌙 / 🌞 TEMA
// =============================
function aplicarTema(theme) {
  if (theme === "light") {
    document.body.classList.add("light-theme");
    themeLabel.textContent = "Claro";
  } else {
    document.body.classList.remove("light-theme");
    themeLabel.textContent = "Oscuro";
  }
}

function cargarTema() {
  const guardado = localStorage.getItem(THEME_KEY);
  if (guardado === "light" || guardado === "dark") {
    aplicarTema(guardado);
  } else {
    aplicarTema("dark");
  }
}

function alternarTema() {
  const esLight = document.body.classList.contains("light-theme");
  const nuevo = esLight ? "dark" : "light";
  aplicarTema(nuevo);
  localStorage.setItem(THEME_KEY, nuevo);
}

// =============================
// 🧩 UTILIDADES
// =============================
function mostrarMensaje(texto, tipo = "info") {
  divMensaje.textContent = texto;
  divMensaje.className = "mensaje " + tipo;

  if (texto) {
    setTimeout(() => {
      divMensaje.textContent = "";
      divMensaje.className = "mensaje";
    }, 4000);
  }
}

// Rellena los selects
function cargarIdiomas() {
  Object.entries(IDIOMAS).forEach(([codigo, nombre]) => {
    const optOrigen = new Option(nombre, codigo);
    const optDestino = new Option(nombre, codigo);
    idiomaOrigen.add(optOrigen);
    idiomaDestino.add(optDestino);
  });

  const ultimoOrigen = localStorage.getItem("trad_origen");
  const ultimoDestino = localStorage.getItem("trad_destino");

  idiomaOrigen.value =
    ultimoOrigen && IDIOMAS[ultimoOrigen] ? ultimoOrigen : "es-ES";
  idiomaDestino.value =
    ultimoDestino && IDIOMAS[ultimoDestino] ? ultimoDestino : "en-GB";

  if (idiomaOrigen.value === idiomaDestino.value) {
    idiomaDestino.value = "en-GB";
  }
}

function guardarPreferenciasIdiomas() {
  localStorage.setItem("trad_origen", idiomaOrigen.value);
  localStorage.setItem("trad_destino", idiomaDestino.value);
}

function actualizarContador() {
  const longitud = textoOrigen.value.length;
  contadorOrigen.textContent = `${longitud} caracter${longitud === 1 ? "" : "es"}`;
}

// =============================
// 🌍 TRADUCCIÓN
// =============================
async function traducirTexto() {
  const texto = textoOrigen.value.trim();

  if (!texto) {
    mostrarMensaje("Escribe algún texto para traducir.", "error");
    return;
  }

  if (idiomaOrigen.value === idiomaDestino.value) {
    mostrarMensaje("Los idiomas de origen y destino no pueden ser iguales.", "error");
    return;
  }

  const from = idiomaOrigen.value;
  const to = idiomaDestino.value;

  mostrarMensaje("Traduciendo...", "info");
  textoTraducido.value = "";

  try {
    const url = `${URL_TRADUCTOR}?q=${encodeURIComponent(
      texto
    )}&langpair=${from}|${to}`;

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error("Error HTTP " + respuesta.status);
    }

    const data = await respuesta.json();

    let traduccion = data.responseData?.translatedText || "";

    if (Array.isArray(data.matches)) {
      const matchMejor = data.matches.find(
        (m) => m.id === 0 && m.translation
      );
      if (matchMejor) {
        traduccion = matchMejor.translation;
      }
    }

    textoTraducido.value = traduccion;
    mostrarMensaje("Traducción lista ✅", "ok");
  } catch (error) {
    console.error(error);
    mostrarMensaje(
      "Ocurrió un error al traducir. Intenta nuevamente.",
      "error"
    );
  }
}

// =============================
// 🔊 PRONUNCIACIÓN
// =============================
function cargarVoces() {
  if (!("speechSynthesis" in window)) return;
  vocesDisponibles = window.speechSynthesis.getVoices();
}

function obtenerMejorVoz(lang) {
  if (!vocesDisponibles || vocesDisponibles.length === 0) return null;

  let voz = vocesDisponibles.find((v) => v.lang === lang);
  if (voz) return voz;

  const prefijo = lang.split("-")[0];
  voz = vocesDisponibles.find((v) => v.lang.startsWith(prefijo));
  if (voz) return voz;

  return vocesDisponibles[0];
}

function pronunciar(texto, lang) {
  const contenido = texto.trim();

  if (!contenido) {
    mostrarMensaje("No hay texto para pronunciar.", "error");
    return;
  }

  if (!("speechSynthesis" in window)) {
    mostrarMensaje("Tu navegador no soporta pronunciación por voz.", "error");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(contenido);
  utterance.lang = lang;
  utterance.rate = 1;
  utterance.pitch = 1;

  const voz = obtenerMejorVoz(lang);
  if (voz) utterance.voice = voz;

  window.speechSynthesis.speak(utterance);
}

// =============================
// 📋 COPIAR
// =============================
async function copiarTraduccion() {
  const texto = textoTraducido.value.trim();
  if (!texto) {
    mostrarMensaje("No hay traducción para copiar.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(texto);
    mostrarMensaje("Traducción copiada al portapapeles 📋", "ok");
  } catch (error) {
    console.error(error);
    mostrarMensaje("No se pudo copiar al portapapeles.", "error");
  }
}

// =============================
// 🔗 EVENTOS
// =============================
document.addEventListener("DOMContentLoaded", () => {
  cargarTema();
  cargarIdiomas();

  if ("speechSynthesis" in window) {
    cargarVoces();
    window.speechSynthesis.onvoiceschanged = cargarVoces;
  }

  actualizarContador();
});

btnTraducir.addEventListener("click", traducirTexto);

btnLimpiar.addEventListener("click", () => {
  textoOrigen.value = "";
  textoTraducido.value = "";
  actualizarContador();
  mostrarMensaje("", "info");
});

btnIntercambiar.addEventListener("click", () => {
  const langTemp = idiomaOrigen.value;
  idiomaOrigen.value = idiomaDestino.value;
  idiomaDestino.value = langTemp;

  const textoTemp = textoOrigen.value;
  textoOrigen.value = textoTraducido.value;
  textoTraducido.value = textoTemp;

  actualizarContador();
  guardarPreferenciasIdiomas();
});

btnPronunciarOrigen.addEventListener("click", () => {
  pronunciar(textoOrigen.value, idiomaOrigen.value);
});

btnPronunciarTraduccion.addEventListener("click", () => {
  pronunciar(textoTraducido.value, idiomaDestino.value);
});

btnCopiarTraduccion.addEventListener("click", copiarTraduccion);

idiomaOrigen.addEventListener("change", guardarPreferenciasIdiomas);
idiomaDestino.addEventListener("change", guardarPreferenciasIdiomas);

textoOrigen.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    traducirTexto();
  }
  actualizarContador();
});

textoOrigen.addEventListener("input", actualizarContador);

// Tema
if (btnThemeToggle) {
  btnThemeToggle.addEventListener("click", alternarTema);
}



