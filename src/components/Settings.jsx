import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  resetSettings,
  saveSettings
} from "../services/settings";

export default function Settings({
  onClose,
  onSettingsChange
}) {
  const [settings, setSettings] =
    useState(loadSettings);

  useEffect(() => {
    saveSettings(settings);

    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [
    settings,
    onSettingsChange
  ]);

  function updateSetting(
    key,
    value
  ) {
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

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <div>
            <h2>Settings</h2>
            <p>
              Personalize your AetherBot
              workspace.
            </p>
          </div>

          <button
            className="settings-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>Appearance</h3>

            <div className="settings-row">
              <div>
                <strong>Theme</strong>
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
                value={
                  settings.accent
                }
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
                  Reduce spacing in the
                  interface.
                </span>
              </div>

              <button
                className={`settings-toggle ${
                  settings.compactMode
                    ? "enabled"
                    : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "compactMode",
                    !settings.compactMode
                  )
                }
              >
                <span />
              </button>
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
                  Press Enter to send a
                  message.
                </span>
              </div>

              <button
                className={`settings-toggle ${
                  settings.enterToSend
                    ? "enabled"
                    : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "enterToSend",
                    !settings.enterToSend
                  )
                }
              >
                <span />
              </button>
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

              <button
                className={`settings-toggle ${
                  settings.animations
                    ? "enabled"
                    : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "animations",
                    !settings.animations
                  )
                }
              >
                <span />
              </button>
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
                  Show the progress bar for
                  detected projects.
                </span>
              </div>

              <button
                className={`settings-toggle ${
                  settings.showProjectProgress
                    ? "enabled"
                    : ""
                }`}
                onClick={() =>
                  updateSetting(
                    "showProjectProgress",
                    !settings.showProjectProgress
                  )
                }
              >
                <span />
              </button>
            </div>
          </section>

          <section className="settings-section danger-section">
            <h3>Reset</h3>

            <button
              className="reset-settings"
              onClick={
                restoreDefaults
              }
            >
              Restore default settings
            </button>
          </section>
        </div>
      </div>
    </div>
  );
                }
