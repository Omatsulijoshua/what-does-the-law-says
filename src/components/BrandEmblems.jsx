import './BrandEmblems.css';

export function BrandEmblems({ compact = false }) {
  return (
    <div className={`national-emblems${compact ? ' national-emblems--compact' : ''}`}>
      <img className="national-emblems__coat" src="/brand/nigeria-coat-of-arms.svg" alt="Nigeria coat of arms" width="78" height="66" />
      <span className="national-emblems__companions">
        <img className="national-emblems__flag" src="/brand/nigeria-flag.svg" alt="Nigerian flag" width="40" height="20" />
        <img className="national-emblems__court" src="/brand/court-symbol.svg" alt="Court and scales of justice" width="36" height="36" />
      </span>
    </div>
  );
}
