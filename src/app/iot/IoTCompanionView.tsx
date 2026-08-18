'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useStudyTimer } from '@/context/StudyTimerContext'
import {
  IconChevronLeft,
  IconSparkles,
  IconClipboard,
  IconCheck,
  IconDownload,
  IconDocument,
  IconPlay,
  IconPause,
} from '@/components/icons'

const ARDUINO_FIRMWARE_CODE = `/*
 * UniNav Smart Study Lamp - Open Hardware Firmware
 * Microcontrolador: ESP32 / ESP8266
 * Actuador: Tira / Aro de LEDs WS2812B (NeoPixel)
 * Sensor / Botón: Pulsador en GPIO 14
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>

// 1. CONFIGURACIÓN WIFI
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// 2. CONFIGURACIÓN UNINAV
const char* serverUrl = "https://tu-dominio.com/api/iot/lamp"; // O tu IP local http://192.168.1.X:3000/api/iot/lamp
const int POLL_INTERVAL_MS = 2000; // Consulta cada 2 segundos

// 3. HARDWARE PINS
#define LED_PIN    4      // Pin DIN de la tira LED
#define NUM_LEDS   12     // Cantidad de LEDs en el aro/tira
#define BUTTON_PIN 14     // Pin del pulsador físico

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

unsigned long lastPoll = 0;
bool lastButtonState = HIGH;

void setLampColor(uint8_t r, uint8_t g, uint8_t b) {
  for (int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(r, g, b));
  }
  strip.show();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  strip.begin();
  strip.setBrightness(120); // Brillo agradable para escritorio
  setLampColor(0, 0, 255);  // Azul inicial (Conectando)

  Serial.println("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\\nWiFi Conectado! IP: ");
  Serial.println(WiFi.localIP());
  setLampColor(99, 102, 241); // Índigo UniNav listo
}

void loop() {
  // 1. Lectura del botón físico (Toggle de sesión)
  bool buttonState = digitalRead(BUTTON_PIN);
  if (buttonState == LOW && lastButtonState == HIGH) {
    Serial.println("Botón físico presionado! Alternando sesión...");
    sendButtonToggle();
    delay(300); // Debounce
  }
  lastButtonState = buttonState;

  // 2. Polling de telemetría a UniNav
  if (millis() - lastPoll > POLL_INTERVAL_MS) {
    lastPoll = millis();
    fetchLampState();
  }
}

void fetchLampState() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(serverUrl);
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    StaticJsonDocument<256> doc;
    deserializeJson(doc, payload);

    int r = doc["r"] | 99;
    int g = doc["g"] | 102;
    int b = doc["b"] | 241;

    setLampColor(r, g, b);
  }
  http.end();
}

void sendButtonToggle() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.POST("{\\"action\\":\\"toggle\\"}");
  http.end();
}
`

export default function IoTCompanionView() {
  const { mode, isRunning, startTimer, pauseTimer, lampStatus } = useStudyTimer()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'simulador' | 'firmware' | 'circuito'>('simulador')

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ARDUINO_FIRMWARE_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadIno = () => {
    const blob = new Blob([ARDUINO_FIRMWARE_CODE], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'UniNav_SmartLamp.ino'
    link.click()
    URL.revokeObjectURL(url)
  }

  // Estilo visual de la lámpara simulada
  const getGlowColor = () => {
    switch (mode) {
      case 'study':
        return 'rgba(239, 68, 68, 0.9)'
      case 'warning':
        return 'rgba(245, 158, 11, 0.9)'
      case 'break':
        return 'rgba(16, 185, 129, 0.9)'
      default:
        return 'rgba(99, 102, 241, 0.8)'
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 flex flex-col gap-6 select-none">
      {/* Navegación Superior */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200/90 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <IconChevronLeft className="w-3.5 h-3.5" />
          <span>Volver al Inicio</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (isRunning ? pauseTimer() : startTimer())}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <IconPause className="w-3 h-3" />
                <span>Pausar Pomodoro</span>
              </>
            ) : (
              <>
                <IconPlay className="w-3 h-3" />
                <span>Iniciar Pomodoro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero Banner de IoT */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 mb-2">
              <IconSparkles className="w-3.5 h-3.5 text-indigo-400" />
              Ecosistema IoT • Hardware Companion
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Lámpara Semáforo de Concentración Pomodoro
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Dispositivo físico inteligente basado en microcontrolador (ESP32/ESP8266 + NeoPixel) que señaliza al entorno el estado de estudio para evitar interrupciones en el hogar.
            </p>
          </div>
        </div>

        {/* Tabs de Navegación del Módulo */}
        <div className="mt-5 flex gap-2 border-t border-slate-800/80 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('simulador')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'simulador'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Simulador de Lámpara en Vivo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('circuito')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'circuito'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Esquema Eléctrico & Pinout
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('firmware')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'firmware'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Código Firmware Arduino (.ino)
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: SIMULADOR DE LÁMPARA EN VIVO */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lámpara 3D / CSS Reactiva */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-xl flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
            {/* Resplandor ambiental de fondo */}
            <div
              className="absolute w-72 h-72 rounded-full blur-3xl transition-all duration-700 pointer-events-none opacity-40"
              style={{ backgroundColor: getGlowColor() }}
            />

            {/* Estructura de la Lámpara */}
            <div className="flex flex-col items-center relative z-10">
              {/* Aro / Cúpula LED */}
              <div
                className="w-36 h-36 rounded-full border-4 border-slate-700 flex items-center justify-center transition-all duration-700 shadow-2xl relative"
                style={{
                  backgroundColor: lampStatus.hex,
                  boxShadow: `0 0 50px ${getGlowColor()}, inset 0 0 20px rgba(255,255,255,0.4)`,
                }}
              >
                {/* Reflejo de cristal */}
                <div className="absolute top-2 left-6 w-10 h-6 bg-white/40 rounded-full blur-xs transform -rotate-12" />
                <span className="font-mono text-xl font-black text-white drop-shadow-md">
                  {lampStatus.state}
                </span>
              </div>

              {/* Cuello / Mástil */}
              <div className="w-4 h-24 bg-gradient-to-b from-slate-600 to-slate-800 border-x border-slate-700" />

              {/* Base de Escritorio con Botón Físico */}
              <div className="w-48 h-10 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => (isRunning ? pauseTimer() : startTimer())}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-600 text-[10px] font-bold text-slate-200 hover:text-white hover:bg-slate-700 transition-all cursor-pointer active:scale-95 shadow-inner"
                  title="Simular toque del botón físico del hardware"
                >
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>Botón Físico ESP32</span>
                </button>
              </div>
            </div>

            {/* Telemetría en Tiempo Real */}
            <div className="mt-8 text-center text-xs text-slate-400 font-mono">
              <span>Estado transmitido a /api/iot/lamp: </span>
              <strong className="text-white font-bold">{lampStatus.state}</strong>
              <span className="mx-2">•</span>
              <span>RGB: </span>
              <strong className="text-indigo-300">({lampStatus.r}, {lampStatus.g}, {lampStatus.b})</strong>
            </div>
          </div>

          {/* Panel de Información y Explicación del Semáforo */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-900">
                Estados del Semáforo de Concentración
              </h3>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200/80">
                  <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <div>
                    <strong className="text-rose-950 font-bold block">ROJO — Foco y Estudio</strong>
                    <p className="text-rose-800 mt-0.5 leading-relaxed">
                      Señaliza al entorno (familia, compañeros) que el estudiante está en concentración profunda de parcial y no debe ser interrumpido.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/80">
                  <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  <div>
                    <strong className="text-amber-950 font-bold block">AMARILLO — Transición</strong>
                    <p className="text-amber-800 mt-0.5 leading-relaxed">
                      Últimos 2 minutos del bloque para ir cerrando ideas antes de la pausa.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <div>
                    <strong className="text-emerald-950 font-bold block">VERDE — Descanso Libre</strong>
                    <p className="text-emerald-800 mt-0.5 leading-relaxed">
                      Momento de relajación, estiramiento y consultas libres con el entorno.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
              <h3 className="text-sm font-bold text-slate-900">Endpoint para Microcontroladores</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cualquier dispositivo con WiFi puede consultar este endpoint HTTP para sincronizar sus LEDs en tiempo real:
              </p>
              <div className="rounded-xl bg-slate-900 p-3 text-emerald-400 font-mono text-[11px] break-all select-all">
                GET /api/iot/lamp
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: ESQUEMA ELÉCTRICO */}
      {activeTab === 'circuito' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Esquema de Conexión y Lista de Materiales</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Circuito diseñado para ser de muy bajo costo (~$3 a $5 USD) y fácil ensamblaje para estudiantes de ingeniería.
            </p>
          </div>

          {/* Grilla de Componentes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-1">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Microcontrolador</span>
              <h3 className="text-sm font-bold text-slate-900">ESP32 / NodeMCU ESP8266</h3>
              <p className="text-xs text-slate-600 mt-1">Conexión WiFi integrada para consultar la API de UniNav cada 2 segundos.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-1">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Actuador LED</span>
              <h3 className="text-sm font-bold text-slate-900">Aro WS2812B NeoPixel (12 LEDs)</h3>
              <p className="text-xs text-slate-600 mt-1">LEDs direccionables RGB que cambian de color con un solo pin de datos GPIO.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-1">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Botón de Escritorio</span>
              <h3 className="text-sm font-bold text-slate-900">Pulsador / Sensor TTP223</h3>
              <p className="text-xs text-slate-600 mt-1">Permite arrancar o pausar el Pomodoro directamente desde la lámpara física.</p>
            </div>
          </div>

          {/* Diagrama Pinout ASCII */}
          <div className="rounded-2xl bg-slate-950 p-5 text-emerald-400 font-mono text-xs overflow-x-auto">
            <pre>{`
  ESP32 / ESP8266                    Aro LED WS2812B (NeoPixel)
 ┌─────────────────┐                ┌─────────────────────────┐
 │   [5V / VIN]    ├────────────────┤ VCC (+5V)               │
 │   [GND]         ├───────┬────────┤ GND                     │
 │   [GPIO 4]      ├───[330Ω]───────┤ DIN (Data Input)        │
 │                 │       │        └─────────────────────────┘
 │   [GPIO 14]     ├──[Pulsador]────┘
 └─────────────────┘ (GND común)
`}</pre>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CÓDIGO FUENTE ARDUINO (.INO) */}
      {activeTab === 'firmware' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Firmware Open Source para Arduino IDE</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Código listo para compilar y flashear en tu ESP32 con las librerías Adafruit_NeoPixel y ArduinoJson.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconClipboard className="w-3.5 h-3.5" />
                <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadIno}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconDownload className="w-3.5 h-3.5" />
                <span>Descargar .ino</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed select-text">
            <pre>{ARDUINO_FIRMWARE_CODE}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
