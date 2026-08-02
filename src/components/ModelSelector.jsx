import { AI_MODELS } from "../config/models.js";

export default function ModelSelector({
  selectedModel,
  onChange
}) {
  const currentModel =
    AI_MODELS.find(
      (model) =>
        model.id === selectedModel
    ) || AI_MODELS[0];

  return (
    <select
      className="model-selector"
      value={currentModel.id}
      onChange={(event) =>
        onChange(event.target.value)
      }
      aria-label="Select AI model"
    >
      {AI_MODELS.map((model) => (
        <option
          key={model.id}
          value={model.id}
        >
          {model.name}
        </option>
      ))}
    </select>
  );
}
