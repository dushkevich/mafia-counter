import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import Step1Count from './steps/Step1Count'
import Step2Players from './steps/Step2Players'
import Step3Roles from './steps/Step3Roles'
import Step4Assign from './steps/Step4Assign'
import Step5LiveBonuses from './steps/Step5LiveBonuses'
import Step7Winner from './steps/Step7Winner'
import StepResult from './steps/StepResult'
import GameTimer from './GameTimer'

const STEP_LABELS = ['Игроков', 'Участники', 'Роли', 'Раздача', 'Живые и очки', 'Победитель']
const TOTAL_STEPS = 6

export default function NewGame() {
  const { step } = useGameStore()
  const isResult = step === 7

  const [timerKey, setTimerKey] = useState(0)
  const prevStep = useRef(step)
  useEffect(() => {
    if (step === 1 && prevStep.current > 1) {
      setTimerKey((k) => k + 1)
    }
    prevStep.current = step
  }, [step])

  return (
    <div className="p-6 max-w-xl mx-auto">
      {!isResult && <GameTimer key={timerKey} />}

      {!isResult && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">
              ШАГ {step} ИЗ {TOTAL_STEPS}
            </span>
            <span className="text-xs text-slate-400">{STEP_LABELS[step - 1]}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 1 && <Step1Count />}
      {step === 2 && <Step2Players />}
      {step === 3 && <Step3Roles />}
      {step === 4 && <Step4Assign />}
      {step === 5 && <Step5LiveBonuses />}
      {step === 6 && <Step7Winner />}
      {step === 7 && <StepResult />}
    </div>
  )
}
