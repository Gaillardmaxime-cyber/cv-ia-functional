import { useState } from 'react';

export default function Home(){
  const [cvText, setCvText] = useState('');
  const [jobText, setJobText] = useState('');
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(){
    setLoading(true); setError(null);
    try{
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobText })
      });
      if(!r.ok){ throw new Error('Erreur serveur'); }
      const data = await r.json();
      setOut(data);
    }catch(e:any){
      setError(e.message || 'Erreur');
    }finally{ setLoading(false); }
  }

  return (
    <main>
      <div className="h">
        <h1>CV-IA — Générateur de candidatures</h1>
        <span className="badge">MVP fonctionnel</span>
      </div>
      <p>Collez votre CV (texte) et l’offre d’emploi. Le système génère un <strong>CV optimisé</strong>, une <strong>lettre de motivation</strong> et une <strong>checklist d’entretien</strong>.</p>

      <div className="grid">
        <div className="card">
          <label>Votre CV (texte brut)</label>
          <textarea rows={14} value={cvText} onChange={e=>setCvText(e.target.value)} placeholder="Collez ici votre CV..." />
        </div>
        <div className="card">
          <label>Offre d'emploi (texte)</label>
          <textarea rows={14} value={jobText} onChange={e=>setJobText(e.target.value)} placeholder="Collez ici la description de poste..." />
        </div>
      </div>

      <div style={{display:'flex', gap:12, marginTop:16}}>
        <button onClick={handleGenerate} disabled={loading || !cvText || !jobText}>
          {loading ? 'Génération en cours...' : 'Générer CV + Lettre + Checklist'}
        </button>
      </div>

      {error && <p style={{color:'#fca5a5', marginTop:10}}>❌ {error}</p>}

      {out && (
        <section style={{marginTop:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div className="card">
            <h2>CV optimisé</h2>
            <pre>{out.cvOptimise}</pre>
          </div>
          <div className="card">
            <h2>Lettre de motivation</h2>
            <pre>{out.lettre}</pre>
          </div>
          <div className="card" style={{gridColumn:'1 / -1'}}>
            <h2>Checklist d’entretien (et score ATS)</h2>
            <pre>Score ATS estimé: {out.score}{'\n\n'}{out.checklist}</pre>
          </div>
        </section>
      )}
    </main>
  );
}
