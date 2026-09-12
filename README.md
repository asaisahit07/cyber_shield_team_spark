# Cyber Shield

Single-page, dependency-free frontend assembled from the supplied Stitch screen system. Run it with any static server:

```bash
cd outputs/cyber-shield-app
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

`app.js` separates the mock `analysisService`, `reportService`, and `historyService` from rendering. Replace those async methods with `fetch()` calls to a FastAPI API when ready; the returned analysis shape is documented in the mock service.
