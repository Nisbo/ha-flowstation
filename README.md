# FlowStation Card

Eine responsive Custom Card für die Darstellung einer FlowStation in Home Assistant.

Die Karte besitzt einen integrierten visuellen Konfigurationseditor auf Basis
von Home Assistants `getConfigForm`-API. Sie kann daher direkt über die
Dashboard-Oberfläche konfiguriert werden; YAML bleibt weiterhin möglich.

Die Karte zeigt:

- Status von MQTT-Bridge, FlowStation und Brew
- aktive Gespräche
- Frequenzen und Basisstationsdaten
- vier Timeslots
- aktive Calls
- registrierte Funkgeräte
- „Zuletzt gehört“-Historie

## Voraussetzung

Die Karte erwartet den MQTT-Discovery-Sensor der FlowStation-MQTT-Bridge. Die
Standard-Entity ist:

```text
sensor.flowstation_flowstation
```

Eine abweichende Entity-ID kann in der Kartenkonfiguration angegeben werden.

## Manuelle Installation

1. `ha-flowstation.js` nach folgendem Ziel kopieren:

   ```text
   /config/www/ha-flowstation.js
   ```

2. In Home Assistant unter
   `Einstellungen → Dashboards → Ressourcen` eine JavaScript-Modul-Ressource
   hinzufügen:

   ```text
   /local/ha-flowstation.js
   ```

3. Browser-Cache neu laden.

4. Eine manuelle Karte anlegen:

   ```yaml
type: custom:ha-flowstation-card
entity: sensor.flowstation_flowstation
title: FlowStation
max_last_heard: 10
default_tab: dashboard
compact_timeslots: false
   ```

## Optionen

| Option | Standard | Beschreibung |
|---|---|---|
| `entity` | `sensor.flowstation_flowstation` | FlowStation-Sensor |
| `title` | `FlowStation` | Überschrift |
| `max_last_heard` | `10` | Anzahl der angezeigten Einträge |
| `default_tab` | `dashboard` | Beim ersten Laden geöffneter Tab |
| `compact_timeslots` | `false` | Kompakte Dashboard-Timeslots mit etwa halber Höhe |
| `hide_dashboard` | `false` | Tab „Dashboard“ ausblenden |
| `hide_base_station` | `false` | Tab „Basisstation“ ausblenden |
| `hide_timeslots` | `false` | Tab „Timeslots“ ausblenden |
| `hide_active_calls` | `false` | Tab „Aktive Calls“ ausblenden |
| `hide_registered_devices` | `false` | Tab „Registrierte Geräte“ ausblenden |
| `hide_last_heard` | `false` | Tab „Zuletzt gehört“ ausblenden |

## Vollständiges Beispiel

```yaml
type: custom:ha-flowstation-card
entity: sensor.flowstation_flowstation
title: FlowStation
max_last_heard: 15
default_tab: last_heard
compact_timeslots: true
hide_dashboard: false
hide_base_station: false
hide_timeslots: false
hide_active_calls: false
hide_registered_devices: false
hide_last_heard: false
```

Für `default_tab` sind folgende Werte möglich:

```text
timeslots
dashboard
base_station
active_calls
registered_devices
last_heard
```

## Lizenz

MIT – Nisbo
