'use client'

import Link from 'next/link'

export function CartBar({
  itemCount,
  total,
}: {
  itemCount: number
  total: number
}) {
  if (itemCount === 0) return null

  return (
    <Link href="/cart" className="cart-bar">
      <div className="cart-left">
        <span className="cart-count">{itemCount}</span>
        <span className="cart-text">Ver carrito</span>
      </div>
      <span className="cart-total">${total.toFixed(2)}</span>

      <style jsx>{`
        .cart-bar {
          position: fixed;
          bottom: calc(60px + env(safe-area-inset-bottom) + 12px);
          left: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          background: linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%);
          border-radius: 16px;
          text-decoration: none;
          box-shadow:
            0 8px 32px rgba(255, 107, 53, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.2);
          z-index: 95;
          animation: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }

        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .cart-bar:active {
          transform: scale(0.98);
        }

        .cart-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cart-count {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 26px;
          height: 26px;
          padding: 0 0.5rem;
          background: white;
          color: #FF6B35;
          border-radius: 13px;
          font-size: 0.8125rem;
          font-weight: 800;
        }

        .cart-text {
          color: white;
          font-size: 0.9375rem;
          font-weight: 700;
        }

        .cart-total {
          color: white;
          font-size: 1.0625rem;
          font-weight: 800;
        }
      `}</style>
    </Link>
  )
}
