'use client'

import { useEffect } from 'react'

export default function ConsoleEasterEgg() {
  useEffect(() => {
    // ASCII Art Pizza
    const pizzaArt = `
%c
    ████████████████████████████████████████
    ██                                    ██
    ██   🍕 SIMMER DOWN PIZZA 🍕          ██
    ██                                    ██
    ██        ░░░▓▓▓▓▓▓▓▓░░░             ██
    ██      ░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░            ██
    ██    ░▓▓▓🍅▓▓▓▓▓🧀▓▓▓▓▓░░           ██
    ██   ░▓▓▓▓▓▓▓🫒▓▓▓▓▓▓▓▓▓░░           ██
    ██   ░▓▓▓▓🌿▓▓▓▓▓▓▓🍅▓▓▓░░           ██
    ██    ░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░            ██
    ██      ░░▓▓▓▓▓▓▓▓▓▓░░░              ██
    ██         ░░░░░░░░░                  ██
    ██                                    ██
    ██   72-Hour Fermented Dough          ██
    ██   900°F Wood-Fired Oven            ██
    ██   Naples-Trained Chef              ██
    ██                                    ██
    ████████████████████████████████████████

    🔥 We're hiring developers who love pizza!
    📧 dev@simmerdown.sv

    Try typing: SimmerDown.secretMenu()
`

    console.log(
      pizzaArt,
      'font-family: monospace; color: #f97316; font-size: 10px; line-height: 1.2;'
    )

    // Add a secret function to window
    if (typeof window !== 'undefined') {
      (window as any).SimmerDown = {
        secretMenu: () => {
          console.log('%c🍕 SECRET MENU UNLOCKED! 🍕', 'font-size: 20px; color: #f97316;')
          console.log('%c• The "Midnight Munchies" - Double pepperoni, extra cheese, garlic butter crust', 'color: #fbbf24;')
          console.log('%c• The "Developer Special" - Coffee-rubbed bacon, hot honey, mascarpone', 'color: #fbbf24;')
          console.log('%c• The "Bug Fix" - Everything but the kitchen sink (it\'s in QA)', 'color: #fbbf24;')
          console.log('%cAsk your server about these off-menu items! 🤫', 'color: #9ca3af; font-style: italic;')
          return '🍕'
        },
        version: () => {
          console.log('%cSimmer Down Website v2.0.0', 'color: #22c55e;')
          console.log('%cBaked with ❤️ in El Salvador', 'color: #f97316;')
          console.log('%cStack: Next.js 16 • TypeScript • Tailwind • Supabase', 'color: #9ca3af;')
          return '🔥'
        },
        pizza: () => {
          const slices = ['🍕', '🍕', '🍕', '🍕', '🍕', '🍕', '🍕', '🍕']
          let i = 0
          const interval = setInterval(() => {
            if (i < slices.length) {
              console.log('%c' + slices.slice(0, i + 1).join(' '), 'font-size: 24px;')
              i++
            } else {
              clearInterval(interval)
              console.log('%c🍕 A whole pizza, just for you! 🍕', 'font-size: 16px; color: #f97316;')
            }
          }, 200)
          return '🔥 Baking...'
        }
      }
    }
  }, [])

  return null
}
