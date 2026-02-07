import * as ipaddr from 'ipaddr.js';

export interface NetConfig {
  trustedProxies: string[]; // CIDR or IP
  localCidrs: string[]; // CIDR or IP
}

export interface Classification {
  clientIp: string | null;
  source: 'socket' | 'x-forwarded-for' | 'unknown';
  isLocal: boolean;
}

function parseCidr(input: string) {
  const s = input.trim();
  if (!s) return null;
  try {
    if (s.includes('/')) {
      const [ipStr, maskStr] = s.split('/');
      const addr = ipaddr.parse(ipStr);
      const prefix = parseInt(maskStr, 10);
      return [addr, prefix] as const;
    }
    const addr = ipaddr.parse(s);
    const prefix = addr.kind() === 'ipv4' ? 32 : 128;
    return [addr, prefix] as const;
  } catch {
    return null;
  }
}

function normalize(ip: string) {
  try {
    let addr = ipaddr.parse(ip);
    if (addr.kind() === 'ipv6' && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
      addr = (addr as ipaddr.IPv6).toIPv4Address();
    }
    return addr;
  } catch {
    return null;
  }
}

function matchPrefix(
  addr: ipaddr.IPv4 | ipaddr.IPv6,
  net: ipaddr.IPv4 | ipaddr.IPv6,
  prefix: number,
): boolean {
  // compare addr/net byte arrays up to prefix bits
  const a = addr.toByteArray();
  const b = net.toByteArray();
  if (a.length !== b.length) return false;
  let bits = prefix;
  let i = 0;

  // full bytes
  while (bits >= 8) {
    if (a[i] !== b[i]) return false;
    i++;
    bits -= 8;
  }

  // partial byte
  if (bits > 0) {
    const mask = (0xff << (8 - bits)) & 0xff;
    if ((a[i] & mask) !== (b[i] & mask)) return false;
  }
  return true;
}

function ipInCidrs(ip: string, cidrs: string[]) {
  let addr0 = normalize(ip);
  if (!addr0) return false;

  // demap helper: ::ffff:x.y.z.w -> IPv4
  const demap = (x: ipaddr.IPv4 | ipaddr.IPv6) =>
    x.kind() === 'ipv6' && (x as ipaddr.IPv6).isIPv4MappedAddress()
      ? (x as ipaddr.IPv6).toIPv4Address()
      : x;

  const addr = demap(addr0);

  for (const c of cidrs) {
    const parsed = parseCidr(c);
    if (!parsed) continue;
    let [net, prefix] = parsed;
    net = demap(net); // ← normalize net too
    if (addr.kind() !== net.kind()) continue; // now families align
    if (addr.match([net, prefix])) return true;
  }
  return false;
}

function stripBrackets(ip: string) {
  return ip.replace(/^[\[]|[\]]$/g, '');
}

function getClientIpFromHeaders(socketIp?: string, xff?: string, trustedProxies: string[] = []) {
  const peer = socketIp || '';
  if (!peer) return { ip: null, source: 'unknown' as const };

  if (!ipInCidrs(peer, trustedProxies)) {
    return { ip: stripBrackets(peer), source: 'socket' as const };
  }
  const list = (xff || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length) return { ip: stripBrackets(peer), source: 'socket' as const };
  return { ip: stripBrackets(list[0]), source: 'x-forwarded-for' as const };
}

export function makeLocalClassifier(cfg: NetConfig) {
  const trusted = cfg.trustedProxies || [];
  const locals =
    cfg.localCidrs && cfg.localCidrs.length
      ? cfg.localCidrs
      : ['127.0.0.1/32', '::1/128', '10.0.0.0/8', '192.168.0.0/16'];

  return function classify(req: {
    headers: Record<string, unknown>;
    socket?: { remoteAddress?: string };
  }): Classification {
    const xff = req.headers['x-forwarded-for'] as string | undefined;
    const socketIp = req.socket?.remoteAddress || undefined;
    const derived = getClientIpFromHeaders(socketIp, xff, trusted);
    const clientIp = derived.ip;
    const isLocal = clientIp ? ipInCidrs(clientIp, locals) : false;
    return { clientIp, source: derived.source, isLocal };
  };
}

export const _internals = { parseCidr, normalize, ipInCidrs, getClientIpFromHeaders };
