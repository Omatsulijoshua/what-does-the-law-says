import './BrandEmblems.css';

export function BrandEmblems({ compact = false }) {
  return (
    <div className={`national-emblems${compact ? ' national-emblems--compact' : ''}`}>
      <img className="national-emblems__coat" src="/brand/nigeria-coat-of-arms.svg" alt="Nigeria coat of arms" width="78" height="66" />
    </div>
  );
}
