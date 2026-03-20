export default function LoadingOverlay({
  message = "Computing...",
}: {
  message?: string;
}) {
  return (
    <div className="stale-overlay">
      <div className="loading-pill">
        <div className="w-3 h-3 border-[1.5px] border-gray-400 border-t-transparent rounded-full animate-spin" />
        {message}
      </div>
    </div>
  );
}
