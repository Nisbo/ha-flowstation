/**
 * FlowStation Card for Home Assistant
 * Author: Nisbo
 * License: MIT
 */

const CARD_VERSION = "0.5.0";

class HaFlowStationCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._entity = null;
    this._entityReceivedAt = Date.now();
    this._timer = null;
    this._activeTab = null;
    this._tabHover = false;
    this._renderPending = false;
  }

  static getStubConfig() {
    return {
      entity: "sensor.flowstation_flowstation",
      title: "FlowStation",
      max_last_heard: 10,
      default_tab: "dashboard",
      compact_timeslots: false,
    };
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Eine Kartenkonfiguration wird benötigt.");
    }

    this._config = {
      entity: "sensor.flowstation_flowstation",
      title: "FlowStation",
      max_last_heard: 10,
      show_active_calls: true,
      show_registered_devices: true,
      show_last_heard: true,
      ...config,
    };
    this._activeTab = this._config.default_tab;

    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const nextEntity = hass?.states?.[this._config.entity];

    if (nextEntity !== this._entity) {
      this._entity = nextEntity;
      this._entityReceivedAt = Date.now();

      if (this._tabHover) {
        this._renderPending = true;
        return;
      }

      this._render();
    }
  }

  connectedCallback() {
    if (!this._timer) {
      this._timer = window.setInterval(() => {
        this._updateDurations();
      }, 1000);
    }
  }

  disconnectedCallback() {
    if (this._timer) {
      window.clearInterval(this._timer);
      this._timer = null;
    }
  }

  getCardSize() {
    return 12;
  }

  getGridOptions() {
    return {
      columns: 12,
      min_columns: 6,
      rows: "auto",
    };
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _value(value, fallback = "–") {
    return value === null || value === undefined || value === ""
      ? fallback
      : this._escape(value);
  }

  _number(value, digits = 0, suffix = "") {
    const number = Number(value);
    return Number.isFinite(number)
      ? `${number.toFixed(digits)}${suffix}`
      : "–";
  }

  _frequency(value) {
    const frequency = Number(value);
    return Number.isFinite(frequency)
      ? `${(frequency / 1_000_000).toFixed(4)} MHz`
      : "–";
  }

  _bool(value) {
    if (value === null || value === undefined) return "–";
    return value ? "Ja" : "Nein";
  }

  _duration(call) {
    const initial = Number(call?.started_secs_ago || 0);
    const elapsed = Math.floor(
      (Date.now() - this._entityReceivedAt) / 1000,
    );
    const total = Math.max(0, initial + elapsed);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  _updateDurations() {
    this.shadowRoot
      ?.querySelectorAll("[data-call-duration]")
      .forEach((cell) => {
        const initial = Number(cell.dataset.started || 0);
        const elapsed = Math.floor(
          (Date.now() - this._entityReceivedAt) / 1000,
        );
        const total = Math.max(0, initial + elapsed);
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        cell.textContent =
          `${String(minutes).padStart(2, "0")}:` +
          String(seconds).padStart(2, "0");
      });
  }

  _activity(value) {
    const labels = {
      call_group: "Gruppenruf",
      call_individual: "Einzelruf",
      sds: "SDS",
    };
    return labels[value] || value || "–";
  }

  _callType(value) {
    const labels = {
      group: "Gruppe",
      individual: "Einzelruf",
    };
    return labels[value] || value || "–";
  }

  _statusTile(label, icon, online) {
    const stateClass = online ? "online" : "offline";
    const stateText = online ? "Online" : "Offline";

    return `
      <div class="status-tile ${stateClass}">
        <div class="status-icon">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div>
          <div class="status-label">${label}</div>
          <div class="status-value">${stateText}</div>
        </div>
      </div>
    `;
  }

  _emptyRow(columns, message) {
    return `
      <tr>
        <td class="empty" colspan="${columns}">
          <ha-icon icon="mdi:message-text-outline"></ha-icon>
          ${this._escape(message)}
        </td>
      </tr>
    `;
  }

  _render() {
    if (!this.shadowRoot || !this._config.entity) return;

    const entity = this._entity;
    if (!entity) {
      this.shadowRoot.innerHTML = `
        ${this._styles()}
        <ha-card>
          <div class="error">
            <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
            <div>
              <strong>FlowStation-Sensor nicht gefunden</strong>
              <span>${this._escape(this._config.entity)}</span>
            </div>
          </div>
        </ha-card>
      `;
      return;
    }

    const attributes = entity.attributes || {};
    const slots = attributes.slots || {};
    const calls = Array.isArray(attributes.calls) ? attributes.calls : [];
    const devices = Array.isArray(attributes.registered_devices)
      ? attributes.registered_devices
      : [];
    const lastHeard = Array.isArray(attributes.last_heard)
      ? attributes.last_heard
      : [];
    const unavailable = ["unavailable", "unknown"].includes(entity.state);
    const bridgeOnline = !unavailable && Boolean(attributes.bridge_online);
    const flowstationOnline =
      !unavailable && Boolean(attributes.flowstation_online);
    const brewOnline = !unavailable && Boolean(attributes.brew_online);
    const maxLastHeard = Math.max(
      1,
      Number(this._config.max_last_heard) || 10,
    );

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card>
        <div class="dashboard">
          <header class="hero">
            <div class="identity">
              <h1>${this._escape(this._config.title)}</h1>
              <div class="subtitle">
                <ha-icon icon="mdi:radio-tower"></ha-icon>
                TETRA-Basisstation
              </div>
            </div>
            <div class="status-grid">
              ${this._statusTile("Bridge", "mdi:lan", bridgeOnline)}
              ${this._statusTile("FlowStation", "mdi:radio-tower", flowstationOnline)}
              ${this._statusTile("Brew", "mdi:access-point", brewOnline)}
            </div>
          </header>

          ${this._tabbedContent(
            attributes,
            slots,
            calls,
            devices,
            lastHeard,
            maxLastHeard,
          )}
        </div>
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        this._activeTab = button.dataset.tab;
        this._tabHover = false;
        this._renderPending = false;
        this._render();
      });
      button.addEventListener("mouseenter", () => {
        this._tabHover = true;
      });
      button.addEventListener("mouseleave", () => {
        this._tabHover = false;

        if (this._renderPending) {
          this._renderPending = false;
          this._render();
        }
      });
    });
  }

  _metric(label, value, icon) {
    return `
      <div class="metric">
        <div class="metric-icon"><ha-icon icon="${icon}"></ha-icon></div>
        <div class="metric-copy">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      </div>
    `;
  }

  _tabbedContent(
    attributes,
    slots,
    calls,
    devices,
    lastHeard,
    maxLastHeard,
  ) {
    const availableTabs = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "mdi:view-dashboard-outline",
        count: null,
      },
      {
        id: "base_station",
        label: "Basisstation",
        icon: "mdi:radio-tower",
        count: null,
      },
      {
        id: "timeslots",
        label: "Timeslots",
        icon: "mdi:view-grid-outline",
        count: null,
      },
      ...(this._config.show_active_calls
        ? [{
            id: "active_calls",
            label: "Aktive Calls",
            icon: "mdi:phone-in-talk-outline",
            count: calls.length,
          }]
        : []),
      ...(this._config.show_registered_devices
        ? [{
            id: "registered_devices",
            label: "Registrierte Geräte",
            icon: "mdi:radio-handheld",
            count: devices.length,
          }]
        : []),
      ...(this._config.show_last_heard
        ? [{
            id: "last_heard",
            label: "Zuletzt gehört",
            icon: "mdi:history",
            count: lastHeard.length,
          }]
        : []),
    ];

    if (!availableTabs.some((tab) => tab.id === this._activeTab)) {
      this._activeTab = availableTabs[0].id;
    }

    const tabs = availableTabs
      .map(
        (tab) => `
          <button
            class="tab-button ${tab.id === this._activeTab ? "selected" : ""}"
            data-tab="${tab.id}"
            type="button"
            role="tab"
            aria-selected="${tab.id === this._activeTab}"
          >
            <ha-icon icon="${tab.icon}"></ha-icon>
            <span>${tab.label}</span>
            ${tab.count === null ? "" : `<span class="tab-count">${tab.count}</span>`}
          </button>
        `,
      )
      .join("");

    const content = {
      dashboard: () => this._dashboard(attributes, slots, calls, devices),
      base_station: () => this._baseStation(attributes),
      timeslots: () => this._timeslots(slots, true),
      active_calls: () => this._activeCalls(calls, true),
      registered_devices: () => this._registeredDevices(devices, true),
      last_heard: () => this._lastHeard(lastHeard.slice(0, maxLastHeard), true),
    }[this._activeTab]();

    return `
      <section class="panel tabs-panel">
        <div class="tabs-scroll" role="tablist">${tabs}</div>
        <div class="tab-content" role="tabpanel">${content}</div>
      </section>
    `;
  }

  _baseStation(attributes) {
    return `
      <div class="base-station-tab">
        <div class="base-station-heading">
          <div class="base-station-symbol">
            <ha-icon icon="mdi:radio-tower"></ha-icon>
          </div>
          <div>
            <h2>Basisstation</h2>
            <span>Funk- und Netzwerkparameter</span>
          </div>
        </div>
        <div class="metrics">
          ${this._metric("Downlink (TX)", this._frequency(attributes.tx_freq_hz), "mdi:arrow-down-bold")}
          ${this._metric("Uplink (RX)", this._frequency(attributes.rx_freq_hz), "mdi:arrow-up-bold")}
          ${this._metric("Duplexabstand", this._frequency(attributes.shift_hz), "mdi:swap-vertical-bold")}
          ${this._metric("Carrier", this._value(attributes.main_carrier), "mdi:sine-wave")}
          ${this._metric("MCC / MNC", `${this._value(attributes.mcc)} / ${this._value(attributes.mnc)}`, "mdi:identifier")}
          ${this._metric("Hangtime", this._number(attributes.hangtime_secs, 0, " s"), "mdi:timer-outline")}
          ${this._metric("Nachbarzellen", this._value(attributes.neighbor_count, "0"), "mdi:access-point-network")}
        </div>
      </div>
    `;
  }

  _dashboard(attributes, slots, calls, devices) {
    const slotCards = ["1", "2", "3", "4"]
      .map((number) =>
        this._slotCard(
          number,
          slots[number] || {},
          Boolean(attributes.flowstation_online),
        ),
      )
      .join("");

    return `
      <div class="dashboard-tab">
        <section class="rf-channel ${this._config.compact_timeslots ? "compact" : ""}">
          <div class="rf-heading">
            <div>
              <span class="eyebrow">RF Channel</span>
              <strong>Carrier #${this._value(attributes.main_carrier)}</strong>
            </div>
            <div class="rf-frequencies">
              <span>DL ${this._frequency(attributes.tx_freq_hz)}</span>
              <span>UL ${this._frequency(attributes.rx_freq_hz)}</span>
            </div>
          </div>
          <div class="slot-card-grid">${slotCards}</div>
        </section>

        ${calls.length ? `
          <section class="dashboard-section">
            <div class="dashboard-section-heading">
              <h3>Aktive Calls</h3>
              <span class="live-badge"><span></span>${calls.length} aktiv</span>
            </div>
            ${this._activeCalls(calls, true)}
          </section>
        ` : ""}

        <section class="dashboard-section">
          <div class="dashboard-section-heading">
            <h3>Registrierte Geräte</h3>
            <span class="count-badge">${devices.length}</span>
          </div>
          ${this._registeredDevices(devices, true)}
        </section>
      </div>
    `;
  }

  _slotCard(number, slot, flowstationOnline) {
    const mcch = number === "1";
    const active = Boolean(slot.active);
    const label = mcch
      ? "MCCH"
      : active
      ? (slot.source_callsign || slot.source || this._callType(slot.type))
      : "Frei";
    const detail = mcch
      ? (flowstationOnline ? "Aktiv" : "Offline")
      : active
      ? `Ziel ${this._value(slot.destination)}`
      : "Idle";
    const state = mcch
      ? (flowstationOnline ? "CONTROL" : "OFFLINE")
      : active
        ? "ACTIVE"
        : "IDLE";

    return `
      <article class="slot-card ${mcch ? "mcch" : active ? "active" : "idle"}">
        <div class="slot-card-top">
          <strong>TS ${number}</strong>
          <span class="slot-state">${state}</span>
        </div>
        <div class="slot-visual">
          <span class="radio-pulse"></span>
          <div class="signal-bars" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>
        <div class="slot-main">${this._escape(label)}</div>
        <div class="slot-detail">${detail}</div>
        ${active && !mcch ? `
          <div class="slot-meta">
            <span>${this._callType(slot.type)}</span>
            <span>Sprecher ${this._value(slot.speaker_callsign || slot.speaker)}</span>
          </div>
        ` : ""}
      </article>
    `;
  }

  _timeslots(slots, embedded = false) {
    const rows = ["1", "2", "3", "4"]
      .map((number) => {
        const slot = slots[number] || {};
        const mcch = number === "1";
        const active = Boolean(slot.active);
        return `
          <tr class="${mcch ? "mcch-row" : active ? "active-row" : ""}">
            <td data-label="Slot"><strong>${number}</strong></td>
            <td data-label="Status">
              <span class="state-pill ${mcch ? "mcch" : active ? "active" : "idle"}">
                <span class="mini-dot"></span>
                ${mcch ? "MCCH" : active ? "Aktiv" : "Frei"}
              </span>
            </td>
            <td data-label="Typ">${mcch ? "Kontrollkanal" : this._callType(slot.type)}</td>
            <td data-label="Quelle">${this._value(slot.source)}</td>
            <td data-label="Rufzeichen">${this._value(slot.source_callsign)}</td>
            <td data-label="Ziel">${this._value(slot.destination)}</td>
            <td data-label="Sprecher">${this._value(slot.speaker_callsign || slot.speaker)}</td>
            <td data-label="Priorität">${this._value(slot.priority)}</td>
            <td data-label="Simplex">${this._bool(slot.simplex)}</td>
          </tr>
        `;
      })
      .join("");

    const table = `
      <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Slot</th><th>Status</th><th>Typ</th><th>Quelle (ISSI)</th>
                <th>Rufzeichen</th><th>Ziel (ISSI / GSSI)</th><th>Sprecher</th>
                <th>Priorität</th><th>Simplex</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
      </div>
    `;

    return embedded
      ? table
      : `<section class="panel table-panel"><h2>Timeslots</h2>${table}</section>`;
  }

  _activeCalls(calls, embedded = false) {
    const rows = calls.length
      ? calls
          .map(
            (call) => `
              <tr>
                <td data-label="ID">${this._value(call.call_id)}</td>
                <td data-label="Typ">${this._callType(call.type)}</td>
                <td data-label="Slot">${this._value(call.slot)}</td>
                <td data-label="Quelle">${this._value(call.source)}</td>
                <td data-label="Rufzeichen">${this._value(call.source_callsign)}</td>
                <td data-label="Ziel">${this._value(call.destination)}</td>
                <td data-label="Sprecher">${this._value(call.speaker_callsign || call.speaker)}</td>
                <td
                  data-label="Dauer"
                  data-call-duration
                  data-started="${Number(call.started_secs_ago || 0)}"
                >${this._duration(call)}</td>
                <td data-label="Priorität">${this._value(call.priority)}</td>
                <td data-label="Simplex">${this._bool(call.simplex)}</td>
                <td data-label="Carrier">${this._value(call.carrier)}</td>
              </tr>
            `,
          )
          .join("")
      : this._emptyRow(11, "Keine aktiven Gespräche");

    const table = `
      <div class="table-scroll">
          <table>
            <thead><tr>
              <th>ID</th><th>Typ</th><th>Slot</th><th>Quelle (ISSI)</th>
              <th>Rufzeichen</th><th>Ziel (ISSI / GSSI)</th><th>Sprecher</th>
              <th>Dauer</th><th>Priorität</th><th>Simplex</th><th>Carrier</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
      </div>
    `;

    return embedded
      ? table
      : `<section class="panel table-panel"><h2>Aktive Calls</h2>${table}</section>`;
  }

  _registeredDevices(devices, embedded = false) {
    const rows = devices.length
      ? devices
          .map((device) => {
            const groups = Array.isArray(device.groups)
              ? device.groups.join(", ")
              : "–";
            return `
              <tr>
                <td data-label="ISSI">${this._value(device.issi)}</td>
                <td data-label="Rufzeichen"><strong>${this._value(device.callsign)}</strong></td>
                <td data-label="Gruppen">${this._value(groups)}</td>
                <td data-label="Aktive Gruppe">${this._value(device.selected_group)}</td>
                <td data-label="RSSI">${device.rssi_dbfs == null ? "–" : this._number(device.rssi_dbfs, 1, " dBFS")}</td>
                <td data-label="Energiesparen">Modus ${this._value(device.energy_saving_mode, "0")}</td>
              </tr>
            `;
          })
          .join("")
      : this._emptyRow(6, "Keine Geräte registriert");

    const table = `
      <div class="table-scroll">
          <table>
            <thead><tr>
              <th>ISSI</th><th>Rufzeichen</th><th>Gruppen</th>
              <th>Aktive Gruppe</th><th>RSSI</th><th>Energiesparen</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
      </div>
    `;

    return embedded
      ? table
      : `
        <section class="panel table-panel">
          <div class="section-heading">
            <h2>Registrierte Geräte</h2>
            <span class="count-badge">${devices.length}</span>
          </div>
          ${table}
        </section>
      `;
  }

  _lastHeard(entries, embedded = false) {
    const rows = entries.length
      ? entries
          .map(
            (entry) => `
              <tr>
                <td data-label="Zeit">${this._value(entry.time)}</td>
                <td data-label="Aktivität">
                  <span class="activity-pill ${this._escape(entry.activity || "")}">
                    ${this._escape(this._activity(entry.activity))}
                  </span>
                </td>
                <td data-label="ISSI">${this._value(entry.issi)}</td>
                <td data-label="Rufzeichen"><strong>${this._value(entry.callsign)}</strong></td>
                <td data-label="Ziel">${this._value(entry.destination)}</td>
              </tr>
            `,
          )
          .join("")
      : this._emptyRow(5, "Noch keine Aktivität");

    const table = `
      <div class="table-scroll">
          <table>
            <thead><tr>
              <th>Zeit</th><th>Aktivität</th><th>ISSI</th>
              <th>Rufzeichen</th><th>Ziel</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
      </div>
    `;

    return embedded
      ? table
      : `<section class="panel table-panel"><h2>Zuletzt gehört</h2>${table}</section>`;
  }

  _styles() {
    return `
      <style>
        :host {
          --fs-green: #39d126;
          --fs-green-soft: rgba(57, 209, 38, 0.14);
          --fs-red: #ef5350;
          --fs-border: rgba(255, 255, 255, 0.11);
          --fs-panel: linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.025));
          display: block;
        }

        * { box-sizing: border-box; }

        ha-card {
          overflow: hidden;
          color: var(--primary-text-color);
          background:
            radial-gradient(circle at 12% 0%, rgba(57, 209, 38, 0.055), transparent 28rem),
            var(--ha-card-background, var(--card-background-color));
        }

        .dashboard {
          display: grid;
          gap: 16px;
          padding: 24px;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        h1, h2 { margin: 0; }
        h1 { font-size: clamp(2rem, 4vw, 3.25rem); line-height: 1; }
        h2 { font-size: 1.25rem; }

        .subtitle {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          color: var(--secondary-text-color);
          font-size: 1rem;
          font-weight: 500;
        }

        .subtitle ha-icon { --mdc-icon-size: 20px; }

        .mini-dot {
          display: inline-block;
          border-radius: 50%;
        }

        .online { color: var(--fs-green); }
        .offline { color: var(--fs-red); }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(155px, 1fr));
          gap: 12px;
        }

        .status-tile {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 14px 16px;
          border: 1px solid var(--fs-border);
          border-radius: 13px;
          background: var(--fs-panel);
        }

        .status-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 13px;
          background: rgba(255,255,255,.045);
          flex: 0 0 auto;
        }

        .status-icon ha-icon {
          --mdc-icon-size: 32px;
          color: currentColor;
        }

        .status-label {
          color: var(--primary-text-color);
          font-weight: 700;
          font-size: 1rem;
        }

        .status-value { margin-top: 4px; }

        .panel {
          min-width: 0;
          padding: 18px;
          border: 1px solid var(--fs-border);
          border-radius: 14px;
          background: var(--fs-panel);
        }

        .muted { color: var(--secondary-text-color); }

        .metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(145px, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          padding: 14px;
          border: 1px solid var(--fs-border);
          border-radius: 11px;
          background:
            linear-gradient(135deg, rgba(57,209,38,.065), transparent 65%),
            rgba(0,0,0,.075);
          text-align: left;
        }

        .metric-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          border-radius: 10px;
          color: var(--fs-green);
          background: var(--fs-green-soft);
        }

        .metric-icon ha-icon { --mdc-icon-size: 21px; }

        .metric-copy {
          display: grid;
          gap: 5px;
          min-width: 0;
        }

        .metric span {
          color: var(--secondary-text-color);
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .02em;
          text-transform: uppercase;
        }

        .metric strong {
          overflow: hidden;
          font-size: .95rem;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .table-panel { padding: 16px; }
        .table-panel h2 { margin: 0 4px 16px; }
        .table-scroll { overflow-x: auto; }

        .tabs-panel { padding: 0; overflow: hidden; }

        .tabs-scroll {
          display: flex;
          align-items: stretch;
          gap: 4px;
          padding: 8px;
          overflow-x: auto;
          border-bottom: 1px solid var(--fs-border);
          scrollbar-width: thin;
        }

        .tab-button {
          appearance: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: max-content;
          padding: 11px 14px;
          border: 0;
          border-radius: 9px;
          color: var(--secondary-text-color);
          background: transparent;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
          transition:
            color .18s ease,
            background .18s ease,
            transform .18s ease;
        }

        .tab-button:hover {
          color: var(--primary-text-color);
          background: rgba(255,255,255,.045);
        }

        .tab-button:active { transform: scale(.98); }

        .tab-button.selected {
          color: var(--fs-green);
          background: var(--fs-green-soft);
        }

        .tab-button ha-icon { --mdc-icon-size: 20px; }

        .tab-count {
          min-width: 22px;
          padding: 2px 6px;
          border-radius: 999px;
          color: var(--secondary-text-color);
          background: rgba(255,255,255,.075);
          text-align: center;
          font-size: .75rem;
        }

        .tab-button.selected .tab-count {
          color: var(--fs-green);
          background: rgba(57,209,38,.16);
        }

        .tab-content { padding: 16px; }

        .base-station-tab {
          display: grid;
          gap: 18px;
        }

        .base-station-heading {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .base-station-heading h2 { margin: 0 0 4px; }

        .base-station-heading span {
          color: var(--secondary-text-color);
          font-size: .85rem;
        }

        .base-station-symbol {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 13px;
          color: var(--fs-green);
          background: var(--fs-green-soft);
        }

        .base-station-symbol ha-icon { --mdc-icon-size: 28px; }

        .dashboard-tab {
          display: grid;
          gap: 18px;
        }

        .rf-channel {
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--primary-color, #42a5f5) 32%, var(--fs-border));
          border-radius: 13px;
          background:
            radial-gradient(circle at 50% 0%, rgba(66,165,245,.07), transparent 45%),
            rgba(8,18,32,.2);
        }

        .rf-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          padding: 15px 17px;
          border-bottom: 1px solid var(--fs-border);
        }

        .rf-heading > div:first-child {
          display: grid;
          gap: 4px;
        }

        .eyebrow {
          color: var(--secondary-text-color);
          font-size: .7rem;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .rf-heading strong {
          font-family: var(--code-font-family, monospace);
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .rf-frequencies {
          display: flex;
          gap: 16px;
          color: color-mix(in srgb, var(--primary-color, #42a5f5) 72%, var(--secondary-text-color));
          font-family: var(--code-font-family, monospace);
          font-size: .8rem;
        }

        .slot-card-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(155px, 1fr));
          gap: 10px;
          padding: 14px;
        }

        .slot-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 190px;
          padding: 13px;
          overflow: hidden;
          border: 1px solid var(--fs-border);
          border-radius: 12px;
          background: rgba(70,105,150,.055);
          transition:
            border-color .25s ease,
            background .25s ease,
            box-shadow .25s ease;
        }

        .slot-card.active {
          border-color: color-mix(in srgb, var(--fs-green) 58%, transparent);
          background:
            radial-gradient(circle at 50% 40%, rgba(57,209,38,.18), transparent 55%),
            linear-gradient(150deg, rgba(57,209,38,.12), rgba(20,50,35,.08));
          box-shadow:
            inset 0 0 35px rgba(57,209,38,.055),
            0 0 16px rgba(57,209,38,.07);
        }

        .slot-card.mcch {
          border-color: rgba(66,165,245,.58);
          background:
            radial-gradient(circle at 50% 40%, rgba(66,165,245,.18), transparent 55%),
            linear-gradient(150deg, rgba(66,165,245,.12), rgba(15,35,65,.08));
          box-shadow:
            inset 0 0 35px rgba(66,165,245,.055),
            0 0 16px rgba(66,165,245,.07);
        }

        .slot-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          color: var(--secondary-text-color);
          font-family: var(--code-font-family, monospace);
          font-size: .76rem;
          letter-spacing: .1em;
        }

        .slot-card.active .slot-card-top strong,
        .slot-card.active .slot-state {
          color: var(--fs-green);
        }

        .slot-card.mcch .slot-card-top strong,
        .slot-card.mcch .slot-state {
          color: #42a5f5;
        }

        .slot-state { font-size: .65rem; }

        .slot-visual {
          display: grid;
          justify-items: center;
          gap: 13px;
          margin: 14px 0 8px;
        }

        .radio-pulse {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: rgba(130,155,185,.12);
        }

        .slot-card.active .radio-pulse {
          background: var(--fs-green);
          box-shadow:
            0 0 0 7px rgba(57,209,38,.13),
            0 0 0 13px rgba(57,209,38,.06),
            0 0 18px rgba(57,209,38,.65);
          animation: radioPulse 1.6s ease-in-out infinite;
        }

        .slot-card.mcch .radio-pulse {
          background: #42a5f5;
          box-shadow:
            0 0 0 7px rgba(66,165,245,.14),
            0 0 0 13px rgba(66,165,245,.06),
            0 0 18px rgba(66,165,245,.65);
          animation: radioPulse 2.2s ease-in-out infinite;
        }

        .signal-bars {
          display: flex;
          align-items: end;
          gap: 3px;
          height: 27px;
        }

        .signal-bars i {
          display: block;
          width: 4px;
          height: 5px;
          border-radius: 2px 2px 0 0;
          background: rgba(130,155,185,.14);
        }

        .slot-card.active .signal-bars i {
          background: var(--fs-green);
          animation: signalBar 1s ease-in-out infinite alternate;
        }

        .slot-card.mcch .signal-bars i {
          background: #42a5f5;
          animation: signalBar 1.5s ease-in-out infinite alternate;
        }

        .signal-bars i:nth-child(1),
        .signal-bars i:nth-child(7) { height: 9px; animation-delay: -.1s; }
        .signal-bars i:nth-child(2),
        .signal-bars i:nth-child(6) { height: 17px; animation-delay: -.35s; }
        .signal-bars i:nth-child(3),
        .signal-bars i:nth-child(5) { height: 25px; animation-delay: -.6s; }
        .signal-bars i:nth-child(4) { height: 14px; animation-delay: -.8s; }

        .slot-main {
          overflow: hidden;
          max-width: 100%;
          color: var(--secondary-text-color);
          font-family: var(--code-font-family, monospace);
          font-size: 1rem;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .slot-card.active .slot-main { color: var(--fs-green); }
        .slot-card.mcch .slot-main { color: #42a5f5; }

        .slot-detail {
          margin-top: 5px;
          color: var(--secondary-text-color);
          font-family: var(--code-font-family, monospace);
          font-size: .74rem;
        }

        .slot-meta {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          width: calc(100% + 26px);
          margin: auto -13px -13px;
          padding: 8px 10px;
          border-top: 1px solid rgba(57,209,38,.15);
          color: var(--secondary-text-color);
          background: rgba(0,0,0,.1);
          font-size: .67rem;
        }

        .rf-channel.compact .slot-card {
          min-height: 100px;
          padding: 10px;
        }

        .rf-channel.compact .slot-visual {
          gap: 6px;
          margin: 5px 0 3px;
        }

        .rf-channel.compact .radio-pulse {
          width: 11px;
          height: 11px;
          box-shadow: none;
        }

        .rf-channel.compact .signal-bars {
          gap: 2px;
          height: 14px;
        }

        .rf-channel.compact .signal-bars i {
          width: 3px;
          max-height: 14px;
        }

        .rf-channel.compact .slot-main { font-size: .86rem; }
        .rf-channel.compact .slot-detail { font-size: .66rem; }
        .rf-channel.compact .slot-meta { display: none; }

        .dashboard-section {
          padding-top: 2px;
        }

        .dashboard-section + .dashboard-section {
          padding-top: 18px;
          border-top: 1px solid var(--fs-border);
        }

        .dashboard-section-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 3px 12px;
        }

        .dashboard-section-heading h3 {
          margin: 0;
          font-size: 1rem;
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: 999px;
          color: var(--fs-green);
          background: var(--fs-green-soft);
          font-size: .72rem;
          font-weight: 700;
        }

        .live-badge span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--fs-green);
          box-shadow: 0 0 7px var(--fs-green);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: .9rem;
        }

        th, td {
          padding: 13px 12px;
          border: 1px solid var(--fs-border);
          text-align: center;
          white-space: nowrap;
        }

        th {
          font-weight: 700;
          background: rgba(0,0,0,.09);
        }

        tbody tr {
          transition: background .2s ease;
        }

        tbody tr:hover { background: rgba(255,255,255,.025); }
        .active-row { background: var(--fs-green-soft); }
        .mcch-row { background: rgba(66,165,245,.08); }

        .state-pill, .activity-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 9px;
          border-radius: 999px;
          background: rgba(255,255,255,.06);
        }

        .state-pill.active {
          color: var(--fs-green);
          background: var(--fs-green-soft);
        }

        .state-pill.mcch {
          color: #42a5f5;
          background: rgba(66,165,245,.13);
        }

        .mini-dot {
          width: 10px;
          height: 10px;
          background: #d8dde1;
        }

        .state-pill.active .mini-dot {
          background: var(--fs-green);
          box-shadow: 0 0 9px var(--fs-green);
        }

        .state-pill.mcch .mini-dot {
          background: #42a5f5;
          box-shadow: 0 0 9px #42a5f5;
        }

        .activity-pill.call_group { color: #55b8ff; background: rgba(85,184,255,.12); }
        .activity-pill.call_individual { color: #ffb74d; background: rgba(255,183,77,.12); }
        .activity-pill.sds { color: #b388ff; background: rgba(179,136,255,.12); }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 4px 16px;
        }

        .section-heading h2 { margin: 0; }

        .count-badge {
          min-width: 24px;
          padding: 3px 8px;
          border-radius: 999px;
          color: var(--fs-green);
          background: var(--fs-green-soft);
          text-align: center;
          font-weight: 700;
        }

        .empty {
          padding: 22px;
          color: var(--secondary-text-color);
          text-align: center;
        }

        .empty ha-icon {
          --mdc-icon-size: 18px;
          margin-right: 6px;
          vertical-align: -4px;
        }

        .error {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 24px;
          color: var(--error-color);
        }

        .error div { display: grid; gap: 4px; }
        .error span { color: var(--secondary-text-color); }

        @keyframes radioPulse {
          0%, 100% { transform: scale(.94); }
          50% { transform: scale(1.08); }
        }

        @keyframes signalBar {
          from { opacity: .35; transform: scaleY(.45); }
          to { opacity: 1; transform: scaleY(1); }
        }

        @media (max-width: 1100px) {
          .hero { align-items: flex-start; }
          .status-grid { grid-template-columns: 1fr; width: min(270px, 42%); }
          .metrics { grid-template-columns: repeat(3, 1fr); }
          .slot-card-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 760px) {
          .dashboard { padding: 14px; gap: 12px; }
          .hero { display: grid; }
          .status-grid {
            grid-template-columns: repeat(3, 1fr);
            width: 100%;
          }
          .status-tile {
            display: grid;
            justify-items: center;
            padding: 10px 6px;
            text-align: center;
          }
          .status-icon { width: 40px; height: 40px; }
          .status-icon ha-icon { --mdc-icon-size: 26px; }
          .status-label { font-size: .8rem; }
          .status-value { font-size: .8rem; }
          .metrics { grid-template-columns: repeat(2, 1fr); }
          .tab-button {
            flex: 1 0 auto;
            padding: 10px;
          }
        }

        @media (max-width: 520px) {
          .subtitle { font-size: .9rem; }
          .metrics { grid-template-columns: 1fr; }
          .rf-heading {
            align-items: flex-start;
            flex-direction: column;
          }
          .rf-frequencies {
            flex-wrap: wrap;
            gap: 5px 12px;
          }
          .slot-card-grid { grid-template-columns: 1fr; }
          .slot-card { min-height: 176px; }

          table, thead, tbody, tr, th, td { display: block; }
          thead { display: none; }
          tbody { display: grid; gap: 10px; }
          tr {
            overflow: hidden;
            border: 1px solid var(--fs-border);
            border-radius: 10px;
          }
          td {
            display: grid;
            grid-template-columns: minmax(105px, .8fr) 1fr;
            gap: 12px;
            border: 0;
            border-bottom: 1px solid var(--fs-border);
            text-align: left;
            white-space: normal;
          }
          td:last-child { border-bottom: 0; }
          td::before {
            content: attr(data-label);
            color: var(--secondary-text-color);
            font-size: .78rem;
            font-weight: 700;
            text-transform: uppercase;
          }
          td.empty { display: block; }
          td.empty::before { display: none; }
        }
      </style>
    `;
  }
}

if (!customElements.get("ha-flowstation-card")) {
  customElements.define("ha-flowstation-card", HaFlowStationCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-flowstation-card",
  name: "FlowStation Card",
  description: "FlowStation-Übersicht für Home Assistant",
  preview: true,
});

console.info(
  `%c FlowStation Card %c v${CARD_VERSION} `,
  "color: white; background: #2cab1b; font-weight: 700;",
  "color: #2cab1b; background: #111;",
);
