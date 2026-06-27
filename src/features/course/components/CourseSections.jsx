const isPreviewVideo = (video) =>
  Boolean(video?.isPreview || video?.isFreePreview);

export default function CourseSections({
  sections = [],
  isPurchased,
  onSelectVideo,
}) {
  if (!sections.length) {
    return (
      <div className="border border-dashed rounded-lg p-4 text-sm text-gray-500">
        Course content will appear here after instructors upload videos.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section._id} className="border rounded-lg p-3">
          <div className="mb-2">
            <h3 className="font-bold">{section.title}</h3>
            {section.assignedInstructor?.name && (
              <p className="text-xs text-gray-500">
                Instructor: {section.assignedInstructor.name}
              </p>
            )}
          </div>

          {(section.videos || []).length === 0 ? (
            <p className="text-sm text-gray-400">No videos uploaded yet.</p>
          ) : (
            (section.videos || []).map((video) => {
              const isPreview = isPreviewVideo(video);
              const isLocked = !isPurchased && !isPreview;

              return (
                <div
                  key={video._id}
                  className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                    isLocked ? "bg-gray-100" : "hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    if (!isLocked) onSelectVideo(video);
                  }}
                >
                  <span>{video.title}</span>

                  {isLocked ? (
                    <span className="text-red-500">Locked</span>
                  ) : isPreview ? (
                    <span className="text-green-600">Preview</span>
                  ) : (
                    <span className="text-blue-600">Play</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}
