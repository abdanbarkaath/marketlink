"use client";
import { useState } from "react";

type Props = {
  name?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
};

export default function RadiusSlider({
  name = "radius",
  defaultValue = 25,
  min = 5,
  max = 50,
  step = 5
}: Readonly<Props>) {
  const [val, setVal] = useState<number>(defaultValue);

  return (
    <div className="w-full">
      <label className="block text-sm mb-1">Radius: {val} mi</label>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => setVal(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
