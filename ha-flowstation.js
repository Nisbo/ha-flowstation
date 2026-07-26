/**
 * FlowStation Card for Home Assistant
 * Author: Nisbo
 * License: MIT
 */

const CARD_VERSION = "0.14.1";

const TRANSLATIONS = {
  de: {
    yes: "Ja",
    no: "Nein",
    now: "Jetzt",
    ago_seconds: "vor {value} s",
    ago_minutes: "vor {value} min",
    ago_hours: "vor {hours} h {minutes} min",
    ago_days: "vor {value} d",
    group_call: "Gruppenruf",
    individual_call: "Einzelruf",
    group: "Gruppe",
    online: "Online",
    offline: "Offline",
    sensor_missing: "FlowStation-Sensor nicht gefunden",
    tetra_base_station: "TETRA-Basisstation",
    dashboard: "Dashboard",
    base_station: "Basisstation",
    timeslots: "Timeslots",
    active_calls: "Aktive Calls",
    registered_devices: "Registrierte Geräte",
    last_heard: "Zuletzt gehört",
    no_sections: "Keine Bereiche aktiviert",
    enable_section: "Aktiviere mindestens einen Tab in der Kartenkonfiguration.",
    radio_network_parameters: "Funk- und Netzwerkparameter",
    downlink: "Downlink (TX)",
    uplink: "Uplink (RX)",
    duplex_spacing: "Duplexabstand",
    hangtime: "Hangtime",
    neighbor_cells: "Nachbarzellen",
    active: "Aktiv",
    free: "Frei",
    idle: "Frei",
    target: "Ziel",
    speaker: "Sprecher",
    control_channel: "Kontrollkanal",
    type: "Typ",
    source: "Quelle",
    callsign: "Rufzeichen",
    priority: "Priorität",
    duration: "Dauer",
    groups: "Gruppen",
    reception: "Empfang",
    last_seen: "Zuletzt gesehen",
    energy_saving: "Energiesparen",
    time: "Zeit",
    activity: "Aktivität",
    direction: "Richtung",
    from: "Von",
    to: "An",
    kind: "Art",
    message: "Nachricht",
    message_position: "Nachricht / Position",
    no_active_calls: "Keine aktiven Gespräche",
    no_registered_devices: "Keine Geräte registriert",
    no_activity: "Noch keine Aktivität",
    no_sds: "Noch keine SDS-Nachrichten",
    multiple_parts: "Mehrteilig",
    status: "Status",
    lip_position: "LIP-Position",
    position_unavailable: "Position nicht von FlowStation bereitgestellt",
    position_unavailable_hint: "FlowStation übermittelt für diese binäre LIP-Nachricht keine Koordinaten.",
    energy_hint: "Energy Economy Group {group}: ungefähr {seconds} s Aufwachintervall",
    card_version: "FlowStation-Karte Version {version}",
  },
  en: {
    yes: "Yes",
    no: "No",
    now: "Now",
    ago_seconds: "{value} s ago",
    ago_minutes: "{value} min ago",
    ago_hours: "{hours} h {minutes} min ago",
    ago_days: "{value} d ago",
    group_call: "Group call",
    individual_call: "Individual call",
    group: "Group",
    online: "Online",
    offline: "Offline",
    sensor_missing: "FlowStation sensor not found",
    tetra_base_station: "TETRA base station",
    dashboard: "Dashboard",
    base_station: "Base station",
    timeslots: "Timeslots",
    active_calls: "Active calls",
    registered_devices: "Registered devices",
    last_heard: "Last heard",
    no_sections: "No sections enabled",
    enable_section: "Enable at least one tab in the card configuration.",
    radio_network_parameters: "Radio and network parameters",
    downlink: "Downlink (TX)",
    uplink: "Uplink (RX)",
    duplex_spacing: "Duplex spacing",
    hangtime: "Hangtime",
    neighbor_cells: "Neighbor cells",
    active: "Active",
    free: "Free",
    idle: "Idle",
    target: "Target",
    speaker: "Speaker",
    control_channel: "Control channel",
    type: "Type",
    source: "Source",
    callsign: "Callsign",
    priority: "Priority",
    duration: "Duration",
    groups: "Groups",
    reception: "Reception",
    last_seen: "Last seen",
    energy_saving: "Energy saving",
    time: "Time",
    activity: "Activity",
    direction: "Direction",
    from: "From",
    to: "To",
    kind: "Type",
    message: "Message",
    message_position: "Message / position",
    no_active_calls: "No active calls",
    no_registered_devices: "No registered devices",
    no_activity: "No activity yet",
    no_sds: "No SDS messages yet",
    multiple_parts: "Multipart",
    status: "Status",
    lip_position: "LIP position",
    position_unavailable: "Position not provided by FlowStation",
    position_unavailable_hint: "FlowStation does not provide coordinates for this binary LIP message.",
    energy_hint: "Energy Economy Group {group}: approximately {seconds} s wake-up interval",
    card_version: "FlowStation Card version {version}",
  },
};

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
      language: "auto",
      max_last_heard: 10,
      max_sds_entries: 20,
      default_tab: "dashboard",
      compact_timeslots: false,
      localized_timestamps: true,
      hide_dashboard: false,
      hide_base_station: false,
      hide_timeslots: false,
      hide_active_calls: false,
      hide_registered_devices: false,
      hide_last_heard: false,
      hide_sds: false,
    };
  }

  static getConfigForm() {
    const editorLanguage = String(
      globalThis.document?.documentElement?.lang ||
      globalThis.navigator?.language ||
      "en",
    ).toLowerCase().startsWith("de")
      ? "de"
      : "en";
    const labelsDe = {
      entity: "FlowStation-Sensor",
      title: "Titel",
      language: "Sprache / Language",
      default_tab: "Standard-Tab",
      compact_timeslots: "Kompakte Timeslot-Kacheln",
      localized_timestamps: "Datumsangaben im Home-Assistant-Format",
      max_last_heard: "Angezeigte „Zuletzt gehört“-Einträge",
      max_sds_entries: "Angezeigte SDS-Einträge",
      hide_dashboard: "Tab „Dashboard“ ausblenden",
      hide_base_station: "Tab „Basisstation“ ausblenden",
      hide_timeslots: "Tab „Timeslots“ ausblenden",
      hide_active_calls: "Tab „Aktive Calls“ ausblenden",
      hide_registered_devices: "Tab „Registrierte Geräte“ ausblenden",
      hide_last_heard: "Tab „Zuletzt gehört“ ausblenden",
      hide_sds: "Tab „SDS“ ausblenden",
    };
    const labelsEn = {
      entity: "FlowStation sensor",
      title: "Title",
      language: "Language / Sprache",
      default_tab: "Default tab",
      compact_timeslots: "Compact Timeslot tiles",
      localized_timestamps: "Dates in Home Assistant format",
      max_last_heard: "Displayed Last heard entries",
      max_sds_entries: "Displayed SDS entries",
      hide_dashboard: "Hide Dashboard tab",
      hide_base_station: "Hide Base station tab",
      hide_timeslots: "Hide Timeslots tab",
      hide_active_calls: "Hide Active calls tab",
      hide_registered_devices: "Hide Registered devices tab",
      hide_last_heard: "Hide Last heard tab",
      hide_sds: "Hide SDS tab",
    };
    const helpersDe = {
      entity: "MQTT-Discovery-Sensor der FlowStation-Bridge.",
      default_tab: "Dieser Tab wird beim ersten Öffnen der Karte angezeigt.",
      compact_timeslots: "Reduziert die Höhe der grafischen Timeslot-Kacheln ungefähr um die Hälfte.",
      localized_timestamps: "Verwendet Sprache und 12-/24-Stundenformat des angemeldeten Home-Assistant-Benutzers.",
      max_last_heard: "Begrenzt die sichtbaren Tabellenzeilen. Der Zähler am Tab zeigt weiterhin die Gesamtanzahl der vorhandenen Einträge.",
      max_sds_entries: "Begrenzt die sichtbaren SDS-Zeilen. Die Bridge behält standardmäßig die letzten 50 Einträge.",
    };
    const helpersEn = {
      entity: "MQTT Discovery sensor provided by the FlowStation bridge.",
      default_tab: "This tab is shown when the card is opened for the first time.",
      compact_timeslots: "Reduces the height of the graphical Timeslot tiles by approximately half.",
      localized_timestamps: "Uses the language and 12-/24-hour format of the signed-in Home Assistant user.",
      max_last_heard: "Limits the visible table rows. The tab badge still shows the total number of entries.",
      max_sds_entries: "Limits visible SDS rows. By default, the bridge retains the latest 50 entries.",
    };
    const labels = editorLanguage === "de" ? labelsDe : labelsEn;
    const helpers = editorLanguage === "de" ? helpersDe : helpersEn;
    const editorText = editorLanguage === "de"
      ? {
          appearance: "Darstellung",
          sections: "Bereiche",
          baseStation: "Basisstation",
          activeCalls: "Aktive Calls",
          registeredDevices: "Registrierte Geräte",
          lastHeard: "Zuletzt gehört",
        }
      : {
          appearance: "Appearance",
          sections: "Sections",
          baseStation: "Base station",
          activeCalls: "Active calls",
          registeredDevices: "Registered devices",
          lastHeard: "Last heard",
        };

    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: {
            entity: {
              filter: {
                domain: "sensor",
              },
            },
          },
        },
        {
          type: "expandable",
          name: "",
          title: editorText.appearance,
          flatten: true,
          schema: [
            {
              name: "title",
              selector: {
                text: {},
              },
            },
            {
              name: "language",
              selector: {
                select: {
                  mode: "dropdown",
                  options: [
                    { value: "auto", label: "Auto" },
                    { value: "de", label: "Deutsch" },
                    { value: "en", label: "English" },
                  ],
                },
              },
            },
            {
              name: "compact_timeslots",
              selector: {
                boolean: {},
              },
            },
            {
              name: "localized_timestamps",
              selector: {
                boolean: {},
              },
            },
            {
              name: "max_last_heard",
              selector: {
                number: {
                  min: 1,
                  max: 50,
                  step: 1,
                  mode: "box",
                },
              },
            },
            {
              name: "max_sds_entries",
              selector: {
                number: {
                  min: 1,
                  max: 100,
                  step: 1,
                  mode: "box",
                },
              },
            },
          ],
        },
        {
          type: "expandable",
          name: "",
          title: editorText.sections,
          flatten: true,
          schema: [
            {
              name: "default_tab",
              selector: {
                select: {
                  mode: "dropdown",
                  options: [
                    { value: "dashboard", label: "Dashboard" },
                    { value: "base_station", label: editorText.baseStation },
                    { value: "timeslots", label: "Timeslots" },
                    { value: "active_calls", label: editorText.activeCalls },
                    {
                      value: "registered_devices",
                      label: editorText.registeredDevices,
                    },
                    { value: "last_heard", label: editorText.lastHeard },
                    { value: "sds", label: "SDS" },
                  ],
                },
              },
            },
            {
              name: "hide_dashboard",
              selector: {
                boolean: {},
              },
            },
            {
              name: "hide_base_station",
              selector: {
                boolean: {},
              },
            },
            {
              name: "hide_timeslots",
              selector: {
                boolean: {},
              },
            },
            {
              name: "hide_active_calls",
              selector: {
                boolean: {},
              },
            },
            {
              name: "hide_registered_devices",
              selector: {
                boolean: {},
              },
            },
            {
              name: "hide_last_heard",
              selector: {
                boolean: {},
              },
            },
            {
              name: "hide_sds",
              selector: {
                boolean: {},
              },
            },
          ],
        },
      ],
      computeLabel: (schema) => labels[schema.name],
      computeHelper: (schema) => helpers[schema.name],
      assertConfig: (config) => {
        if (
          config.language !== undefined &&
          !["auto", "de", "en"].includes(config.language)
        ) {
          throw new Error("Ungültige Sprache / Invalid language.");
        }
        if (
          config.default_tab !== undefined &&
          ![
            "dashboard",
            "base_station",
            "timeslots",
            "active_calls",
            "registered_devices",
            "last_heard",
            "sds",
          ].includes(config.default_tab)
        ) {
          throw new Error("Ungültiger Standard-Tab.");
        }
      },
    };
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Eine Kartenkonfiguration wird benötigt.");
    }

    this._config = {
      entity: "sensor.flowstation_flowstation",
      title: "FlowStation",
      language: "auto",
      max_last_heard: 10,
      max_sds_entries: 20,
      default_tab: "dashboard",
      compact_timeslots: false,
      localized_timestamps: true,
      hide_dashboard: false,
      hide_base_station: false,
      hide_timeslots: false,
      hide_active_calls: false,
      hide_registered_devices: false,
      hide_last_heard: false,
      hide_sds: false,
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

      this._render();
    }
  }

  connectedCallback() {
    if (!this._timer) {
      this._timer = window.setInterval(() => {
        this._updateDurations();
        this._updateLastSeen();
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

  _language() {
    if (["de", "en"].includes(this._config.language)) {
      return this._config.language;
    }

    const language =
      this._hass?.locale?.language ||
      globalThis.navigator?.language ||
      "en";
    return String(language).toLowerCase().startsWith("de")
      ? "de"
      : "en";
  }

  _t(key, values = {}) {
    const language = this._language();
    let text =
      TRANSLATIONS[language]?.[key] ??
      TRANSLATIONS.en[key] ??
      key;

    Object.entries(values).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });

    return text;
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

  _dateTime(value) {
    if (!value || !this._config.localized_timestamps) {
      return this._value(value);
    }

    const match = String(value).match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/,
    );
    if (!match) return this._value(value);

    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6]),
    );
    if (Number.isNaN(date.getTime())) return this._value(value);

    const locale =
      this._hass?.locale?.language ||
      globalThis.navigator?.language ||
      "de-DE";
    const timeFormat = this._hass?.locale?.time_format;
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };

    if (["12", "am_pm"].includes(timeFormat)) {
      options.hour12 = true;
    }
    if (["24", "twenty_four"].includes(timeFormat)) {
      options.hour12 = false;
    }

    try {
      return this._escape(
        new Intl.DateTimeFormat(locale, options).format(date),
      );
    } catch {
      return this._value(value);
    }
  }

  _bool(value) {
    if (value === null || value === undefined) return "–";
    return this._t(value ? "yes" : "no");
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

  _lastSeenLabel(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    if (value < 5) return this._t("now");
    if (value < 60) {
      return this._t("ago_seconds", { value: Math.floor(value) });
    }
    if (value < 3600) {
      return this._t("ago_minutes", {
        value: Math.floor(value / 60),
      });
    }
    if (value < 86400) {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      return this._t("ago_hours", { hours, minutes });
    }
    return this._t("ago_days", {
      value: Math.floor(value / 86400),
    });
  }

  _lastSeen(device) {
    const hasTimestamp =
      device.last_seen_at !== null &&
      device.last_seen_at !== undefined &&
      device.last_seen_at !== "";
    const timestamp = Number(device.last_seen_at);
    const seconds = hasTimestamp && Number.isFinite(timestamp)
      ? Math.floor(Date.now() / 1000) - timestamp
      : Number(device.last_seen_secs_ago || 0);
    return this._lastSeenLabel(seconds);
  }

  _updateLastSeen() {
    const now = Math.floor(Date.now() / 1000);
    this.shadowRoot
      ?.querySelectorAll("[data-last-seen-at]")
      .forEach((element) => {
        const rawTimestamp = element.dataset.lastSeenAt;
        const timestamp = Number(rawTimestamp);
        const fallback = Number(element.dataset.lastSeenFallback || 0);
        const seconds = rawTimestamp !== "" && Number.isFinite(timestamp)
          ? now - timestamp
          : fallback;
        element.textContent = this._lastSeenLabel(seconds);
      });
  }

  _rssiMeter(value) {
    const rssi = Number(value);
    if (!Number.isFinite(rssi)) {
      return `<span class="muted">–</span>`;
    }

    const ratio = Math.max(0, Math.min(1, (rssi + 60) / 50));
    const activeBars = Math.max(1, Math.round(ratio * 5));
    const quality =
      rssi > -20 ? "strong" :
      rssi > -30 ? "good" :
      rssi > -40 ? "medium" : "weak";
    const bars = [1, 2, 3, 4, 5]
      .map(
        (bar) =>
          `<i class="${bar <= activeBars ? "filled" : ""}"></i>`,
      )
      .join("");

    return `
      <div class="rssi-meter ${quality}" title="${this._number(rssi, 1, " dBFS")}">
        <span class="rssi-bars">${bars}</span>
        <span>${this._number(rssi, 1, " dBFS")}</span>
      </div>
    `;
  }

  _groupChips(device) {
    const groups = Array.isArray(device.groups) ? device.groups : [];
    if (!groups.length) return `<span class="muted">–</span>`;

    return `
      <div class="group-chips">
        ${groups
          .map(
            (group) => `
              <span class="group-chip ${group === device.selected_group ? "selected" : ""}">
                ${this._escape(group)}
              </span>
            `,
          )
          .join("")}
      </div>
    `;
  }

  _energySaving(mode) {
    const value = Number(mode);
    if (!Number.isFinite(value) || value <= 0) {
      return `<span class="muted">–</span>`;
    }

    const normalized = Math.max(1, Math.min(7, Math.round(value)));
    const quality =
      normalized <= 2 ? "low" :
      normalized <= 4 ? "medium" :
      normalized === 5 ? "high" : "very-high";

    return `
      <span
      class="energy-pill ${quality}"
        title="${this._escape(this._t("energy_hint", {
          group: normalized,
          seconds: normalized,
        }))}"
      >
        <ha-icon icon="mdi:battery-clock-outline"></ha-icon>
        EG${normalized}
        <small>~${normalized} s</small>
      </span>
    `;
  }

  _activity(value) {
    const labels = {
      call_group: this._t("group_call"),
      call_individual: this._t("individual_call"),
      sds: "SDS",
    };
    return labels[value] || value || "–";
  }

  _callType(value) {
    const labels = {
      group: this._t("group"),
      individual: this._t("individual_call"),
    };
    return labels[value] || value || "–";
  }

  _statusTile(label, icon, online) {
    const stateClass = online ? "online" : "offline";
    const stateText = this._t(online ? "online" : "offline");

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
              <strong>${this._t("sensor_missing")}</strong>
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
    const sdsLog = Array.isArray(attributes.sds_log)
      ? attributes.sds_log
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
    const maxSdsEntries = Math.max(
      1,
      Number(this._config.max_sds_entries) || 20,
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
                ${this._t("tetra_base_station")}
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
            sdsLog,
            maxSdsEntries,
          )}
          <div class="card-version" aria-label="${this._escape(this._t("card_version", { version: CARD_VERSION }))}">
            FlowStation Card v${CARD_VERSION}
          </div>
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

  _tabVisible(name) {
    return this._config[`hide_${name}`] !== true;
  }

  _tabbedContent(
    attributes,
    slots,
    calls,
    devices,
    lastHeard,
    maxLastHeard,
    sdsLog,
    maxSdsEntries,
  ) {
    const availableTabs = [
      ...(this._tabVisible("dashboard")
        ? [{
            id: "dashboard",
            label: this._t("dashboard"),
            icon: "mdi:view-dashboard-outline",
            count: null,
          }]
        : []),
      ...(this._tabVisible("base_station")
        ? [{
            id: "base_station",
            label: this._t("base_station"),
            icon: "mdi:radio-tower",
            count: null,
          }]
        : []),
      ...(this._tabVisible("timeslots")
        ? [{
            id: "timeslots",
            label: this._t("timeslots"),
            icon: "mdi:view-grid-outline",
            count: null,
          }]
        : []),
      ...(this._tabVisible("active_calls")
        ? [{
            id: "active_calls",
            label: this._t("active_calls"),
            icon: "mdi:phone-in-talk-outline",
            count: calls.length,
          }]
        : []),
      ...(this._tabVisible("registered_devices")
        ? [{
            id: "registered_devices",
            label: this._t("registered_devices"),
            icon: "mdi:radio-handheld",
            count: devices.length,
          }]
        : []),
      ...(this._tabVisible("last_heard")
        ? [{
            id: "last_heard",
            label: this._t("last_heard"),
            icon: "mdi:history",
            count: lastHeard.length,
          }]
        : []),
      ...(this._tabVisible("sds")
        ? [{
            id: "sds",
            label: "SDS",
            icon: "mdi:message-text-outline",
            count: sdsLog.length,
          }]
        : []),
    ];

    if (!availableTabs.length) {
      return `
        <section class="panel no-tabs">
          <ha-icon icon="mdi:tab-remove"></ha-icon>
          <div>
            <strong>${this._t("no_sections")}</strong>
            <span>${this._t("enable_section")}</span>
          </div>
        </section>
      `;
    }

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
      sds: () => this._sdsLog(sdsLog.slice(0, maxSdsEntries), true),
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
            <h2>${this._t("base_station")}</h2>
            <span>${this._t("radio_network_parameters")}</span>
          </div>
        </div>
        <div class="metrics">
          ${this._metric(this._t("downlink"), this._frequency(attributes.tx_freq_hz), "mdi:arrow-down-bold")}
          ${this._metric(this._t("uplink"), this._frequency(attributes.rx_freq_hz), "mdi:arrow-up-bold")}
          ${this._metric(this._t("duplex_spacing"), this._frequency(attributes.shift_hz), "mdi:swap-vertical-bold")}
          ${this._metric("Carrier", this._value(attributes.main_carrier), "mdi:sine-wave")}
          ${this._metric("MCC / MNC", `${this._value(attributes.mcc)} / ${this._value(attributes.mnc)}`, "mdi:identifier")}
          ${this._metric(this._t("hangtime"), this._number(attributes.hangtime_secs, 0, " s"), "mdi:timer-outline")}
          ${this._metric(this._t("neighbor_cells"), this._value(attributes.neighbor_count, "0"), "mdi:access-point-network")}
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
              <h3>${this._t("active_calls")}</h3>
              <span class="live-badge"><span></span>${calls.length} ${this._t("active").toLowerCase()}</span>
            </div>
            ${this._activeCalls(calls, true)}
          </section>
        ` : ""}

        <section class="dashboard-section">
          <div class="dashboard-section-heading">
            <h3>${this._t("registered_devices")}</h3>
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
      : this._t("free");
    const detail = mcch
      ? (flowstationOnline ? this._t("active") : this._t("offline"))
      : active
      ? `${this._t("target")} ${this._value(slot.destination)}`
      : this._t("idle");
    const state = mcch
      ? (flowstationOnline ? "CONTROL" : "OFFLINE")
      : active
        ? "ACTIVE"
        : this._t("idle").toUpperCase();

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
            <span>${this._t("speaker")} ${this._value(slot.speaker_callsign || slot.speaker)}</span>
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
                ${mcch ? "MCCH" : active ? this._t("active") : this._t("free")}
              </span>
            </td>
            <td data-label="${this._t("type")}">${mcch ? this._t("control_channel") : this._callType(slot.type)}</td>
            <td data-label="${this._t("source")}">${this._value(slot.source)}</td>
            <td data-label="${this._t("callsign")}">${this._value(slot.source_callsign)}</td>
            <td data-label="${this._t("target")}">${this._value(slot.destination)}</td>
            <td data-label="${this._t("speaker")}">${this._value(slot.speaker_callsign || slot.speaker)}</td>
            <td data-label="${this._t("priority")}">${this._value(slot.priority)}</td>
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
                <th>Slot</th><th>${this._t("status")}</th><th>${this._t("type")}</th><th>${this._t("source")} (ISSI)</th>
                <th>${this._t("callsign")}</th><th>${this._t("target")} (ISSI / GSSI)</th><th>${this._t("speaker")}</th>
                <th>${this._t("priority")}</th><th>Simplex</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
      </div>
    `;

    return embedded
      ? table
      : `<section class="panel table-panel"><h2>${this._t("timeslots")}</h2>${table}</section>`;
  }

  _activeCalls(calls, embedded = false) {
    const rows = calls.length
      ? calls
          .map(
            (call) => `
              <tr>
                <td data-label="ID">${this._value(call.call_id)}</td>
                <td data-label="${this._t("type")}">${this._callType(call.type)}</td>
                <td data-label="Slot">${this._value(call.slot)}</td>
                <td data-label="${this._t("source")}">${this._value(call.source)}</td>
                <td data-label="${this._t("callsign")}">${this._value(call.source_callsign)}</td>
                <td data-label="${this._t("target")}">${this._value(call.destination)}</td>
                <td data-label="${this._t("speaker")}">${this._value(call.speaker_callsign || call.speaker)}</td>
                <td
                  data-label="${this._t("duration")}"
                  data-call-duration
                  data-started="${Number(call.started_secs_ago || 0)}"
                >${this._duration(call)}</td>
                <td data-label="${this._t("priority")}">${this._value(call.priority)}</td>
                <td data-label="Simplex">${this._bool(call.simplex)}</td>
                <td data-label="Carrier">${this._value(call.carrier)}</td>
              </tr>
            `,
          )
          .join("")
      : this._emptyRow(11, this._t("no_active_calls"));

    const table = `
      <div class="table-scroll">
          <table>
            <thead><tr>
              <th>ID</th><th>${this._t("type")}</th><th>Slot</th><th>${this._t("source")} (ISSI)</th>
              <th>${this._t("callsign")}</th><th>${this._t("target")} (ISSI / GSSI)</th><th>${this._t("speaker")}</th>
              <th>${this._t("duration")}</th><th>${this._t("priority")}</th><th>Simplex</th><th>Carrier</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
      </div>
    `;

    return embedded
      ? table
      : `<section class="panel table-panel"><h2>${this._t("active_calls")}</h2>${table}</section>`;
  }

  _registeredDevices(devices, embedded = false) {
    const rows = devices.length
      ? devices
          .map(
            (device) => `
              <tr>
                <td data-label="ISSI">${this._value(device.issi)}</td>
                <td data-label="${this._t("callsign")}">
                  <span class="callsign">
                    ${device.country_flag ? `<span class="country-flag">${this._escape(device.country_flag)}</span>` : ""}
                    <strong>${this._value(device.callsign)}</strong>
                  </span>
                </td>
                <td data-label="${this._t("groups")}">${this._groupChips(device)}</td>
                <td data-label="${this._t("reception")}">${this._rssiMeter(device.rssi_dbfs)}</td>
                <td
                  data-label="${this._t("last_seen")}"
                  data-last-seen-at="${this._value(device.last_seen_at, "")}"
                  data-last-seen-fallback="${this._value(device.last_seen_secs_ago, "0")}"
                >${this._lastSeen(device)}</td>
                <td data-label="${this._t("energy_saving")}">${this._energySaving(device.energy_saving_mode)}</td>
              </tr>
            `,
          )
          .join("")
      : this._emptyRow(6, this._t("no_registered_devices"));

    const table = `
      <div class="table-scroll">
          <table>
            <thead><tr>
              <th>ISSI</th><th>${this._t("callsign")}</th><th>${this._t("groups")}</th>
              <th>${this._t("reception")}</th><th>${this._t("last_seen")}</th><th>${this._t("energy_saving")}</th>
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
            <h2>${this._t("registered_devices")}</h2>
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
                <td data-label="${this._t("time")}">${this._value(entry.time)}</td>
                <td data-label="ISSI">${this._value(entry.issi)}</td>
                <td data-label="${this._t("callsign")}">
                  <span class="callsign">
                    ${entry.country_flag ? `<span class="country-flag">${this._escape(entry.country_flag)}</span>` : ""}
                    <strong>${this._value(entry.callsign)}</strong>
                  </span>
                </td>
                <td data-label="${this._t("activity")}">
                  <span class="activity-pill ${this._escape(entry.activity || "")}">
                    ${this._escape(this._activity(entry.activity))}
                  </span>
                </td>
                <td data-label="${this._t("target")}">
                  <span class="target-chip ${entry.activity === "call_group" ? "group" : ""}">
                    ${this._value(entry.destination)}
                  </span>
                </td>
              </tr>
            `,
          )
          .join("")
      : this._emptyRow(5, this._t("no_activity"));

    const table = `
      <div class="table-scroll">
          <table>
            <thead><tr>
              <th>${this._t("time")}</th><th>ISSI</th><th>${this._t("callsign")}</th>
              <th>${this._t("activity")}</th><th>${this._t("target")}</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
      </div>
    `;

    return embedded
      ? table
      : `<section class="panel table-panel"><h2>${this._t("last_heard")}</h2>${table}</section>`;
  }

  _sdsDirection(direction) {
    const labels = {
      rx: "RX",
      net: "NET",
      tx: "TX",
    };
    return labels[direction] || String(direction || "?").toUpperCase();
  }

  _sdsProtocol(protocolId) {
    const labels = {
      2: "Text",
      9: "Text",
      10: this._t("lip_position"),
      12: this._t("multiple_parts"),
      128: "Text",
      130: "Text",
      137: "Text",
      218: this._t("status"),
      220: "Home Display",
    };
    return labels[Number(protocolId)] || `PID ${protocolId ?? "?"}`;
  }

  _sdsIdentity(entry, prefix) {
    const issi = prefix === "destination"
      ? entry.dest_issi
      : entry[`${prefix}_issi`];
    const callsign = entry[`${prefix}_callsign`];
    const flag = entry[`${prefix}_country_flag`];

    return `
      <div class="sds-identity">
        <strong>${this._value(issi)}</strong>
        ${callsign ? `
          <span class="callsign">
            ${flag ? `<span class="country-flag">${this._escape(flag)}</span>` : ""}
            ${this._escape(callsign)}
          </span>
        ` : ""}
      </div>
    `;
  }

  _sdsMessage(entry) {
    const text = String(entry.text || "");
    const lip = text.match(
      /^LIP position:\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    );

    if (lip) {
      const latitude = Number(lip[1]);
      const longitude = Number(lip[2]);

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        const mapUrl =
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;
        return `
          <a class="lip-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer">
            <ha-icon icon="mdi:map-marker"></ha-icon>
            <span>${this._escape(coordinates)}</span>
          </a>
        `;
      }
    }

    if (text) {
      return `<span class="sds-text">${this._escape(text)}</span>`;
    }

    if (Number(entry.protocol_id) === 10) {
      return `
        <span class="lip-undecoded" title="${this._escape(this._t("position_unavailable_hint"))}">
          <ha-icon icon="mdi:map-marker-question-outline"></ha-icon>
          ${this._t("position_unavailable")}
        </span>
      `;
    }

    return `<span class="muted">[${this._escape(this._sdsProtocol(entry.protocol_id))}]</span>`;
  }

  _sdsLog(entries, embedded = false) {
    const rows = entries.length
      ? entries
          .map(
            (entry) => `
              <tr>
                <td data-label="${this._t("time")}" class="sds-time">${this._dateTime(entry.time)}</td>
                <td data-label="${this._t("direction")}">
                  <span class="direction-pill ${this._escape(entry.direction || "")}">
                    ${this._escape(this._sdsDirection(entry.direction))}
                  </span>
                </td>
                <td data-label="${this._t("from")}">${this._sdsIdentity(entry, "source")}</td>
                <td data-label="${this._t("kind")}">
                  <span class="protocol-chip ${Number(entry.protocol_id) === 10 ? "lip" : ""}">
                    ${this._escape(this._sdsProtocol(entry.protocol_id))}
                  </span>
                </td>
                <td data-label="${this._t("to")}">
                  ${entry.is_group
                    ? `<span class="target-chip group">${this._value(entry.dest_issi)}</span>`
                    : this._sdsIdentity(entry, "destination")}
                </td>
                <td data-label="${this._t("message")}" class="sds-message">${this._sdsMessage(entry)}</td>
              </tr>
            `,
          )
          .join("")
      : this._emptyRow(6, this._t("no_sds"));

    const table = `
      <div class="table-scroll">
        <table class="sds-table">
          <thead><tr>
            <th>${this._t("time")}</th><th>${this._t("direction")}</th><th>${this._t("from")}</th>
            <th>${this._t("kind")}</th><th>${this._t("to")}</th><th>${this._t("message_position")}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    return embedded
      ? table
      : `<section class="panel table-panel"><h2>SDS</h2>${table}</section>`;
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

        .card-version {
          color: var(--secondary-text-color);
          font-family: var(--code-font-family, monospace);
          font-size: .68rem;
          line-height: 1;
          opacity: .58;
          text-align: right;
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

        .target-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 9px;
          border: 1px solid var(--fs-border);
          border-radius: 999px;
          color: var(--secondary-text-color);
          background: rgba(255,255,255,.04);
          font-family: var(--code-font-family, monospace);
          font-size: .74rem;
          font-weight: 700;
        }

        .target-chip.group {
          border-color: rgba(66,165,245,.22);
          color: #64b5f6;
          background: rgba(66,165,245,.1);
        }

        .country-flag {
          font-family:
            "Apple Color Emoji",
            "Segoe UI Emoji",
            "Noto Color Emoji",
            sans-serif;
          font-size: 1.45rem;
          line-height: 1;
        }

        .callsign {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .sds-time {
          white-space: nowrap;
          font-family: var(--code-font-family, monospace);
          font-variant-numeric: tabular-nums;
        }

        .sds-identity {
          display: grid;
          justify-items: center;
          gap: 4px;
          font-family: var(--code-font-family, monospace);
        }

        .sds-identity .callsign {
          color: var(--secondary-text-color);
          font-family: inherit;
          font-size: .72rem;
        }

        .sds-identity .country-flag {
          font-size: 1rem;
        }

        .direction-pill,
        .protocol-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 9px;
          border-radius: 999px;
          font-size: .72rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .direction-pill {
          color: var(--secondary-text-color);
          background: rgba(255,255,255,.06);
        }

        .direction-pill.rx {
          color: var(--fs-green);
          background: var(--fs-green-soft);
        }

        .direction-pill.net {
          color: #64b5f6;
          background: rgba(66,165,245,.11);
        }

        .direction-pill.tx {
          color: #ffb74d;
          background: rgba(255,183,77,.11);
        }

        .protocol-chip {
          color: #b388ff;
          background: rgba(179,136,255,.12);
        }

        .protocol-chip.lip {
          color: #64b5f6;
          background: rgba(66,165,245,.12);
        }

        .sds-message {
          min-width: 210px;
          text-align: left;
          white-space: normal;
        }

        .sds-text {
          word-break: break-word;
        }

        .lip-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #64b5f6;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }

        .lip-link:hover { text-decoration: underline; }
        .lip-link ha-icon {
          width: 18px;
          height: 18px;
        }

        .lip-undecoded {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--secondary-text-color);
          white-space: nowrap;
        }

        .lip-undecoded ha-icon {
          width: 18px;
          height: 18px;
          color: #ffb74d;
        }

        .group-chips {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 5px;
          min-width: 120px;
        }

        .group-chip {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 3px 7px;
          border: 1px solid var(--fs-border);
          border-radius: 999px;
          border-color: rgba(66,165,245,.2);
          color: #64b5f6;
          background: rgba(66,165,245,.09);
          font-family: var(--code-font-family, monospace);
          font-size: .72rem;
        }

        .group-chip.selected {
          border-color: rgba(57,209,38,.24);
          color: var(--fs-green);
          background: var(--fs-green-soft);
          font-weight: 700;
        }

        .rssi-meter {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--code-font-family, monospace);
          font-size: .72rem;
        }

        .rssi-bars {
          display: inline-flex;
          align-items: end;
          gap: 2px;
          height: 19px;
        }

        .rssi-bars i {
          display: block;
          width: 4px;
          border-radius: 2px 2px 0 0;
          background: rgba(130,155,185,.15);
        }

        .rssi-bars i:nth-child(1) { height: 5px; }
        .rssi-bars i:nth-child(2) { height: 8px; }
        .rssi-bars i:nth-child(3) { height: 11px; }
        .rssi-bars i:nth-child(4) { height: 15px; }
        .rssi-bars i:nth-child(5) { height: 19px; }

        .rssi-meter.strong .rssi-bars i.filled,
        .rssi-meter.good .rssi-bars i.filled {
          background: var(--fs-green);
          box-shadow: 0 0 5px rgba(57,209,38,.3);
        }

        .rssi-meter.medium .rssi-bars i.filled {
          background: #ffb74d;
        }

        .rssi-meter.weak .rssi-bars i.filled {
          background: var(--fs-red);
        }

        .energy-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: .72rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .energy-pill ha-icon { --mdc-icon-size: 14px; }

        .energy-pill small {
          font-size: .65rem;
          font-weight: 500;
          opacity: .75;
        }

        .energy-pill.low {
          color: var(--fs-green);
          background: var(--fs-green-soft);
        }

        .energy-pill.medium {
          color: #55b8ff;
          background: rgba(85,184,255,.12);
        }

        .energy-pill.high {
          color: #ffb74d;
          background: rgba(255,183,77,.12);
        }

        .energy-pill.very-high {
          color: var(--fs-red);
          background: rgba(239,83,80,.12);
        }

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

        .no-tabs {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          min-height: 120px;
          color: var(--secondary-text-color);
          text-align: left;
        }

        .no-tabs ha-icon { --mdc-icon-size: 30px; }

        .no-tabs div {
          display: grid;
          gap: 4px;
        }

        .no-tabs strong { color: var(--primary-text-color); }
        .no-tabs span { font-size: .85rem; }

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
