
export function SkeletonLoader() {
  return (
    <div className="bg-brand-primary min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-brand-card rounded-lg border border-brand-border p-6 animate-pulse">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-brand-surface rounded-full" />
                  <div className="h-5 bg-brand-surface rounded w-48" />
                </div>
                <div className="h-6 bg-brand-surface rounded-full w-16" />
              </div>

              {/* Stats line */}
              <div className="h-4 bg-brand-surface rounded w-64 mb-3" />

              {/* Progress bar */}
              <div className="mb-4">
                <div className="w-full bg-brand-surface rounded-full h-2">
                  <div className="h-2 bg-brand-border rounded-full w-1/3" />
                </div>
              </div>

              {/* Suggestion lines */}
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-brand-surface rounded w-full" />
                <div className="h-4 bg-brand-surface rounded w-3/4" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <div className="h-8 bg-brand-surface rounded w-24" />
                <div className="h-8 bg-brand-surface rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}