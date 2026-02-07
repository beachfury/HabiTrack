# @habitrack/net — local request classifier

- CIDR matching via ipaddr.js
- Trusted proxy aware (honor X-Forwarded-For only if the peer is trusted)
- `makeLocalClassifier({ trustedProxies, localCidrs })` → `classify(req)` returns `{ clientIp, isLocal, source }`
