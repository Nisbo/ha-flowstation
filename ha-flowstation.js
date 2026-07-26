/**
 * FlowStation Card for Home Assistant
 * Author: Nisbo
 * License: MIT
 */

const CARD_VERSION = "0.2.0";

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
  }

  static getStubConfig() {
    return {
      entity: "sensor.flowstation_flowstation",
      title: "FlowStation",
      max_last_heard: 10,
      default_tab: "timeslots",
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
    }

    this._render();
  }

  connectedCallback() {
    if (!this._timer) {
      this._timer = window.setInterval(() => {
        if ((this._entity?.attributes?.calls || []).length) {
          this._render();
        }
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
    const activeCalls = Number(attributes.active_calls ?? entity.state);
    const callCount = Number.isFinite(activeCalls) ? activeCalls : calls.length;
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
              <div class="primary-status ${flowstationOnline ? "online" : "offline"}">
                <span class="status-dot"></span>
                FlowStation ${flowstationOnline ? "online" : "offline"}
              </div>
            </div>
            <div class="status-grid">
              ${this._statusTile("Bridge", "mdi:lan", bridgeOnline)}
              ${this._statusTile("FlowStation", "mdi:radio-tower", flowstationOnline)}
              ${this._statusTile("Brew", "mdi:access-point", brewOnline)}
            </div>
          </header>

          <section class="overview-grid">
            <article class="panel call-counter">
              <h2>Aktive Calls</h2>
              <div class="counter ${callCount > 0 ? "active" : ""}">${callCount}</div>
              <div class="muted">Aktive Gespräche</div>
              <div class="registered-summary">
                <ha-icon icon="mdi:radio-handheld"></ha-icon>
                ${devices.length} registriert
              </div>
            </article>

            <article class="panel base-panel">
              <h2>Basisstation</h2>
              <div class="metrics">
                ${this._metric("Downlink (TX)", this._frequency(attributes.tx_freq_hz))}
                ${this._metric("Uplink (RX)", this._frequency(attributes.rx_freq_hz))}
                ${this._metric("Duplexabstand", this._frequency(attributes.shift_hz))}
                ${this._metric("Carrier", this._value(attributes.main_carrier))}
                ${this._metric("MCC / MNC", `${this._value(attributes.mcc)} / ${this._value(attributes.mnc)}`)}
                ${this._metric("Hangtime", this._number(attributes.hangtime_secs, 0, " s"))}
                ${this._metric("Nachbarzellen", this._value(attributes.neighbor_count, "0"))}
              </div>
            </article>
          </section>

          ${this._tabbedContent(
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
        this._render();
      });
    });
  }

  _metric(label, value) {
    return `
      <div class="metric">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  }

  _tabbedContent(slots, calls, devices, lastHeard, maxLastHeard) {
    const availableTabs = [
      {
        id: "timeslots",
        label: "Timeslots",
        icon: "mdi:view-grid-outline",
        count: 4,
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
            <span class="tab-count">${tab.count}</span>
          </button>
        `,
      )
      .join("");

    const content = {
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

  _timeslots(slots, embedded = false) {
    const rows = ["1", "2", "3", "4"]
      .map((number) => {
        const slot = slots[number] || {};
        const active = Boolean(slot.active);
        return `
          <tr class="${active ? "active-row" : ""}">
            <td data-label="Slot"><strong>${number}</strong></td>
            <td data-label="Status">
              <span class="state-pill ${active ? "active" : "idle"}">
                <span class="mini-dot"></span>
                ${active ? "Aktiv" : "Frei"}
              </span>
            </td>
            <td data-label="Typ">${this._callType(slot.type)}</td>
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
                <td data-label="Dauer">${this._duration(call)}</td>
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

        .primary-status {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .status-dot, .mini-dot {
          display: inline-block;
          border-radius: 50%;
        }

        .status-dot {
          width: 22px;
          height: 22px;
          box-shadow: 0 0 16px currentColor;
          background: currentColor;
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

        .overview-grid {
          display: grid;
          grid-template-columns: minmax(200px, 240px) 1fr;
          gap: 16px;
        }

        .panel {
          min-width: 0;
          padding: 18px;
          border: 1px solid var(--fs-border);
          border-radius: 14px;
          background: var(--fs-panel);
        }

        .call-counter {
          display: flex;
          flex-direction: column;
          text-align: center;
        }

        .call-counter h2 { text-align: left; }

        .counter {
          margin: auto 0 4px;
          color: var(--fs-green);
          font-size: 5rem;
          font-weight: 400;
          line-height: 1;
          text-shadow: 0 0 18px rgba(57,209,38,.22);
        }

        .counter.active {
          animation: pulse 1.8s ease-in-out infinite;
        }

        .muted { color: var(--secondary-text-color); }

        .registered-summary {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--fs-border);
          color: var(--secondary-text-color);
          font-size: .9rem;
        }

        .registered-summary ha-icon { --mdc-icon-size: 18px; }

        .metrics {
          display: grid;
          grid-template-columns: repeat(7, minmax(110px, 1fr));
          margin-top: 20px;
          border: 1px solid var(--fs-border);
          overflow: hidden;
        }

        .metric {
          display: grid;
          gap: 14px;
          padding: 16px 12px;
          text-align: center;
          border-right: 1px solid var(--fs-border);
        }

        .metric:last-child { border-right: 0; }
        .metric span { font-weight: 700; font-size: .88rem; }
        .metric strong { font-weight: 400; white-space: nowrap; }

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

        .mini-dot {
          width: 10px;
          height: 10px;
          background: #d8dde1;
        }

        .state-pill.active .mini-dot {
          background: var(--fs-green);
          box-shadow: 0 0 9px var(--fs-green);
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

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .62; }
        }

        @media (max-width: 1100px) {
          .hero { align-items: flex-start; }
          .status-grid { grid-template-columns: 1fr; width: min(270px, 42%); }
          .metrics { grid-template-columns: repeat(4, 1fr); }
          .metric { border-bottom: 1px solid var(--fs-border); }
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
          .overview-grid { grid-template-columns: 1fr; }
          .call-counter { min-height: 210px; }
          .metrics { grid-template-columns: repeat(2, 1fr); }
          .metric:nth-child(even) { border-right: 0; }
          .base-panel { padding: 14px; }
          .tab-button {
            flex: 1 0 auto;
            padding: 10px;
          }
        }

        @media (max-width: 520px) {
          .primary-status { font-size: 1rem; }
          .status-dot { width: 16px; height: 16px; }
          .metrics { grid-template-columns: 1fr; }
          .metric { border-right: 0; }

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
