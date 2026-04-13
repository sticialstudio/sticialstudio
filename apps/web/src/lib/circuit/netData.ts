import type { NetData } from '@/contexts/CircuitContext';

export function getNetFromNodeId(net: NetData) {
  return net.fromNodeId ?? net.from;
}

export function getNetToNodeId(net: NetData) {
  return net.toNodeId ?? net.to;
}

export function getNetFromAnchorId(net: NetData) {
  return net.fromAnchorId ?? net.from;
}

export function getNetToAnchorId(net: NetData) {
  return net.toAnchorId ?? net.to;
}
