# Ghar-Sanket (घर-संकेत)

Ambient ISL sign-communication system for elderly deaf individuals living alone.
See `CLAUDE.md` for full build context and `Ghar-Sanket-PRD.md` for the product spec.

## Structure

- `mirror/` — grandparent-facing camera UI (React + Vite + Tailwind)
- `dashboard/` — family-facing alerts UI (React + Vite + Tailwind)
- `server/` — WebSocket relay, no persistence (Node + socket.io)
- `ml/` — landmark extraction + ISL sign classifier training

## Dev

```
cd mirror && npm run dev      # :5173
cd dashboard && npm run dev   # :5174
cd server && npm run dev      # :4000
```

## Branches

Everyone works on their own feature branch off `main`:
- `feature/neerav-chaining-server`
- `feature/shelly-ml`
- `feature/kaavya-frontend`
- `feature/pulkit-frontend`
