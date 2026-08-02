export default function ProjectProgress({
  project,
  onMarkComplete
}) {
  if (
    !project ||
    !project.enabled
  ) {
    return null;
  }

  const progress =
    Math.max(
      0,
      Math.min(
        100,
        project.progress || 0
      )
    );

  return (
    <div className="project-progress">
      <div className="project-progress-header">
        <div>
          <span className="project-icon">
            🚀
          </span>

          <span className="project-label">
            Project
          </span>
        </div>

        <span className="project-percent">
          {progress}%
        </span>
      </div>

      <div
        className="project-progress-track"
        aria-label={`Project progress: ${progress}%`}
      >
        <div
          className="project-progress-fill"
          style={{
            width: `${progress}%`
          }}
        />
      </div>

      <div className="project-progress-footer">
        <span>
          {project.completed
            ? "Completed"
            : "In progress"}
        </span>

        {!project.completed && (
          <button
            onClick={onMarkComplete}
          >
            Mark as done
          </button>
        )}
      </div>
    </div>
  );
}
