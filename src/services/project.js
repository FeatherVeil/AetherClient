const PROJECT_PATTERNS = [
  /\bmy goal is\b/i,
  /\bi want to\b/i,
  /\bi need to\b/i,
  /\bi'm trying to\b/i,
  /\bi am trying to\b/i,
  /\bi'm working on\b/i,
  /\bi am working on\b/i,
  /\bi'm building\b/i,
  /\bi am building\b/i,
  /\bi'm making\b/i,
  /\bi am making\b/i,
  /\bi'm creating\b/i,
  /\bi am creating\b/i,
  /\bi need help (?:to|with)\b/i,
  /\bi want help (?:to|with)\b/i,
  /\bhelp me (?:build|make|create|learn|finish|achieve)\b/i,
  /\bfinish\b/i,
  /\bcomplete\b/i,
  /\bachieve\b/i,
  /\blearn\b/i,
  /\bdevelop\b/i,
  /\bbuild\b/i,
  /\bcreate\b/i,
  /\bmake\b/i
];

const PROJECT_KEYWORDS = [
  "project",
  "goal",
  "plan",
  "deadline",
  "milestone",
  "task",
  "tasks",
  "roadmap",
  "build",
  "building",
  "create",
  "creating",
  "learn",
  "learning",
  "develop",
  "developing",
  "finish",
  "complete",
  "completion",
  "achieve",
  "achievement"
];

const COMPLETION_PATTERNS = [
  /\bi finished\b/i,
  /\bi have finished\b/i,
  /\bi'm finished\b/i,
  /\bit's finished\b/i,
  /\bit is finished\b/i,
  /\bi completed\b/i,
  /\bi have completed\b/i,
  /\bit's complete\b/i,
  /\bit is complete\b/i,
  /\bi did it\b/i,
  /\bi achieved it\b/i,
  /\bwe're done\b/i,
  /\bwe are done\b/i,
  /\bmark .* done\b/i
];

const SETBACK_PATTERNS = [
  /\bi made a mistake\b/i,
  /\bi made mistakes\b/i,
  /\bi did something wrong\b/i,
  /\bi did it wrong\b/i,
  /\bi missed something\b/i,
  /\bi forgot something\b/i,
  /\bi broke\b/i,
  /\bit doesn't work\b/i,
  /\bit does not work\b/i,
  /\bi failed\b/i,
  /\bthere's an error\b/i,
  /\bthere is an error\b/i,
  /\bwe need to fix\b/i,
  /\bi need to fix\b/i,
  /\bwent wrong\b/i
];

function normalize(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function countKeywordMatches(text) {
  const lowerText =
    text.toLowerCase();

  return PROJECT_KEYWORDS.reduce(
    (count, keyword) => {
      return lowerText.includes(
        keyword
      )
        ? count + 1
        : count;
    },
    0
  );
}

function hasProjectPattern(text) {
  return PROJECT_PATTERNS.some(
    (pattern) =>
      pattern.test(text)
  );
}

function hasCompletionPattern(text) {
  return COMPLETION_PATTERNS.some(
    (pattern) =>
      pattern.test(text)
  );
}

function hasSetbackPattern(text) {
  return SETBACK_PATTERNS.some(
    (pattern) =>
      pattern.test(text)
  );
}

export function analyzeProjectMessage(
  text
) {
  const normalized =
    normalize(text);

  if (!normalized) {
    return {
      isProjectSignal: false,
      completed: false,
      setback: false,
      confidence: 0,
      progressAdjustment: 0
    };
  }

  const patternMatch =
    hasProjectPattern(
      normalized
    );

  const keywordMatches =
    countKeywordMatches(
      normalized
    );

  const completed =
    hasCompletionPattern(
      normalized
    );

  const setback =
    hasSetbackPattern(
      normalized
    );

  let confidence = 0;

  if (patternMatch) {
    confidence += 0.55;
  }

  confidence += Math.min(
    keywordMatches * 0.08,
    0.32
  );

  if (
    normalized.length > 80
  ) {
    confidence += 0.08;
  }

  confidence = Math.min(
    confidence,
    1
  );

  let progressAdjustment = 0;

  if (completed) {
    progressAdjustment = 100;
  } else if (setback) {
    /*
     * A setback does not directly reduce
     * project percentage.
     *
     * The project system will later use
     * setbacks to reduce the rate at which
     * progress is gained.
     */
    progressAdjustment = 0;
  }

  return {
    isProjectSignal:
      confidence >= 0.55 ||
      completed,
    completed,
    setback,
    confidence,
    progressAdjustment
  };
}

export function analyzeProjectConversation(
  messages
) {
  if (!Array.isArray(messages)) {
    return {
      isProject: false,
      progress: 0,
      confidence: 0,
      setbacks: 0,
      completed: false
    };
  }

  let strongestConfidence = 0;
  let projectSignals = 0;
  let setbacks = 0;
  let completed = false;

  for (const message of messages) {
    if (
      message?.role !== "user"
    ) {
      continue;
    }

    const analysis =
      analyzeProjectMessage(
        message.content
      );

    if (
      analysis.isProjectSignal
    ) {
      projectSignals += 1;
    }

    strongestConfidence =
      Math.max(
        strongestConfidence,
        analysis.confidence
      );

    if (analysis.setback) {
      setbacks += 1;
    }

    if (analysis.completed) {
      completed = true;
    }
  }

  const isProject =
    projectSignals > 0 ||
    strongestConfidence >= 0.55;

  let progress = 0;

  if (completed) {
    progress = 100;
  } else if (isProject) {
    progress = Math.min(
      5 +
        projectSignals * 3,
      20
    );
  }

  return {
    isProject,
    progress,
    confidence:
      strongestConfidence,
    setbacks,
    completed
  };
}

export function getProjectStatus(
  messages,
  manuallyMarkedDone = false
) {
  const analysis =
    analyzeProjectConversation(
      messages
    );

  if (manuallyMarkedDone) {
    return {
      ...analysis,
      isProject: true,
      progress: 100,
      completed: true
    };
  }

  return analysis;
      }
