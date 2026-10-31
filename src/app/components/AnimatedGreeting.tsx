import { useEffect, useState } from 'react'

const greetings = [
  { language: 'English', text: 'Have you eaten?' },
  { language: 'Yoruba', text: 'Ṣe o ti jẹun?' },
  { language: 'Nigerian Pidgin', text: 'You don chop?' },
  { language: 'Hausa', text: 'Kun ci abinci?' },
  { language: 'Igbo', text: 'Ị riri nri?' },
  { language: 'Arabic', text: 'هل أكلت؟', dir: 'rtl' },
] as const

export function AnimatedGreeting() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % greetings.length)
    }, 2500)

    return () => window.clearInterval(interval)
  }, [reducedMotion])

  const greeting = greetings[activeIndex]

  return (
    <span
      className="flex h-[1.15em] items-center overflow-hidden"
      aria-live="polite"
    >
      <span
        key={greeting.language}
        dir={greeting.dir ?? 'ltr'}
        className={
          reducedMotion
            ? ''
            : 'animate-in fade-in slide-in-from-bottom-2 duration-500'
        }
      >
        {greeting.text}
      </span>
    </span>
  )
}
