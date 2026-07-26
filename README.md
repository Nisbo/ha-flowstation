# FlowStation Card

Eine responsive Custom Card für die Darstellung einer FlowStation in Home Assistant.

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
| `show_active_calls` | `true` | Tabelle der aktiven Calls |
| `show_registered_devices` | `true` | Registrierte Geräte anzeigen |
| `show_last_heard` | `true` | „Zuletzt gehört“ anzeigen |

## Vollständiges Beispiel

```yaml
type: custom:ha-flowstation-card
entity: sensor.flowstation_flowstation
title: FlowStation
max_last_heard: 15
default_tab: last_heard
compact_timeslots: true
show_active_calls: true
show_registered_devices: true
show_last_heard: true
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
