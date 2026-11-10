# Homeoffice-Tracker

Kleine interne Webseite, auf der Kolleginnen eintragen, ob sie an den Tagen der
aktuellen Woche im Homeoffice oder In Office sind — pro Tag entweder
ganztags oder aufgeteilt in Vormittag/Nachmittag — sowie eine Übersicht,
die auf einen Blick zeigt, wer wann wo ist.

## Team konfigurieren

Die Namensliste steht in `data/team.json`:

```json
{ "members": [ { "id": "anna-muster", "name": "Anna Muster" } ] }
```

Diese Datei kann jederzeit manuell editiert werden (Namen hinzufügen/entfernen) —
ein Neustart des Containers ist nicht nötig, die Liste wird bei jedem
Aufruf neu von der Platte gelesen. Alternativ kann sich jede Kollegin auch
direkt auf der Eintragen-Seite über "+ Neuen Namen hinzufügen" selbst zur
Liste hinzufügen, falls sie noch nicht existiert.

## Lokal starten (ohne Docker)

```bash
npm install
npm start
```

Danach `http://localhost:3000` öffnen.

## Mit Docker starten

```bash
docker compose up -d --build
```

Danach `http://localhost:3001` öffnen. Die Daten liegen in `./data/` und
bleiben beim Neustart des Containers erhalten (Volume-Mount).

- `data/team.json` — Teamliste
- `data/homeoffice-data.json` — eingetragene Wochendaten (wird automatisch
  angelegt; zum Zurücksetzen einfach löschen)

## Hinweise

- Es gibt keine Anmeldung/Passwort — man wählt sich nur aus der Namensliste
  aus. Die Seite ist für ein kleines, vertrauenswürdiges Team gedacht.
- Es kann nur die **aktuelle** Woche bearbeitet werden; das wird auch
  serverseitig erzwungen.
- Die Daten werden als einfache JSON-Datei gespeichert (kein
  Datenbank-Server nötig).
