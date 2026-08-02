const PROJECT_KEYWORDS = [
  "project",
  "build",
  "create",
  "develop",
  "make",
  "design",
  "launch",
  "website",
  "app",
  "application",
  "program",
  "software",
  "learn",
  "study",
  "finish",
  "complete",
  "plan",
  "goal",
  "roadmap",
  "setup",
  "set up",
  "implement",
  "prepare",
  "organize"
];

const COMPLETION_KEYWORDS = [
  "done",
  "finished",
  "completed",
  "complete",
  "works",
  "working",
  "success",
  "successful",
  "solved",
  "ready"
];

const PROBLEM_KEYWORDS = [
  "wrong",
  "mistake",
  "missed",
  "forgot",
  "broken",
  "failed",
  "error",
  "issue",
  "problem"
];

export function detectProject(
  messages
) {
  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return false;
  }

  const text = messages
    .map(
      (message) =>
        message.content || ""
    )
    .join(" ")
    .toLowerCase();

  const keywordMatches =
    PROJECT_KEYWORDS.filter(
      (keyword) =>
        text.includes(keyword)
    ).length;

  /*
   * We require multiple signals so that
   * saying something like "build me a
   * sentence" doesn't automatically turn
   * every conversation into a project.
   */
  const hasGoalLanguage =
    /\b(i want|i need|i'm trying|i am trying|my goal|help me)\b/i.test(
      text
    );

  const hasSequentialLanguage =
    /\b(step|steps|first|then|next|finally|phase|stage)\b/i.test(
      text
    );

  return (
    keywordMatches >= 2 ||
    (keywordMatches >= 1 &&
      hasGoalLanguage) ||
    (keywordMatches >= 1 &&
      hasSequentialLanguage)
  );
}

export function calculateProgress(
  messages,
  currentProgress = 0
) {
  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return currentProgress;
  }

  const text = messages
    .map(
      (message) =>
        message.content || ""
    )
    .join(" ")
    .toLowerCase();

  /*
   * Completion is always allowed to reach
   * 100%, but progress never decreases.
   */
  const hasCompletionSignal =
    COMPLETION_KEYWORDS.some(
      (keyword) =>
        text.includes(keyword)
    );

  if (hasCompletionSignal) {
    return 100;
  }

  /*
   * Estimate progress from conversation
   * activity. This is intentionally
   * conservative.
   */
  const userMessages =
    messages.filter(
      (message) =>
        message.role === "user"
    );

  const assistantMessages =
    messages.filter(
      (message) =>
        message.role === "assistant"
    );

  let estimatedProgress =
    currentProgress;

  estimatedProgress +=
    Math.min(
      userMessages.length * 3,
      30
    );

  estimatedProgress +=
    Math.min(
      assistantMessages.length * 2,
      20
    );

  const hasSteps =
    /\b(step|steps|phase|stage)\b/i.test(
      text
    );

  if (hasSteps) {
    estimatedProgress += 10;
  }

  /*
   * Problems do not directly reduce the
   * percentage. Instead, they slow future
   * progress. The progress calculation
   * therefore never subtracts from the
   * existing percentage.
   */
  const problemCount =
    PROBLEM_KEYWORDS.filter(
      (keyword) =>
        text.includes(keyword)
    ).length;

  if (problemCount > 0) {
    estimatedProgress =
      Math.max(
        currentProgress,
        estimatedProgress -
          Math.min(
            problemCount * 2,
            10
          )
      );
  }

  return Math.min(
    99,
    Math.max(
      currentProgress,
      Math.round(
        estimatedProgress
      )
    )
  );
}

export function calculateProgressSpeed(
  messages
) {
  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return 1;
  }

  const text = messages
    .map(
      (message) =>
        message.content || ""
    )
    .join(" ")
    .toLowerCase();

  const problemCount =
    PROBLEM_KEYWORDS.filter(
      (keyword) =>
        text.includes(keyword)
    ).length;

  /*
   * Speed is separate from progress.
   *
   * 1.0 = normal
   * 0.8 = slightly slowed
   * 0.6 = significantly slowed
   * 0.4 = heavily slowed
   */
  if (problemCount >= 4) {
    return 0.4;
  }

  if (problemCount >= 3) {
    return 0.6;
  }

  if (problemCount >= 1) {
    return 0.8;
  }

  return 1;
}

export function createProjectState() {
  return {
    enabled: false,

    progress: 0,

    completed: false,

    manuallyCompleted: false,

    progressSpeed: 1,

    steps: []
  };
}

export function enableProject(
  project
) {
  return {
    ...(project ||
      createProjectState()),

    enabled: true
  };
}

export function markProjectComplete(
  project
) {
  return {
    ...(project ||
      createProjectState()),

    enabled: true,

    progress: 100,

    completed: true,

    manuallyCompleted: true,

    progressSpeed: 1
  };
}

export function updateProject(
  project,
  messages
) {
  const currentProject =
    project ||
    createProjectState();

  const detected =
    detectProject(messages);

  if (
    !currentProject.enabled &&
    !detected
  ) {
    return currentProject;
  }

  const progress =
    calculateProgress(
      messages,
      currentProject.progress
    );

  const progressSpeed =
    calculateProgressSpeed(
      messages
    );

  return {
    ...currentProject,

    enabled:
      currentProject.enabled ||
      detected,

    progress,

    completed:
      currentProject.completed ||
      progress >= 100,

    progressSpeed
  };
}
