import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function BrandCanvasEditor() {
  return (
    <Tldraw licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY} />
  );
}
