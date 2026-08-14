import PropTypes from "prop-types";

export default function SkeletonLoader({ type = "kpiRow" }) {
  if (type === "kpiRow") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5" aria-busy="true">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="fx-card animate-pulse min-h-[118px]">
            <div className="h-2.5 bg-fx-line-strong rounded w-1/2 mb-5" />
            <div className="h-6 bg-fx-line-strong rounded w-3/4 mb-5" />
            <div className="h-2.5 bg-fx-line rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="fx-card animate-pulse min-h-[250px] mb-5" aria-busy="true">
      <div className="h-3 bg-fx-line-strong rounded w-1/4 mb-6" />
      <div className="h-40 bg-fx-line rounded w-full" />
    </div>
  );
}

SkeletonLoader.propTypes = {
  type: PropTypes.string
};
