const SETTINGS_KEY = "aetherbot_settings";

export const DEFAULT_SETTINGS = {
  theme: "dark",
  accent: "default",
  compactMode: false,
  showProjectProgress: true,
  enterToSend: true,
  animations: true
};

export function loadSettings() {
  try {
    const saved =
      localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return {
        ...DEFAULT_SETTINGS
      };
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed
    };
  } catch (error) {
    console.error(
      "AetherBot: unable to load settings.",
      error
    );

    return {
      ...DEFAULT_SETTINGS
    };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );

    return true;
  } catch (error) {
    console.error(
      "AetherBot: unable to save settings.",
      error
    );

    return false;
  }
}

export function resetSettings() {
  try {
    localStorage.removeItem(
      SETTINGS_KEY
    );
  } catch (error) {
    console.error(
      "AetherBot: unable to reset settings.",
      error
    );
  }

  return {
    ...DEFAULT_SETTINGS
  };
}
