export default function SliderField({ label, value, display, ...range }) {
  return (
    <label className="sl">
      <span>
        <b>{label}</b>
        <b>{display ?? value}</b>
      </span>
      <input type="range" value={value} {...range} />
    </label>
  );
}
