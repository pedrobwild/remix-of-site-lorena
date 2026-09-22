export default function ScrollProgressBar({ percent }: { percent: number }) {
  return (
    <div className="fixed top-0 lg:left-[60px] left-0 right-0 h-1 bg-muted z-40">
      <div
        className="h-full bg-primary transition-all duration-150"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
