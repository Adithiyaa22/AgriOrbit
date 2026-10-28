"use client";

import { Droplets, Leaf, MapPinned, Sprout, Sun } from "lucide-react";

export default function AgriAmbient() {
  return (
    <div className="agri-global-motion" aria-hidden="true">
      <div className="agri-global-glow agri-glow-one" />
      <div className="agri-global-glow agri-glow-two" />
      <div className="agri-global-glow agri-glow-three" />

      <div className="agri-global-orbit agri-global-orbit-one" />
      <div className="agri-global-orbit agri-global-orbit-two" />

      <div className="agri-floating-symbol agri-symbol-leaf"><Leaf /></div>
      <div className="agri-floating-symbol agri-symbol-drop"><Droplets /></div>
      <div className="agri-floating-symbol agri-symbol-map"><MapPinned /></div>
      <div className="agri-floating-symbol agri-symbol-sprout"><Sprout /></div>
      <div className="agri-floating-symbol agri-symbol-sun"><Sun /></div>

      <div className="agri-field-grid">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="agri-global-particle agri-particle-one" />
      <div className="agri-global-particle agri-particle-two" />
      <div className="agri-global-particle agri-particle-three" />
      <div className="agri-global-particle agri-particle-four" />
      <div className="agri-global-particle agri-particle-five" />
      <div className="agri-global-particle agri-particle-six" />
    </div>
  );
}
