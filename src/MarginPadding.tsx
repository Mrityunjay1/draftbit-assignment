import React, { useState } from "react";
import "./MarginPadding.css";

type Side = "top" | "right" | "bottom" | "left";
type InputState = "default" | "changed" | "focused";

interface Value {
  value: string;
  unit: string;
}

interface PrismState {
  top: Value | null;
  right: Value | null;
  bottom: Value | null;
  left: Value | null;
}

interface PrismProps {
  title: string;
}

const Prism: React.FC<PrismProps> = ({ title }) => {
  const [focusedSide, setFocusedSide] = useState<Side | null>(null);
  const [values, setValues] = useState<PrismState>({
    top: null,
    right: null,
    bottom: null,
    left: null,
  });
  const [editingValue, setEditingValue] = useState<string>("");

  const parseValue = (input: string): Value | null => {
    if (input === "auto" || input === "") return null;

    const match = input.match(/^([0-9.]+)([a-z%]*)$/);
    if (match) {
      const [, value, unit] = match;
      return { value, unit: unit || "px" };
    }
    return { value: input, unit: "px" };
  };

  const getInputState = (side: Side): InputState => {
    if (side === focusedSide) return "focused";
    if (values[side]) return "changed";
    return "default";
  };

  const handleFocus = (side: Side, value: string) => {
    setFocusedSide(side);
    setEditingValue(value === "auto" ? "" : value);
  };

  const handleBlur = (side: Side) => {
    setFocusedSide(null);
    const parsedValue = parseValue(editingValue);
    setValues((prev) => ({
      ...prev,
      [side]: parsedValue,
    }));
  };

  const handleChange = (input: string) => {
    setEditingValue(input);
  };

  const getDisplayValue = (side: Side): string => {
    if (side === focusedSide) return editingValue;
    const value = values[side];
    return value ? `${value.value}${value.unit}` : "auto";
  };

  const renderInput = (side: Side, isOuter: boolean) => {
    const inputState = getInputState(side);
    const displayValue = getDisplayValue(side);
    const className = isOuter ? `outer-${side}` : `inner-${side}`;

    if (isOuter) {
      return (
        <div className={`prism-input ${className} ${inputState}`}>
          <input
            type="text"
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => handleFocus(side, displayValue)}
            onBlur={() => handleBlur(side)}
          />
          {inputState === "changed" && (
            <span className="changed-indicator"></span>
          )}
          {inputState === "focused" && (
            <span className="focused-indicator"></span>
          )}
        </div>
      );
    }

    return <div className={`prism-value ${className}`}>{displayValue}</div>;
  };

  return (
    <div className="prism-container">
      <div className="prism-box">
        <div className="prism-outer">
          {renderInput("top", true)}
          {renderInput("right", true)}
          {renderInput("bottom", true)}
          {renderInput("left", true)}
          <div className="prism-inner">
            {renderInput("top", false)}
            {renderInput("right", false)}
            {renderInput("bottom", false)}
            {renderInput("left", false)}
            <div className="prism-center">auto</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarginPadding: React.FC = () => {
  return <Prism title="Margins & Padding" />;
};

export default MarginPadding;
