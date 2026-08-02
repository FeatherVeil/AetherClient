const PROJECT_PATTERNS = [
  /\b(build|create|make|develop|design|launch|finish|complete|learn|study|write|prepare|plan|organize|start|improve|fix|solve|achieve|reach)\b/i,
  /\b(goal|project|task|objective|deadline|milestone|roadmap|plan)\b/i,
  /\b(i want to|i need to|i'm trying to|i am trying to|i need help to|help me)\b/i,
  /\b(by (tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
  /\b(step \d+|next step|what should i do next)\b/i
];

const COMPLETION_PATTERNS = [
  /\b(done|finished|completed|complete|achieved|accomplished)\b/i,
  /\b(it works|everything works|it's ready|it is ready)\b/i,
  /\b(i finished|i completed|i did it|i made it)\b/i,
  /\b(mark.*done|consider.*done)\b/i
];

const SETBACK_PATTERNS = [
  /\b(i (made|did) (a )?(mistake|error))\b/i,
  /\b(i messed up)\b/i,
  /\b(i forgot)\b/i,
  /\b(i missed)\b/i,
  /\b(i broke)\b/i,
  /\b(doesn't work|does not work|not working)\b/i,
  /\b(wrong|incorrect|failed|failure|problem|issue|bug)\b/i,
  /\b(i need to redo)\b/i,
  /\b(i have to redo)\b/i
];

const PROGRESS_PATTERNS = [
  /\b(i (did|finished|completed|made|built|created|fixed))\b/i,
  /\b(done with)\b/i,
  /\b(finished)\b/i,
  /\b(completed)\b/i,
  /\b(working now)\b/i,
  /\b(it works now)\b/i,
  /\b(fixed it)\b/i,
  /\b(implemented)\b/i,
  /\b(added)\b/i
];

function matchesAny(
  text,
  patterns
) {
  return patterns.some(
    (pattern) => pattern.test(text)
  );
}

export function analyzeProjectMessage(
  message
) {
  const text = String(message || "").trim();

  if (!text) {
    return {
      isProjectSignal: false,
      completed: false,
      setback: false,
      progressSignal: false
    };
  }

  const completed = matchesAny(
    text,
    COMPLETION_PATTERNS
  );

  const setback = matchesAny(
    text,
    SETBACK_PATTERNS
  );

  const progressSignal = matchesAny(
    text,
    PROGRESS_PATTERNS
  );

  const projectSignal =
    matchesAny(
      text,
      PROJECT_PATTERNS
    ) ||
    progressSignal ||
    setback ||
    completed;

  return {
    isProjectSignal: projectSignal,
    completed,
    setback,
    progressSignal
  };
}

export function calculateProgressSpeed(
  setbackCount
) {
  if (setbackCount <= 0) {
    return 4;
  }

  if (setbackCount === 1) {
    return 3;
  }

  if (setbackCount === 2) {
    return 2;
  }

  return 1;
}

export function updateProjectProgress({
  currentProgress = 0,
  setbackCount = 0,
  completed = false,
  progressSignal = false
}) {
  if (completed) {
    return 100;
  }

  if (!progressSignal) {
    return currentProgress;
  }

  const speed =
    calculateProgressSpeed(
      setbackCount
    );

  return Math.min(
    99,
    currentProgress + speed
  );
}
