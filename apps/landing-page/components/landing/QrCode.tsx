/**
 * QR code estatico decorativo (replica visual do Home.html linhas 769-807).
 * Nao codifica conteudo real - e apenas um adorno visual da carteirinha mock.
 */
export default function QrCode() {
  return (
    <svg viewBox="0 0 21 21" shapeRendering="crispEdges" aria-hidden="true">
      <rect width="21" height="21" fill="#fff" />
      <g fill="#0c1e2a">
        {/* Finder squares (top-left, top-right, bottom-left) */}
        <rect x="0" y="0" width="7" height="7" />
        <rect x="1" y="1" width="5" height="5" fill="#fff" />
        <rect x="2" y="2" width="3" height="3" />
        <rect x="14" y="0" width="7" height="7" />
        <rect x="15" y="1" width="5" height="5" fill="#fff" />
        <rect x="16" y="2" width="3" height="3" />
        <rect x="0" y="14" width="7" height="7" />
        <rect x="1" y="15" width="5" height="5" fill="#fff" />
        <rect x="2" y="16" width="3" height="3" />
        {/* Data modules */}
        <rect x="8" y="0" width="1" height="1" /><rect x="10" y="0" width="1" height="1" /><rect x="12" y="0" width="1" height="1" />
        <rect x="9" y="1" width="1" height="1" /><rect x="11" y="1" width="1" height="1" />
        <rect x="8" y="2" width="1" height="1" /><rect x="10" y="2" width="1" height="1" /><rect x="13" y="2" width="1" height="1" />
        <rect x="9" y="3" width="1" height="1" /><rect x="12" y="3" width="1" height="1" />
        <rect x="8" y="4" width="1" height="1" /><rect x="11" y="4" width="1" height="1" /><rect x="13" y="4" width="1" height="1" />
        <rect x="10" y="5" width="1" height="1" /><rect x="12" y="5" width="1" height="1" />
        <rect x="9" y="6" width="1" height="1" /><rect x="11" y="6" width="1" height="1" /><rect x="13" y="6" width="1" height="1" />
        <rect x="0" y="8" width="1" height="1" /><rect x="2" y="8" width="1" height="1" /><rect x="4" y="8" width="1" height="1" /><rect x="6" y="8" width="1" height="1" /><rect x="8" y="8" width="1" height="1" /><rect x="10" y="8" width="1" height="1" /><rect x="12" y="8" width="1" height="1" /><rect x="15" y="8" width="1" height="1" /><rect x="17" y="8" width="1" height="1" /><rect x="20" y="8" width="1" height="1" />
        <rect x="1" y="9" width="1" height="1" /><rect x="3" y="9" width="1" height="1" /><rect x="7" y="9" width="1" height="1" /><rect x="9" y="9" width="1" height="1" /><rect x="13" y="9" width="1" height="1" /><rect x="14" y="9" width="1" height="1" /><rect x="16" y="9" width="1" height="1" /><rect x="19" y="9" width="1" height="1" />
        <rect x="0" y="10" width="1" height="1" /><rect x="5" y="10" width="1" height="1" /><rect x="8" y="10" width="1" height="1" /><rect x="11" y="10" width="1" height="1" /><rect x="13" y="10" width="1" height="1" /><rect x="15" y="10" width="1" height="1" /><rect x="18" y="10" width="1" height="1" /><rect x="20" y="10" width="1" height="1" />
        <rect x="2" y="11" width="1" height="1" /><rect x="4" y="11" width="1" height="1" /><rect x="6" y="11" width="1" height="1" /><rect x="9" y="11" width="1" height="1" /><rect x="12" y="11" width="1" height="1" /><rect x="14" y="11" width="1" height="1" /><rect x="17" y="11" width="1" height="1" /><rect x="19" y="11" width="1" height="1" />
        <rect x="1" y="12" width="1" height="1" /><rect x="3" y="12" width="1" height="1" /><rect x="7" y="12" width="1" height="1" /><rect x="10" y="12" width="1" height="1" /><rect x="13" y="12" width="1" height="1" /><rect x="16" y="12" width="1" height="1" /><rect x="18" y="12" width="1" height="1" /><rect x="20" y="12" width="1" height="1" />
        <rect x="0" y="13" width="1" height="1" /><rect x="5" y="13" width="1" height="1" /><rect x="8" y="13" width="1" height="1" /><rect x="11" y="13" width="1" height="1" /><rect x="14" y="13" width="1" height="1" /><rect x="17" y="13" width="1" height="1" /><rect x="19" y="13" width="1" height="1" />
        <rect x="8" y="14" width="1" height="1" /><rect x="11" y="14" width="1" height="1" /><rect x="13" y="14" width="1" height="1" /><rect x="15" y="14" width="1" height="1" /><rect x="18" y="14" width="1" height="1" /><rect x="20" y="14" width="1" height="1" />
        <rect x="9" y="15" width="1" height="1" /><rect x="12" y="15" width="1" height="1" /><rect x="14" y="15" width="1" height="1" /><rect x="17" y="15" width="1" height="1" /><rect x="19" y="15" width="1" height="1" />
        <rect x="10" y="16" width="1" height="1" /><rect x="13" y="16" width="1" height="1" /><rect x="15" y="16" width="1" height="1" /><rect x="16" y="16" width="1" height="1" /><rect x="18" y="16" width="1" height="1" /><rect x="20" y="16" width="1" height="1" />
        <rect x="8" y="17" width="1" height="1" /><rect x="11" y="17" width="1" height="1" /><rect x="14" y="17" width="1" height="1" /><rect x="17" y="17" width="1" height="1" /><rect x="19" y="17" width="1" height="1" />
        <rect x="9" y="18" width="1" height="1" /><rect x="12" y="18" width="1" height="1" /><rect x="13" y="18" width="1" height="1" /><rect x="15" y="18" width="1" height="1" /><rect x="18" y="18" width="1" height="1" /><rect x="20" y="18" width="1" height="1" />
        <rect x="10" y="19" width="1" height="1" /><rect x="14" y="19" width="1" height="1" /><rect x="16" y="19" width="1" height="1" /><rect x="17" y="19" width="1" height="1" /><rect x="19" y="19" width="1" height="1" />
        <rect x="8" y="20" width="1" height="1" /><rect x="11" y="20" width="1" height="1" /><rect x="13" y="20" width="1" height="1" /><rect x="15" y="20" width="1" height="1" /><rect x="18" y="20" width="1" height="1" /><rect x="20" y="20" width="1" height="1" />
      </g>
    </svg>
  );
}
