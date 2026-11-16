# Data layer rules
- Live CSV case import parses client-side (src/lib/alertsCsv.ts) but saves only through the import_alerts_csv RPC, which re-validates, scopes to the caller's institution and writes its audit entry in one transaction, so partial imports or unaudited imports cannot happen.
