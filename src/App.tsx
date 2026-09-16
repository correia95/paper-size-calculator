import { useMemo, useState } from 'react';
import {
  ALL_SIZES, A_SERIES, State, getSize, mmToInches, mmToPixels, sheetsPerSheet, aSeriesIndex,
  encodeState, decodeState,
} from './paper';

const DPI_PRESETS = [72, 150, 300, 600];

function defaultState(): State {
  return { sizeName: 'A4', dpi: 300, compareSizeName: 'A0' };
}

function readInitialState(): State {
  const params = new URLSearchParams(window.location.search);
  if ([...params.keys()].length === 0) return defaultState();
  return decodeState(params, defaultState());
}

function fmt(n: number, digits = 1): string {
  return n.toFixed(digits);
}

export default function App() {
  const [state, setState] = useState<State>(readInitialState);
  const [copied, setCopied] = useState(false);

  const size = useMemo(() => getSize(state.sizeName) ?? { width: 0, height: 0 }, [state.sizeName]);
  const inches = useMemo(() => ({ width: mmToInches(size.width), height: mmToInches(size.height) }), [size]);
  const pixels = useMemo(() => ({
    width: mmToPixels(size.width, state.dpi),
    height: mmToPixels(size.height, state.dpi),
  }), [size, state.dpi]);
  const fits = useMemo(() => sheetsPerSheet(state.compareSizeName, state.sizeName), [state.sizeName, state.compareSizeName]);

  function update<K extends keyof State>(key: K, value: State[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function shareLink() {
    const params = encodeState(state);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', `?${params.toString()}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="page">
      <h1>Paper Size Calculator</h1>
      <p className="lede">
        Look up ISO 216 (A-series) and US paper size dimensions in mm, inches, and pixels at any
        DPI, and see how many smaller sheets fit exactly inside a larger one.
      </p>

      <section className="panel">
        <h2>Paper size</h2>
        <select value={state.sizeName} onChange={(e) => update('sizeName', e.target.value)}>
          <optgroup label="ISO 216 (A-series)">
            {Object.keys(A_SERIES).map((n) => <option key={n} value={n}>{n}</option>)}
          </optgroup>
          <optgroup label="US">
            {Object.keys(ALL_SIZES).filter((n) => !(n in A_SERIES)).map((n) => <option key={n} value={n}>{n}</option>)}
          </optgroup>
        </select>
      </section>

      <section className="result positive">
        <div className="result-row">
          <div><div className="small-label">Millimeters</div><div className="big-num">{fmt(size.width)} × {fmt(size.height)}</div></div>
          <div><div className="small-label">Inches</div><div className="big-num">{fmt(inches.width, 2)} × {fmt(inches.height, 2)}</div></div>
        </div>
      </section>

      <section className="panel">
        <h2>Pixel dimensions</h2>
        <div className="preset-buttons">
          {DPI_PRESETS.map((d) => (
            <button key={d} className={state.dpi === d ? 'active' : ''} onClick={() => update('dpi', d)}>{d} DPI</button>
          ))}
        </div>
        <label className="field">
          <span>Custom DPI</span>
          <input type="number" step={1} value={state.dpi} onChange={(e) => update('dpi', e.target.valueAsNumber || 0)} />
        </label>
        <p className="pixel-result">{pixels.width} × {pixels.height} px</p>
      </section>

      <section className="panel">
        <h2>How many fit inside?</h2>
        <label className="field">
          <span>Compare against</span>
          <select value={state.compareSizeName} onChange={(e) => update('compareSizeName', e.target.value)}>
            {Object.keys(A_SERIES).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <p className="fit-result">
          {fits !== null
            ? <>{/^[AEIOU]/i.test(state.compareSizeName) ? 'An' : 'A'} {state.compareSizeName} sheet holds exactly <strong>{fits}</strong> {state.sizeName} sheet{fits === 1 ? '' : 's'} — each halving of the A-series exactly doubles the sheet count.</>
            : state.sizeName === state.compareSizeName
              ? 'Pick two different A-series sizes to compare.'
              : aSeriesIndex(state.sizeName) !== null && aSeriesIndex(state.compareSizeName) !== null
                ? `${state.compareSizeName} is smaller than (or the same as) ${state.sizeName}, so it can't hold a whole ${state.sizeName} sheet — pick a larger comparison size.`
                : "This comparison only applies within the A-series, where each size is exactly double the area of the next — it isn't meaningful for US sizes, which don't share that doubling relationship."}
        </p>
      </section>

      <div className="actions">
        <button className="share-btn" onClick={shareLink}>{copied ? 'Copied!' : 'Copy share link'}</button>
      </div>

      <section className="explainer">
        <h2>How this works</h2>
        <p>
          ISO 216's A-series is defined so that cutting any size in half along its long edge
          produces exactly two sheets of the next size down, at the same 1:√2 aspect ratio — that's
          why an A0 sheet holds exactly 16 A4 sheets (four halvings, 2⁴). US sizes like Letter and
          Legal don't follow this rule, so "sheets that fit" isn't a clean exact number for them.
        </p>
        <h2>Frequently asked questions</h2>
        <h3>Why 2480 × 3508 px for A4 at 300 DPI?</h3>
        <p>
          A4 is 210 × 297 mm. Converting to inches (÷25.4) and multiplying by 300 dots per inch
          gives 2480 × 3508 pixels — a commonly cited reference for print-resolution A4 scans.
        </p>
        <h3>Does this work for B-series or envelope sizes?</h3>
        <p>Not yet — only the ISO A-series and the common US Letter/Legal/Tabloid/Executive sizes are included.</p>
        <h3>Are these exact dimensions?</h3>
        <p>ISO 216 A-series sizes are exact millimeter specifications. US sizes are standard inch measurements converted to millimeters and rounded to one decimal place.</p>
      </section>
    </main>
  );
}
