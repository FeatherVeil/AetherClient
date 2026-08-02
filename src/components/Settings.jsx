import { useEffect, useState } from "react";

const SETTINGS_KEY = "aetherbot_settings";

const DEFAULT_SETTINGS = {
  theme: "dark",
  accent: "default",
  compactMode: false,
  enterToSend: true,
  animations: true,
  showProjectProgress: true,
  spellcheck: true,
  autoFocusComposer: true
};

function getSettings() {
  try {
    const saved = localStorage.getItem(
      SETTINGS_KEY
    );

    if (!saved) {
      return {
        ...DEFAULT_SETTINGS
      };
    }

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {
        ...DEFAULT_SETTINGS
      };
    }

    return {
      ...DEFAULT_SETTINGS,
      ...parsed
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS
    };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error(
      "Unable to save AetherBot settings:",
      error
    );
  }
}

function Toggle({
  enabled,
  onChange,
  label
}) {
  return (
    <button
      type="button"
      className={`settings-toggle ${
        enabled ? "enabled" : ""
      }`}
      onClick={onChange}
      aria-pressed={enabled}
      aria-label={label}
    >
      <span />
    </button>
  );
}

export default function Settings({
  onClose,
  onSettingsChange
}) {
  const [settings, setSettings] =
    useState(getSettings);

  useEffect(() => {
    saveSettings(settings);

    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  }

  function restoreDefaults() {
    setSettings({
      ...DEFAULT_SETTINGS
    });
  }

  function handleOverlayMouseDown(event) {
    if (
      event.target ===
      event.currentTarget
    ) {
      onClose();
    }
  }

  return (
    <div
      className="settings-overlay"
      onMouseDown={
        handleOverlayMouseDown
      }
    >
      <div
        className="settings-panel"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="settings-header">
          <div>
            <h2>Settings</h2>

            <p>
              Personalize your
              AetherBot workspace.
            </p>
          </div>

          <button
            type="button"
            className="settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>Appearance</h3>

            <div className="settings-row">
              <div>
                <strong>
                  Theme
                </strong>

                <span>
                  Choose how AetherBot
                  looks.
                </span>
              </div>

              <select
                value={settings.theme}
                onChange={(event) =>
                  updateSetting(
                    "theme",
                    event.target.value
                  )
                }
              >
                <option value="dark">
                  Dark
                </option>

                <option value="light">
                  Light
                </option>

                <option value="system">
                  System
                </option>
              </select>
            </div>

            <div className="settings-row">
              <div>
                <strong>
                  Accent
                </strong>

                <span>
                  Choose the interface
                  accent.
                </span>
              </div>

              <select
                value={settings.accent}
                onChange={(event) =>
                  updateSetting(
                    "accent",
                    event.target.value
                  )
                }
              >
                <option value="default">
                  Default
                </option>

                <option value="blue">
                  Blue
                </option>

                <option value="purple">
                  Purple
                </option>

                <option value="green">
                  Green
                </option>
              </select>
            </div>

            <div className="settings-row">
              <div>
                <strong>
                  Compact mode
                </strong>

                <span>
                  Reduce spacing in
                  the interface.
                </span>
              </div>

              <Toggle
                enabled={
                  settings.compactMode
                }
                onChange={() =>
                  updateSetting(
                    "compactMode",
                    !settings.compactMode
                  )
                }
                label="Toggle compact mode"
              />
            </div>

            <div className="settings-row">
              <div>
                <strong>
                  Animations
                </strong>

                <span>
                  Enable interface
                  transitions.
                </span>
              </div>

              <Toggle
                enabled={
                  settings.animations
                }
                onChange={() =>
                  updateSetting(
                    "animations",
                    !settings.animations
                  )
                }
                label="Toggle animations"
              />
            </div>
          </section>

          <section className="settings-section">
            <h3>Chat</h3>

            <div className="settings-row">
              <div>
                <strong>
                  Enter to send
                </strong>

                <span>
                  Press Enter to send
                  a message.
                </span>
              </div>

              <Toggle
                enabled={
                  settings.enterToSend
                }
                onChange={() =>
                  updateSetting(
                    "enterToSend",
                    !settings.enterToSend
                  )
                }
                label="Toggle Enter to send"
              />
            </div>

            <div className="settings-row">
              <div>
                <strong>
                  Spellcheck
                </strong>

                <span>
                  Enable browser
                  spellcheck in the
                  message composer.
                </span>
              </div>

              <Toggle
                enabled={
                  settings.spellcheck
                }
                onChange={() =>
                  updateSetting(
                    "spellcheck",
                    !settings.spellcheck
                  )
                }
                label="Toggle spellcheck"
              />
            </div>

            <div className="settings-row">
              <div>
                <strong>
                  Auto-focus composer
                </strong>

                <span>
                  Focus the message box
                  when opening a chat.
                </span>
              </div>

              <Toggle
                enabled={
                  settings.autoFocusComposer
                }
                onChange={() =>
                  updateSetting(
                    "autoFocusComposer",
                    !settings.autoFocusComposer
                  )
                }
                label="Toggle auto-focus composer"
              />
            </div>
          </section>

          <section className="settings-section">
            <h3>Projects</h3>

            <div className="settings-row">
              <div>
                <strong>
                  Project progress
                </strong>

                <span>
                  Show the progress bar
                  for detected projects.
                </span>
              </div>

              <Toggle
                enabled={
                  settings.showProjectProgress
                }
                onChange={() =>
                  updateSetting(
                    "showProjectProgress",
                    !settings.showProjectProgress
                  )
                }
                label="Toggle project progress"
              />
            </div>
          </section>

          <section className="settings-section">
            <h3>Reset</h3>

            <div className="settings-row">
              <div>
                <strong>
                  Restore defaults
                </strong>

                <span>
                  Reset every AetherBot
                  setting to its original
                  value.
                </span>
              </div>

              <button
                type="button"
                className="reset-settings"
                onClick={
                  restoreDefaults
                }
              >
                Restore
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
