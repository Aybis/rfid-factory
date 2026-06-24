export default function ProgressDots() {
  return (
    <div className="progress" id="progress">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`progress__dot${i === 0 ? ' active' : ''}`}
          data-index={i}
        />
      ))}
    </div>
  );
}
