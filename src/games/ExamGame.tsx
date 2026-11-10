import { useMemo, useState } from 'react'
import { Lily } from '../art/People'
import { useAuth } from '../auth/AuthProvider'
import { Stamp } from '../components/ui'
import { buildExamRound, EXAM_QUESTIONS, examTitle, shuffle, type ExamQuestion } from '../data/exam'
import { sfx } from '../lib/sound'
import type { ExamResult } from '../lib/types'
import { GameShell, ResultCard, SaveBanner, useGameSave } from './GameShell'

interface Asked {
  q: ExamQuestion
  order: number[] // display order of original option indexes
}

function newRound(): Asked[] {
  return buildExamRound().map((q) => ({ q, order: shuffle([0, 1, 2, 3]) }))
}

export function ExamGame() {
  const { api } = useAuth()
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState<Asked[]>(newRound)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const save = useGameSave<ExamResult>()
  const finished = i >= round.length

  const submit = (final: Record<string, number | null>) => {
    sfx('pop')
    void save.run(() => api.submitExam(final))
  }

  const answer = (choice: number | null) => {
    const cur = round[i]
    const next = { ...answers, [cur.q.id]: choice }
    setAnswers(next)
    sfx('tap')
    if (i + 1 >= round.length) submit(next)
    setI(i + 1)
  }

  const replay = () => {
    setRound(newRound())
    setI(0)
    setAnswers({})
    save.reset()
  }

  const result = save.state.status === 'saved' ? save.state.result : null
  const grade = useMemo(() => (result ? examTitle(result.score) : null), [result])

  return (
    <GameShell game="totally_fair_exam" started={started} onStart={() => setStarted(true)} intro={<Lily width={110} mood="proud" />}>
      {!finished ? (
        <div className="exam card" key={i}>
          <div className="exam-top">
            <span className="chip">
              Question {i + 1} / {round.length}
            </span>
            <div className="dots" aria-hidden="true">
              {round.map((_, k) => (
                <span key={k} className={k < i ? 'dot done' : k === i ? 'dot now' : 'dot'} />
              ))}
            </div>
          </div>
          <h2 className="exam-q">{round[i].q.prompt}</h2>
          <div className="options">
            {round[i].order.map((orig) => (
              <button key={orig} className="option" onClick={() => answer(orig)}>
                {round[i].q.options[orig]}
              </button>
            ))}
          </div>
          {round[i].q.bonus && (
            <button className="btn btn-ghost" onClick={() => answer(null)}>
              Skip — no surprise anatomy questions tonight (no penalty)
            </button>
          )}
          <p className="fine">Answers are sealed in an envelope and graded by the faculty server at the end.</p>
        </div>
      ) : save.state.status === 'saving' || save.state.status === 'idle' ? (
        <div className="card grading">
          <Lily width={100} mood="neutral" className="grading-lily" />
          <p>Professor Lily is grading with a very serious red pen…</p>
        </div>
      ) : save.state.status === 'error' ? (
        <div className="card grading">
          <Lily width={100} mood="shy" />
          <p>The faculty server could not be reached, so your exam is not graded yet. Your answers are still here.</p>
          <SaveBanner state={save.state} onRetry={() => void save.retry()} />
          <button className="btn" onClick={replay}>
            Start a new exam instead
          </button>
        </div>
      ) : result && grade ? (
        <ResultCard
          stamp={`${result.score}/100`}
          stampTone={result.score >= 75 ? 'mint' : 'rose'}
          title={grade.title}
          lines={[grade.note, result.perfect ? 'Perfect paper: +5 bonus ⭐ (once a day).' : 'Professor Lily has a 100-point rubric and no mercy. (Some mercy.)']}
          art={
            <div className="result-scene">
              <Lily width={90} mood={result.score >= 75 ? 'proud' : 'amused'} />
            </div>
          }
          save={save.state}
          onRetrySave={() => void save.retry()}
          onReplay={replay}
        >
          <ol className="grade-sheet">
            {result.results.map((r) => {
              const q = EXAM_QUESTIONS.find((x) => x.id === r.questionId)
              if (!q) return null
              return (
                <li key={r.questionId} className={r.correct === null ? 'skipped' : r.correct ? 'right' : 'wrong'}>
                  <span className="mark" aria-hidden="true">
                    {r.correct === null ? '–' : r.correct ? '✓' : '✗'}
                  </span>
                  <span>
                    <strong>{q.prompt}</strong>
                    <br />
                    {r.correct === null ? 'Skipped (faculty promise: no penalty).' : r.correct ? q.options[r.correctIndex] : `Answer: ${q.options[r.correctIndex]}`}
                  </span>
                </li>
              )
            })}
          </ol>
          <div className="seal-row">
            <Stamp text="APPROVED BY PROFESSOR LILY" tone="gold" small />
          </div>
        </ResultCard>
      ) : null}
    </GameShell>
  )
}
