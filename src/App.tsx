import { Header as AgHeader } from '@ecossistema-guilda/layout/Header'
import agStyles from '@ecossistema-guilda/layout/Header.module.css'
import { LanguageSwitch } from '@ecossistema-guilda/modules/LanguageSwitch'
import { useRef, useState } from 'react'
import { AnimalForm } from './components/AnimalForm'
import { ExamineImport } from './components/ExamineImport'
import { AnimalTable } from './components/AnimalTable'
import { BreedingPanel } from './components/BreedingPanel'
import { PregnantTable } from './components/PregnantTable'
import { usePersistedHerd } from './hooks/usePersistedHerd'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import type { AnimalDraft } from './types'

function HusbandryTool() {
  const { language, setLanguage, t } = useLanguage()
  const { animals, addAnimal, updateAnimal, deleteAnimal, setBreeding, clearPregnancy, importExamined } =
    usePersistedHerd()
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef<number | null>(null)

  const flash = (message: string, ms = 4000) => {
    setNotice(message)
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), ms)
  }

  const handleSave = (draft: AnimalDraft) => {
    addAnimal(draft)
    flash(t('saved'))
  }

  const handleUpdate = (id: string, draft: AnimalDraft) => {
    updateAnimal(id, draft)
    flash(t('updated'))
  }

  const handleDelete = (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return
    deleteAnimal(id)
    flash(t('deleted'))
  }

  const handleBreed = (femaleId: string, maleId: string, days: number, hours: number) => {
    setBreeding(femaleId, maleId, days, hours)
    return null
  }

  return (
    <div className="min-h-screen bg-wurm-bg font-sans">
      <AgHeader
        currentToolId="husbandry"
        brandSubName={t('title')}
        lang={language === 'ru' ? 'en' : language}
        extraModules={
          <LanguageSwitch
            lang={language}
            onLanguageChange={(next) => setLanguage(next)}
            languages={[
              { code: 'en', label: 'EN' },
              { code: 'pt', label: 'PT' },
              { code: 'ru', label: 'RU' },
            ]}
            styles={agStyles}
          />
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-6 text-center text-wurm-muted">{t('subtitle')}</p>
        {notice && (
          <p className="mb-4 text-center text-sm text-emerald-400">{notice}</p>
        )}

        <ExamineImport
          onImport={(parsed) => {
            const summary = importExamined(parsed)
            flash(t('examineImported', summary))
          }}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <AnimalForm
            editing={null}
            onSave={handleSave}
            onCancelEdit={() => {}}
          />
          <BreedingPanel animals={animals} onBreed={handleBreed} />
        </div>

        <div className="mt-6">
          <AnimalTable animals={animals} onUpdate={handleUpdate} onDelete={handleDelete} />
        </div>

        <div className="mt-6">
          <PregnantTable animals={animals} onClear={clearPregnancy} />
        </div>

        <footer className="mt-10 text-center text-xs text-wurm-muted">
          <p>{t('footer')}</p>
          <a
            className="mt-1 inline-block text-wurm-accentDim hover:text-wurm-accent"
            href="https://www.wurmpedia.com/index.php/Animal_husbandry"
            target="_blank"
            rel="noreferrer"
          >
            {t('wurmpedia')}
          </a>
        </footer>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <HusbandryTool />
    </LanguageProvider>
  )
}
