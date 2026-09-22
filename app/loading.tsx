export default function Loading() {
  return (
    <div className="page-stack" aria-busy="true" aria-label="Loading Yumna">
      <div className="skeleton" />
      <div className="metric-grid">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="loading-grid">
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </div>
    </div>
  );
}
