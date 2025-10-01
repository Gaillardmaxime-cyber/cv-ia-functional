import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

type Data = { cvOptimise: string; lettre: string; checklist: string; score: number; };

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' } as any);
  const { cvText, jobText } = req.body || {};
  if(!cvText || !jobText) return res.status(400).json({ error: 'Champs manquants' } as any);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Tu es un expert RH qui optimise CV et lettres pour passer les ATS.
    Étape 1: à partir de l'offre, liste 10 mots-clés, 5 compétences techniques, 5 soft skills. Estime un score ATS (0-100) pour le CV.
    Étape 2: réécris le CV (format ATS) : En-tête, Résumé 3-4 lignes, Expériences en PAR (Problème-Action-Résultat) avec chiffres, Compétences (liste), Formation.
    Étape 3: rédige une lettre (200-300 mots) personnalisée + une checklist d'entretien (8-10 points).
    Offre:\n${jobText}\n---\nCV:\n${cvText}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es un expert RH concis et concret.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4
    });

    const text = completion.choices[0].message?.content || '';
    const cvStart = text.toLowerCase().indexOf('cv optimisé');
    const lettreStart = text.toLowerCase().indexOf('lettre');
    const checklistStart = text.toLowerCase().indexOf('checklist');
    let cvOptimise = text, lettre = text, checklist = text;
    if(cvStart >= 0 && lettreStart > cvStart){ cvOptimise = text.slice(cvStart, lettreStart).trim(); }
    if(lettreStart >= 0 && checklistStart > lettreStart){
      lettre = text.slice(lettreStart, checklistStart).trim();
      checklist = text.slice(checklistStart).trim();
    }
    const m = text.match(/(\b\d{1,3})\s*\/\s*100|score\s*:\s*(\d{1,3})|\b(\d{1,2}|100)\b(?=\s*\/\s*100)/i);
    const score = m ? Math.min(100, Math.max(0, parseInt((m[1]||m[2]||m[3]) || '75'))) : 75;

    return res.status(200).json({ cvOptimise, lettre, checklist, score } as Data);
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur serveur' } as any);
  }
}
