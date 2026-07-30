import { HiStar } from 'react-icons/hi';

const StarRating = ({ rating = 0, maxRating = 5, interactive = false, onChange, reviewCount, size = 'md' }) => {
  const sizeMap = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };
  const starSize = sizeMap[size] || sizeMap.md;

  const handleClick = (value) => {
    if (interactive && onChange) onChange(value);
  };

  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    const filled = i <= Math.floor(rating);
    stars.push(
      <button key={i} type="button" disabled={!interactive} onClick={() => handleClick(i)}
        className={(interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default') + ' transition-transform ' + (filled ? 'text-yellow-400' : 'text-gray-300')}
        aria-label={i + ' star' + (i > 1 ? 's' : '')}>
        <HiStar className={starSize + (filled ? ' fill-current' : '')} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">{stars}</div>
      {rating > 0 && !interactive && <span className="text-sm text-gray-600 ml-1.5 font-medium">{rating.toFixed(1)}</span>}
      {reviewCount !== undefined && <span className="text-sm text-gray-400 ml-1">({' + reviewCount + '})</span>}
    </div>
  );
};

export default StarRating;
