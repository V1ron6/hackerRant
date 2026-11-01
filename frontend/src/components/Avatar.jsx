/** Round-rect avatar: the uploaded picture, or the first letter of the name. */
const Avatar = ({ src, name = '?', size = 40, className = '' }) => {
  const letter = String(name).replace('@', '').slice(0, 1).toUpperCase() || '?';
  const style = { width: size, height: size, flex: `0 0 ${size}px`, borderRadius: Math.round(size * 0.34) };
  if (src) {
    return <img src={src} alt="" loading="lazy" style={style} className={`object-cover ${className}`} />;
  }
  return (
    <div
      aria-hidden="true"
      style={{ ...style, fontSize: Math.round(size * 0.4) }}
      className={`grid place-items-center bg-gradient-to-br from-[#f05268] to-[#9b5de5] font-extrabold text-white ${className}`}
    >
      {letter}
    </div>
  );
};

export default Avatar;
