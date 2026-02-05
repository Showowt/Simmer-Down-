'use client'

import { useEffect, useState } from 'react'

export default function ConsoleEasterEgg() {
  const [konamiActive, setKonamiActive] = useState(false)

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

    Try: SimmerDown.secretMenu() | Konami code: ↑↑↓↓←→←→BA
`

    console.log(
      pizzaArt,
      'font-family: monospace; color: #f97316; font-size: 10px; line-height: 1.2;'
    )

    // Add secret functions to window
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

    // Konami Code Easter Egg: ↑ ↑ ↓ ↓ ← → ← → B A
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
    let konamiIndex = 0

    const createPizzaRain = () => {
      const pizzaCount = 30
      for (let i = 0; i < pizzaCount; i++) {
        setTimeout(() => {
          const pizza = document.createElement('div')
          pizza.innerHTML = '🍕'
          pizza.style.cssText = `
            position: fixed;
            top: -50px;
            left: ${Math.random() * 100}%;
            font-size: ${20 + Math.random() * 30}px;
            pointer-events: none;
            z-index: 9999;
            animation: pizzaFall 3s linear forwards;
          `
          document.body.appendChild(pizza)
          setTimeout(() => pizza.remove(), 3000)
        }, i * 100)
      }

      // Add animation keyframes if not already present
      if (!document.getElementById('pizza-rain-styles')) {
        const style = document.createElement('style')
        style.id = 'pizza-rain-styles'
        style.textContent = `
          @keyframes pizzaFall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
        `
        document.head.appendChild(style)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === konamiCode[konamiIndex]) {
        konamiIndex++
        if (konamiIndex === konamiCode.length) {
          setKonamiActive(true)
          konamiIndex = 0
          console.log('%c🎮 KONAMI CODE ACTIVATED! 🍕', 'font-size: 24px; color: #f97316;')
          console.log('%cYou found the secret! Free breadsticks with your next order! Use code: KONAMI', 'font-size: 14px; color: #22c55e;')
          createPizzaRain()
        }
      } else {
        konamiIndex = 0
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}
